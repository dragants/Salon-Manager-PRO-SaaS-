import { describe, expect, it, beforeEach } from "vitest";
import { getToken, clearToken } from "@/lib/auth/token";

describe("auth token", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("returns null when no token stored", () => {
    expect(getToken()).toBeNull();
  });

  it("reads from localStorage", () => {
    localStorage.setItem("token", "my-jwt");
    expect(getToken()).toBe("my-jwt");
  });

  it("reads from sessionStorage when localStorage empty", () => {
    sessionStorage.setItem("token_session", "session-jwt");
    expect(getToken()).toBe("session-jwt");
  });

  it("prefers localStorage over sessionStorage", () => {
    localStorage.setItem("token", "local-jwt");
    sessionStorage.setItem("token_session", "session-jwt");
    expect(getToken()).toBe("local-jwt");
  });

  it("clearToken removes from both storages", () => {
    localStorage.setItem("token", "local-jwt");
    sessionStorage.setItem("token_session", "session-jwt");
    clearToken();
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token_session")).toBeNull();
  });
});
