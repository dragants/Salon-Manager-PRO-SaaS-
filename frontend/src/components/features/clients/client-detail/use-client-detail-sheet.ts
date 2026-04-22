"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import {
  createClientChartEntry,
  deleteClient,
  downloadClientChartFile,
  getBillingStatus,
  getClientDetail,
  updateClient,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { fileToBase64Part } from "@/lib/clients-page-utils";
import type { ClientChartEntry, ClientDetail } from "@/types/client";
import {
  CLIENT_CHART_MAX_FILE_BYTES,
  CLIENT_CHART_MAX_FILES,
} from "./constants";
import type { ClientDetailCardTab } from "./constants";

type UseClientDetailSheetArgs = {
  open: boolean;
  clientId: number | null;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void | Promise<void>;
};

export function useClientDetailSheet({
  open,
  clientId,
  onOpenChange,
  onClientUpdated,
}: UseClientDetailSheetArgs) {
  const [cardTab, setCardTab] = useState<ClientDetailCardTab>("osnovno");
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const [kTitle, setKTitle] = useState("");
  const [kNotes, setKNotes] = useState("");
  const [kVisitAt, setKVisitAt] = useState("");
  const [kApptId, setKApptId] = useState("");
  const [kFiles, setKFiles] = useState<FileList | null>(null);
  const [kSaving, setKSaving] = useState(false);
  const [kError, setKError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDetail = useCallback(async (id: number) => {
    setDetailError(null);
    setDetailLoading(true);
    setDetail(null);
    setKError(null);
    setKTitle("");
    setKNotes("");
    setKVisitAt("");
    setKApptId("");
    setKFiles(null);
    try {
      const { data } = await getClientDetail(id);
      setDetail(data);
      setEditName(data.client.name);
      setEditPhone(data.client.phone ?? "");
      setEditEmail(data.client.email?.trim() ?? "");
      setEditNotes(data.client.notes ?? "");
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Kartica nije učitana."));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !clientId) {
      return;
    }
    setCardTab("osnovno");
    void loadDetail(clientId);
  }, [open, clientId, loadDetail]);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setDetailError(null);
      setDeleteConfirm(false);
    }
  }, [open]);

  const refreshDetail = useCallback(async () => {
    const id = detail?.client.id;
    if (!id) return;
    setDetailLoading(true);
    try {
      const { data } = await getClientDetail(id);
      setDetail(data);
      setEditName(data.client.name);
      setEditPhone(data.client.phone ?? "");
      setEditEmail(data.client.email?.trim() ?? "");
      setEditNotes(data.client.notes ?? "");
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Osvežavanje nije uspelo."));
    } finally {
      setDetailLoading(false);
    }
  }, [detail?.client.id]);

  const onSaveClientBasics = useCallback(async () => {
    if (!detail) return;
    setCardSaving(true);
    setDetailError(null);
    try {
      await updateClient(detail.client.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        notes: editNotes.trim(),
      });
      await refreshDetail();
      await onClientUpdated();
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Čuvanje nije uspelo."));
    } finally {
      setCardSaving(false);
    }
  }, [
    detail,
    editEmail,
    editName,
    editNotes,
    editPhone,
    onClientUpdated,
    refreshDetail,
  ]);

  const onDeleteClient = useCallback(async () => {
    if (!detail) return;
    setDeleting(true);
    setDetailError(null);
    try {
      await deleteClient(detail.client.id);
      onOpenChange(false);
      setDetail(null);
      await onClientUpdated();
      void getBillingStatus().catch(() => {});
    } catch (e) {
      setDetailError(getApiErrorMessage(e, "Brisanje nije uspelo."));
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }, [detail, onClientUpdated, onOpenChange]);

  const onSaveKarton = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!detail) return;
      setKError(null);
      const files = kFiles ? Array.from(kFiles) : [];
      if (files.length > CLIENT_CHART_MAX_FILES) {
        setKError(`Najviše ${CLIENT_CHART_MAX_FILES} fajlova odjednom.`);
        return;
      }
      for (const f of files) {
        if (f.size > CLIENT_CHART_MAX_FILE_BYTES) {
          setKError(`Fajl „${f.name}“ je prevelik (max 5 MB).`);
          return;
        }
      }
      const payloads = [];
      for (const f of files) {
        payloads.push({
          filename: f.name,
          mime_type: f.type || "application/octet-stream",
          data_base64: await fileToBase64Part(f),
        });
      }
      setKSaving(true);
      try {
        await createClientChartEntry(detail.client.id, {
          visit_at: kVisitAt ? new Date(kVisitAt).toISOString() : undefined,
          title: kTitle.trim() || null,
          notes: kNotes.trim() || null,
          appointment_id: kApptId ? Number.parseInt(kApptId, 10) : null,
          files: payloads,
        });
        setKTitle("");
        setKNotes("");
        setKVisitAt("");
        setKApptId("");
        setKFiles(null);
        await refreshDetail();
      } catch (err) {
        setKError(getApiErrorMessage(err, "Unos u karton nije sačuvan."));
      } finally {
        setKSaving(false);
      }
    },
    [
      detail,
      kApptId,
      kFiles,
      kNotes,
      kTitle,
      kVisitAt,
      refreshDetail,
    ]
  );

  const onDownloadFile = useCallback(
    async (entry: ClientChartEntry, fileId: number) => {
      if (!detail) return;
      try {
        const blob = await downloadClientChartFile(detail.client.id, fileId);
        const att = entry.attachments.find((a) => a.id === fileId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = att?.original_name ?? "prilog";
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setDetailError("Preuzimanje fajla nije uspelo.");
        toast.error("Preuzimanje nije uspelo.");
      }
    },
    [detail]
  );

  return {
    cardTab,
    setCardTab,
    detail,
    detailLoading,
    detailError,
    editName,
    setEditName,
    editPhone,
    setEditPhone,
    editEmail,
    setEditEmail,
    editNotes,
    setEditNotes,
    cardSaving,
    kTitle,
    setKTitle,
    kNotes,
    setKNotes,
    kVisitAt,
    setKVisitAt,
    kApptId,
    setKApptId,
    kFiles,
    setKFiles,
    kSaving,
    kError,
    deleteConfirm,
    setDeleteConfirm,
    deleting,
    onSaveClientBasics,
    onDeleteClient,
    onSaveKarton,
    onDownloadFile,
  };
}
