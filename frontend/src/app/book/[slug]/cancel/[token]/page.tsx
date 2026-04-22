"use client";

import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertTriangle, CalendarX2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelPublicBooking } from "@/lib/api/public-booking";

type CancelState = "idle" | "confirming" | "loading" | "success" | "error";

export default function CancelBookingPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const token = typeof params.token === "string" ? params.token : "";

  const [state, setState] = useState<CancelState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCancel = useCallback(async () => {
    if (!slug || !token) {
      setErrorMsg("Nevažeći link za otkazivanje.");
      setState("error");
      return;
    }
    setState("loading");
    try {
      await cancelPublicBooking(slug, token);
      setState("success");
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "Došlo je do greške pri otkazivanju."
      );
      setState("error");
    }
  }, [slug, token]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-md text-center">
        {/* ── Idle / Confirming ── */}
        {(state === "idle" || state === "confirming") && (
          <>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10">
              <CalendarX2 className="size-8 text-amber-500" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Otkazivanje termina
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Da li ste sigurni da želite da otkažete zakazani termin?
              Ova akcija se ne može poništiti.
            </p>
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              {state === "idle" ? (
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full rounded-xl sm:w-auto"
                  onClick={() => setState("confirming")}
                >
                  Otkaži termin
                </Button>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full rounded-xl sm:w-auto"
                    onClick={handleCancel}
                  >
                    Da, otkaži
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl border-border sm:w-auto"
                    onClick={() => setState("idle")}
                  >
                    Ne, zadrži termin
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Loading ── */}
        {state === "loading" && (
          <>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted">
              <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Otkazivanje u toku...</p>
          </>
        )}

        {/* ── Success ── */}
        {state === "success" && (
          <>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <CheckCircle2 className="size-8 text-emerald-500" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Termin je otkazan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Vaš termin je uspešno otkazan. Možete zatvoriti ovu stranicu.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              Želite ponovo da zakažete?{" "}
              <a
                href={`/book/${encodeURIComponent(slug)}`}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Zakažite novi termin
              </a>
            </p>
          </>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <>
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle className="size-8 text-red-500" aria-hidden />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Otkazivanje nije uspelo
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {errorMsg || "Termin nije pronađen ili je već otkazan."}
            </p>
            <div className="mt-8">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-border"
                onClick={() => {
                  setState("idle");
                  setErrorMsg(null);
                }}
              >
                Pokušaj ponovo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
