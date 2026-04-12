const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { UPLOAD_ROOT } = require("../config/env");

/** Relativna putanja od UPLOAD_ROOT: {orgId}/clients/{clientId}/ */
function clientDirRelative(orgId, clientId) {
  return path.join(String(orgId), "clients", String(clientId));
}

function clientDirAbsolute(orgId, clientId) {
  return path.join(UPLOAD_ROOT, clientDirRelative(orgId, clientId));
}

function ensureClientDir(orgId, clientId) {
  const dir = clientDirAbsolute(orgId, clientId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeBaseName(name) {
  const base = path.basename(name || "file");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

/**
 * Upisuje bajtove u folder klijenta. Vraća relativnu putanju (posix za DB konzistentnost).
 */
function writeClientFile(orgId, clientId, originalName, buf) {
  ensureClientDir(orgId, clientId);
  const safe = sanitizeBaseName(originalName);
  const unique = `${crypto.randomUUID()}_${safe}`;
  const abs = path.join(clientDirAbsolute(orgId, clientId), unique);
  fs.writeFileSync(abs, buf);
  const rel = path.join(clientDirRelative(orgId, clientId), unique);
  return rel.split(path.sep).join("/");
}

function resolveStoredFile(orgId, clientId, storagePath) {
  if (!storagePath || typeof storagePath !== "string") {
    return null;
  }
  const normalized = storagePath.split("/").join(path.sep);
  const clientRoot = path.normalize(
    path.join(UPLOAD_ROOT, clientDirRelative(orgId, clientId))
  );
  const full = path.normalize(path.join(UPLOAD_ROOT, normalized));
  if (
    full !== clientRoot &&
    !full.startsWith(clientRoot + path.sep)
  ) {
    return null;
  }
  return full;
}

function readClientFile(orgId, clientId, storagePath) {
  const full = resolveStoredFile(orgId, clientId, storagePath);
  if (!full || !fs.existsSync(full)) {
    return null;
  }
  return fs.readFileSync(full);
}

function deleteClientFolder(orgId, clientId) {
  const dir = clientDirAbsolute(orgId, clientId);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

module.exports = {
  clientDirRelative,
  clientDirAbsolute,
  ensureClientDir,
  writeClientFile,
  resolveStoredFile,
  readClientFile,
  deleteClientFolder,
};
