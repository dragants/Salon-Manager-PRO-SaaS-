"use client";
import { useT } from "@/lib/i18n/locale";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const settingsFormSchema = z.object({
  name: z.string().min(2, "Ime je obavezno (min. 2 karaktera)."),
  phone: z.string().min(6, "Telefon nije validan (min. 6 karaktera)."),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

type Props = {
  /** Podrazumevane vrednosti (npr. iz Organization settings). */
  defaultValues?: Partial<SettingsFormValues>;
  onSubmit?: (data: SettingsFormValues) => void | Promise<void>;
  submitLabel?: string;
};

/**
 * Primer forme sa react-hook-form + Zod (UI kit integracija).
 * Ubaci u tab kad budeš vezivao na API; do tada je samostalan blok.
 */
export function SettingsForm({
  defaultValues,
  onSubmit = async () => {},
  submitLabel,
}: Props) {
  const t = useT();
  const submitText = submitLabel ?? t.common.save;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      phone: defaultValues?.phone ?? "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-md space-y-4"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="settings-form-name">Ime salona</Label>
        <Input
          id="settings-form-name"
          autoComplete="organization"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-form-phone">Telefon</Label>
        <Input
          id="settings-form-phone"
          type="tel"
          autoComplete="tel"
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        ) : null}
      </div>

      <Button type="submit" variant="brand" disabled={isSubmitting}>
        {isSubmitting ? t.common.loading : submitText}
      </Button>
    </form>
  );
}
