"use client";

import { Suspense } from "react";
import { useT } from "@/lib/i18n/locale";
import { CalendarTab } from "@/components/features/settings/CalendarTab";
import { FinanceTab } from "@/components/features/settings/FinanceTab";
import { LoyaltyTab } from "@/components/features/settings/LoyaltyTab";
import { NotificationsTab } from "@/components/features/settings/NotificationsTab";
import { SalonTab } from "@/components/features/settings/SalonTab";
import { SecurityTab } from "@/components/features/settings/SecurityTab";
import { ServicesTab } from "@/components/features/settings/ServicesTab";
import { SurfaceCard } from "@/components/ui/surface-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsTabBar } from "@/components/features/settings/SettingsTabBar";
import { BillingTab } from "@/components/features/settings/BillingTab";
import { FeatureFlagsTab } from "@/components/features/settings/FeatureFlagsTab";
import { TeamTab } from "@/components/features/settings/TeamTab";
import { TeamScheduleTab } from "@/components/features/settings/team-schedule";
import { WorkingHoursTab } from "@/components/features/settings/WorkingHoursTab";
import { useSettingsForm } from "@/hooks/useSettingsForm";

function SettingsPageContent() {
  const s = useSettingsForm();
  const { t } = s;

  /* ── Loading skeleton ── */
  if (s.loading || !s.settings) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-1 pb-10">
        <div className="space-y-3 border-b border-border pb-6">
          <Skeleton className="h-9 w-48 rounded-lg sm:h-10" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-[5.5rem] rounded-lg" />
            ))}
          </div>
        </div>
        <SurfaceCard padding="lg" className="overflow-hidden">
          <Skeleton className="h-8 w-2/5 max-w-xs rounded-lg" />
          <Skeleton className="mt-6 h-12 w-full rounded-xl" />
          <Skeleton className="mt-4 h-12 w-full rounded-xl" />
          <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 pt-0 sm:space-y-8">
      {/* ── Sticky header + tab bar ── */}
      <div className="sticky top-0 z-30 -mx-1 space-y-4 border-b border-border bg-background/95 px-1 pb-4 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 dark:bg-background/95">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground dark:text-zinc-50 sm:text-3xl">
            {String(t.settings.title)}
          </h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground/70">
            {s.isAdmin
              ? "Upravljaj studiom, timom i rezervacijama (lepota, masaža, wellness)."
              : "Pregled članova tima. Za izmene salona i finansija obrati se administratoru."}
          </p>
        </div>
        <SettingsTabBar tabs={s.settingsTabs} active={s.tab} onChange={s.setTab} />
      </div>

      {/* ── Dirty banner ── */}
      {s.isAdmin && s.settingsDirty ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
          Imaš <strong>nesačuvane izmene</strong> u:{" "}
          {s.dirtyTabLabels.map((x, idx) => (
            <span key={x.id}>
              <strong className={x.id === s.tab ? "underline" : undefined}>
                {String(x.label)}
              </strong>
              {idx < s.dirtyTabLabels.length - 1 ? ", " : null}
            </span>
          ))}
          {s.activeTabDirty ? (
            <> — sačuvaj ovaj tab.</>
          ) : (
            <> — otvori tab i sačuvaj izmene.</>
          )}
        </div>
      ) : null}

      {/* ── Flash messages ── */}
      {s.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {String(s.error)}
        </div>
      ) : null}
      {s.message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {String(s.message)}
        </div>
      ) : null}

      {/* ── Tab content ── */}
      <SurfaceCard padding="md" className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        {s.isAdmin && s.tab === "salon" ? (
          <SalonTab
            saving={s.saving} orgName={s.orgName} setOrgName={s.setOrgName}
            displayName={s.displayName} setDisplayName={s.setDisplayName}
            phone={s.phone} setPhone={s.setPhone} address={s.address} setAddress={s.setAddress}
            logoUrl={s.logoUrl} setLogoUrl={s.setLogoUrl}
            instagram={s.instagram} setInstagram={s.setInstagram}
            themeColor={s.themeColor} setThemeColor={s.setThemeColor}
            timezone={s.timezone} setTimezone={s.setTimezone}
            bookingSlug={s.bookingSlug} setBookingSlug={s.setBookingSlug}
            publicSiteUrl={s.publicSiteUrl} setPublicSiteUrl={s.setPublicSiteUrl}
            onSave={s.saveSalon}
          />
        ) : null}

        {s.tab === "team" ? (
          <TeamTab team={s.team} teamLoading={s.teamLoading} isAdmin={s.isAdmin}
            currentUserId={s.user?.id} services={s.teamServices}
            onTeamChanged={() => void s.loadTeam()} />
        ) : null}

        {s.tab === "team_schedule" ? (
          <TeamScheduleTab team={s.team} teamLoading={s.teamLoading}
            isAdmin={s.isAdmin} onTeamChanged={() => void s.loadTeam()} />
        ) : null}

        {s.isAdmin && s.tab === "services" ? <ServicesTab /> : null}

        {s.isAdmin && s.tab === "hours" ? (
          <WorkingHoursTab saving={s.saving} dayRows={s.dayRows}
            setDayRows={s.setDayRows} onSave={s.saveHours} />
        ) : null}

        {s.isAdmin && s.tab === "calendar" ? (
          <CalendarTab saving={s.saving}
            minGap={s.minGap} setMinGap={s.setMinGap}
            maxClients={s.maxClients} setMaxClients={s.setMaxClients}
            bufferBetween={s.bufferBetween} setBufferBetween={s.setBufferBetween}
            allowOverlap={s.allowOverlap} setAllowOverlap={s.setAllowOverlap}
            onSave={s.saveCalendar} />
        ) : null}

        {s.isAdmin && s.tab === "notify" ? (
          <NotificationsTab saving={s.saving}
            dayBefore={s.dayBefore} setDayBefore={s.setDayBefore}
            twoHoursBefore={s.twoHoursBefore} setTwoHoursBefore={s.setTwoHoursBefore}
            dayBeforeHour={s.dayBeforeHour} setDayBeforeHour={s.setDayBeforeHour}
            customReminderHours={s.customReminderHours} setCustomReminderHours={s.setCustomReminderHours}
            channelSms={s.channelSms} setChannelSms={s.setChannelSms}
            channelWhatsApp={s.channelWhatsApp} setChannelWhatsApp={s.setChannelWhatsApp}
            channelEmail={s.channelEmail} setChannelEmail={s.setChannelEmail}
            noShowFollowup={s.noShowFollowup} setNoShowFollowup={s.setNoShowFollowup}
            autoConfirm={s.autoConfirm} setAutoConfirm={s.setAutoConfirm}
            reminderTemplate={s.reminderTemplate} setReminderTemplate={s.setReminderTemplate}
            noShowOffer={s.noShowOffer} setNoShowOffer={s.setNoShowOffer}
            publicBookingSms={s.publicBookingSms} setPublicBookingSms={s.setPublicBookingSms}
            publicBookingEmail={s.publicBookingEmail} setPublicBookingEmail={s.setPublicBookingEmail}
            publicBookingWhatsApp={s.publicBookingWhatsApp} setPublicBookingWhatsApp={s.setPublicBookingWhatsApp}
            smtpHost={s.smtpHost} setSmtpHost={s.setSmtpHost}
            smtpPort={s.smtpPort} setSmtpPort={s.setSmtpPort}
            smtpSecure={s.smtpSecure} setSmtpSecure={s.setSmtpSecure}
            smtpUser={s.smtpUser} setSmtpUser={s.setSmtpUser}
            smtpPassword={s.smtpPassword} setSmtpPassword={s.setSmtpPassword}
            smtpPasswordConfigured={s.smtpPasswordConfigured}
            smtpFromEmail={s.smtpFromEmail} setSmtpFromEmail={s.setSmtpFromEmail}
            smtpFromName={s.smtpFromName} setSmtpFromName={s.setSmtpFromName}
            twilioSid={s.twilioSid} setTwilioSid={s.setTwilioSid}
            twilioToken={s.twilioToken} setTwilioToken={s.setTwilioToken}
            twilioFrom={s.twilioFrom} setTwilioFrom={s.setTwilioFrom}
            twilioConfigured={s.twilioConfigured}
            onSave={s.saveNotifications} />
        ) : null}

        {s.isAdmin && s.tab === "finance" ? (
          <FinanceTab saving={s.saving}
            currency={s.currency} setCurrency={s.setCurrency}
            vatEnabled={s.vatEnabled} setVatEnabled={s.setVatEnabled}
            acceptCash={s.acceptCash} setAcceptCash={s.setAcceptCash}
            acceptCard={s.acceptCard} setAcceptCard={s.setAcceptCard}
            onSave={s.saveFinance} />
        ) : null}

        {s.isAdmin && s.tab === "loyalty" ? <LoyaltyTab /> : null}
        {s.isAdmin && s.tab === "billing" ? <BillingTab /> : null}

        {s.isAdmin && s.tab === "security" ? (
          <SecurityTab workerCanDelete={s.workerCanDelete}
            onWorkerCanDeleteChange={s.setWorkerCanDelete}
            saving={s.saving}
            permissionsDirty={s.workerCanDelete !== Boolean(s.settings.worker_permissions?.can_delete)}
            onSaveWorkerPermissions={s.saveSecurity} />
        ) : null}

        {s.isAdmin && s.tab === "flags" ? <FeatureFlagsTab /> : null}
      </SurfaceCard>
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-1 py-2 text-sm text-muted-foreground dark:text-muted-foreground/70">
          {String(t.common.loading)}
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
