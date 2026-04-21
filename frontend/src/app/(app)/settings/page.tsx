"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { getOrgTeam, getServices } from "@/lib/api";
import { DEFAULT_THEME_COLOR_HEX } from "@/lib/brand-defaults";
import { getApiErrorMessage } from "@/lib/api/errors";
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
import { TeamTab } from "@/components/features/settings/TeamTab";
import { TeamScheduleTab } from "@/components/features/settings/team-schedule";
import { WorkingHoursTab } from "@/components/features/settings/WorkingHoursTab";
import {
  parseWorkingHoursFromApi,
  workingHoursToPayload,
  type DayScheduleRow,
} from "@/components/features/settings/working-hours-editor";
import {
  SETTINGS_TABS,
  WORKER_SETTINGS_TABS,
  type SettingsTabId,
} from "@/components/features/settings/types";
import { useOrganization } from "@/providers/organization-provider";
import { useAuth } from "@/providers/auth-provider";
import type { OrgTeamMember, WorkerProfile } from "@/types/user";
import type { Service } from "@/types/service";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const settingsTabs = isAdmin ? SETTINGS_TABS : WORKER_SETTINGS_TABS;
  const { settings, loading, patchSettingsWithOptimism } = useOrganization();
  const [tab, setTab] = useState<SettingsTabId>("salon");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [orgName, setOrgName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [themeColor, setThemeColor] = useState(DEFAULT_THEME_COLOR_HEX);
  const [timezone, setTimezone] = useState("Europe/Belgrade");
  const [bookingSlug, setBookingSlug] = useState("");
  const [publicSiteUrl, setPublicSiteUrl] = useState("");

  const [dayRows, setDayRows] = useState<DayScheduleRow[]>(() =>
    parseWorkingHoursFromApi(undefined)
  );

  const [minGap, setMinGap] = useState(30);
  const [maxClients, setMaxClients] = useState(4);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [bufferBetween, setBufferBetween] = useState(0);

  const [dayBefore, setDayBefore] = useState(true);
  const [twoHoursBefore, setTwoHoursBefore] = useState(true);
  const [dayBeforeHour, setDayBeforeHour] = useState(17);
  const [customReminderHours, setCustomReminderHours] = useState(0);
  const [channelSms, setChannelSms] = useState(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [noShowFollowup, setNoShowFollowup] = useState(false);

  const [autoConfirm, setAutoConfirm] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState("");
  const [noShowOffer, setNoShowOffer] = useState(false);

  const [publicBookingSms, setPublicBookingSms] = useState(true);
  const [publicBookingEmail, setPublicBookingEmail] = useState(false);
  const [publicBookingWhatsApp, setPublicBookingWhatsApp] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpPasswordConfigured, setSmtpPasswordConfigured] = useState(false);
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [twilioConfigured, setTwilioConfigured] = useState(false);

  const [currency, setCurrency] = useState("RSD");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);

  const [workerCanDelete, setWorkerCanDelete] = useState(false);

  const [team, setTeam] = useState<OrgTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamServices, setTeamServices] = useState<Service[]>([]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (!t) {
      return;
    }
    const adminIds = SETTINGS_TABS.map((x) => x.id);
    const workerIds = WORKER_SETTINGS_TABS.map((x) => x.id);
    const ok = isAdmin
      ? adminIds.includes(t as SettingsTabId)
      : workerIds.includes(t as SettingsTabId);
    if (ok) {
      setTab(t as SettingsTabId);
    }
  }, [searchParams, isAdmin]);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setOrgName(settings.name ?? "");
    const branding = settings.branding ?? {};
    setDisplayName(
      typeof branding.display_name === "string" ? branding.display_name : ""
    );
    setPhone(settings.phone ?? "");
    setAddress(settings.address ?? "");
    setLogoUrl(settings.logo ?? "");
    setInstagram(
      typeof branding.instagram === "string" ? branding.instagram : ""
    );
    setThemeColor(settings.theme_color ?? DEFAULT_THEME_COLOR_HEX);
    setTimezone(settings.timezone ?? "Europe/Belgrade");
    setBookingSlug(
      typeof settings.booking_slug === "string" ? settings.booking_slug : ""
    );
    setPublicSiteUrl(
      typeof settings.public_site_url === "string"
        ? settings.public_site_url
        : ""
    );
    setDayRows(
      parseWorkingHoursFromApi(
        settings.working_hours as Record<string, unknown> | undefined
      )
    );

    const cr = settings.calendar_rules ?? {};
    setMinGap(
      typeof cr.min_gap_minutes === "number" ? cr.min_gap_minutes : 30
    );
    setMaxClients(
      typeof cr.max_clients_per_hour === "number"
        ? cr.max_clients_per_hour
        : 4
    );
    setAllowOverlap(Boolean(cr.allow_overlap));
    setBufferBetween(
      typeof cr.buffer_between_minutes === "number"
        ? cr.buffer_between_minutes
        : 0
    );

    const r = settings.reminders ?? {};
    setDayBefore(Boolean(r.dayBefore ?? true));
    setTwoHoursBefore(Boolean(r.twoHoursBefore ?? true));
    const h = r.dayBeforeHour;
    setDayBeforeHour(
      typeof h === "number" && h >= 0 && h <= 23 ? h : 17
    );
    const crh = r.customReminderHours;
    setCustomReminderHours(
      typeof crh === "number" && crh > 0 ? crh : 0
    );
    setChannelSms(r.channelSms !== false);
    setChannelWhatsApp(r.channelWhatsApp !== false);
    setChannelEmail(r.channelEmail === true);
    setNoShowFollowup(Boolean(r.noShowFollowup));

    const au = settings.automation ?? {};
    setAutoConfirm(Boolean(au.auto_confirm_booking));
    setReminderTemplate(
      typeof au.reminder_template === "string" ? au.reminder_template : ""
    );
    setNoShowOffer(Boolean(au.no_show_offer_new_slot));

    const bn = settings.booking_notifications;
    if (bn && typeof bn === "object") {
      setPublicBookingSms(bn.public_booking_sms !== false);
      setPublicBookingEmail(bn.public_booking_email === true);
      setPublicBookingWhatsApp(bn.public_booking_whatsapp === true);
      const sm = bn.smtp;
      if (sm && typeof sm === "object") {
        setSmtpHost(typeof sm.host === "string" ? sm.host : "");
        setSmtpPort(
          typeof sm.port === "number" && sm.port > 0 ? sm.port : 587
        );
        setSmtpSecure(Boolean(sm.secure));
        setSmtpUser(typeof sm.user === "string" ? sm.user : "");
        setSmtpFromEmail(
          typeof sm.from_email === "string" ? sm.from_email : ""
        );
        setSmtpFromName(typeof sm.from_name === "string" ? sm.from_name : "");
        setSmtpPasswordConfigured(Boolean(sm.smtp_password_configured));
      } else {
        setSmtpPasswordConfigured(false);
      }
      setSmtpPassword("");
      setTwilioSid(
        typeof bn.twilio_account_sid === "string"
          ? bn.twilio_account_sid
          : ""
      );
      setTwilioFrom(typeof bn.twilio_from === "string" ? bn.twilio_from : "");
      setTwilioToken("");
      setTwilioConfigured(Boolean(bn.twilio_configured));
    } else {
      setPublicBookingSms(true);
      setPublicBookingEmail(false);
      setPublicBookingWhatsApp(false);
      setSmtpHost("");
      setSmtpPort(587);
      setSmtpSecure(false);
      setSmtpUser("");
      setSmtpPassword("");
      setSmtpPasswordConfigured(false);
      setSmtpFromEmail("");
      setSmtpFromName("");
      setTwilioSid("");
      setTwilioToken("");
      setTwilioFrom("");
      setTwilioConfigured(false);
    }

    const fin = settings.finance ?? {};
    setCurrency(typeof fin.currency === "string" ? fin.currency : "RSD");
    setVatEnabled(Boolean(fin.vat_enabled));
    setAcceptCash(fin.accept_cash !== false);
    setAcceptCard(fin.accept_card !== false);

    setWorkerCanDelete(Boolean(settings.worker_permissions?.can_delete));
  }, [settings]);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const { data } = await getOrgTeam();
      const rows = Array.isArray(data) ? data : [];
      setTeam(
        rows.map((m) => {
          const wp = m.worker_profile as WorkerProfile | undefined;
          const profile: WorkerProfile =
            wp && typeof wp === "object"
              ? {
                  service_ids: Array.isArray(wp.service_ids)
                    ? wp.service_ids
                    : [],
                  working_hours:
                    wp.working_hours && typeof wp.working_hours === "object"
                      ? wp.working_hours
                      : {},
                }
              : { service_ids: [], working_hours: {} };
          return {
            ...m,
            display_name: m.display_name ?? null,
            worker_profile: profile,
          };
        })
      );
    } catch {
      setTeam([]);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "team" || !isAdmin) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getServices();
        if (!cancelled) {
          setTeamServices(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setTeamServices([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "team" || tab === "team_schedule") {
      void loadTeam();
    }
  }, [tab, loadTeam]);

  useLayoutEffect(() => {
    if (!user || user.role === "admin") {
      return;
    }
    if (tab !== "team" && tab !== "team_schedule") {
      setTab("team");
    }
  }, [user, tab]);

  async function flashSave(fn: () => Promise<void>) {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await fn();
      setMessage("Sačuvano.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Čuvanje nije uspelo."));
    } finally {
      setSaving(false);
    }
  }

  const settingsDirty = useMemo(() => {
    if (!settings) {
      return false;
    }
    const whSame =
      JSON.stringify(workingHoursToPayload(dayRows)) ===
      JSON.stringify(settings.working_hours ?? {});
    const cr = settings.calendar_rules ?? {};
    const calSame =
      minGap === (typeof cr.min_gap_minutes === "number" ? cr.min_gap_minutes : 30) &&
      maxClients ===
        (typeof cr.max_clients_per_hour === "number"
          ? cr.max_clients_per_hour
          : 4) &&
      allowOverlap === Boolean(cr.allow_overlap) &&
      bufferBetween ===
        (typeof cr.buffer_between_minutes === "number"
          ? cr.buffer_between_minutes
          : 0);
    const fin = settings.finance ?? {};
    const finSame =
      currency === (typeof fin.currency === "string" ? fin.currency : "RSD") &&
      vatEnabled === Boolean(fin.vat_enabled) &&
      acceptCash === (fin.accept_cash !== false) &&
      acceptCard === (fin.accept_card !== false);

    const r = settings.reminders ?? {};
    const srvDayBefore = Boolean(r.dayBefore ?? true);
    const srvTwoHours = Boolean(r.twoHoursBefore ?? true);
    const dh = r.dayBeforeHour;
    const srvDayBeforeHour =
      typeof dh === "number" && dh >= 0 && dh <= 23 ? dh : 17;
    const crh = r.customReminderHours;
    const srvCustomReminder =
      typeof crh === "number" && crh > 0 ? crh : 0;
    const remindersSame =
      dayBefore === srvDayBefore &&
      twoHoursBefore === srvTwoHours &&
      dayBeforeHour === srvDayBeforeHour &&
      customReminderHours === srvCustomReminder &&
      channelSms === (r.channelSms !== false) &&
      channelWhatsApp === (r.channelWhatsApp !== false) &&
      channelEmail === (r.channelEmail === true) &&
      noShowFollowup === Boolean(r.noShowFollowup);

    const au = settings.automation ?? {};
    const srvReminderTemplate =
      typeof au.reminder_template === "string" ? au.reminder_template : "";
    const automationSame =
      autoConfirm === Boolean(au.auto_confirm_booking) &&
      reminderTemplate.trim() === srvReminderTemplate.trim() &&
      noShowOffer === Boolean(au.no_show_offer_new_slot);

    const bn = settings.booking_notifications;
    let srvPbSms = true;
    let srvPbEmail = false;
    let srvPbWa = false;
    let srvSmtpHost = "";
    let srvSmtpPort = 587;
    let srvSmtpSecure = false;
    let srvSmtpUser = "";
    let srvSmtpFromEmail = "";
    let srvSmtpFromName = "";
    let srvTwilioSid = "";
    let srvTwilioFrom = "";
    if (bn && typeof bn === "object") {
      srvPbSms = bn.public_booking_sms !== false;
      srvPbEmail = bn.public_booking_email === true;
      srvPbWa = bn.public_booking_whatsapp === true;
      const sm = bn.smtp;
      if (sm && typeof sm === "object") {
        srvSmtpHost = typeof sm.host === "string" ? sm.host : "";
        srvSmtpPort =
          typeof sm.port === "number" && sm.port > 0 ? sm.port : 587;
        srvSmtpSecure = Boolean(sm.secure);
        srvSmtpUser = typeof sm.user === "string" ? sm.user : "";
        srvSmtpFromEmail =
          typeof sm.from_email === "string" ? sm.from_email : "";
        srvSmtpFromName =
          typeof sm.from_name === "string" ? sm.from_name : "";
      }
      srvTwilioSid =
        typeof bn.twilio_account_sid === "string"
          ? bn.twilio_account_sid
          : "";
      srvTwilioFrom =
        typeof bn.twilio_from === "string" ? bn.twilio_from : "";
    }
    const notificationsSame =
      publicBookingSms === srvPbSms &&
      publicBookingEmail === srvPbEmail &&
      publicBookingWhatsApp === srvPbWa &&
      smtpHost.trim() === srvSmtpHost.trim() &&
      smtpPort === srvSmtpPort &&
      smtpSecure === srvSmtpSecure &&
      smtpUser.trim() === srvSmtpUser.trim() &&
      smtpFromEmail.trim() === srvSmtpFromEmail.trim() &&
      smtpFromName.trim() === srvSmtpFromName.trim() &&
      twilioSid.trim() === srvTwilioSid.trim() &&
      twilioFrom.trim() === srvTwilioFrom.trim() &&
      smtpPassword.trim() === "" &&
      twilioToken.trim() === "";

    return (
      orgName.trim() !== (settings.name ?? "").trim() ||
      displayName.trim() !==
        (typeof settings.branding?.display_name === "string"
          ? settings.branding.display_name
          : ""
        ).trim() ||
      phone.trim() !== (settings.phone ?? "").trim() ||
      address.trim() !== (settings.address ?? "").trim() ||
      logoUrl.trim() !== (settings.logo ?? "").trim() ||
      instagram.trim() !==
        (typeof settings.branding?.instagram === "string"
          ? settings.branding.instagram
          : ""
        ).trim() ||
      themeColor.trim() !==
        (settings.theme_color ?? DEFAULT_THEME_COLOR_HEX).trim() ||
      timezone.trim() !== (settings.timezone ?? "Europe/Belgrade").trim() ||
      bookingSlug.trim() !==
        (typeof settings.booking_slug === "string" ? settings.booking_slug : "") ||
      publicSiteUrl.trim() !==
        (typeof settings.public_site_url === "string"
          ? settings.public_site_url
          : ""
        ).trim() ||
      !whSame ||
      !calSame ||
      !finSame ||
      !remindersSame ||
      !automationSame ||
      !notificationsSame ||
      workerCanDelete !== Boolean(settings.worker_permissions?.can_delete)
    );
  }, [
    settings,
    orgName,
    displayName,
    phone,
    address,
    logoUrl,
    instagram,
    themeColor,
    timezone,
    bookingSlug,
    publicSiteUrl,
    dayRows,
    minGap,
    maxClients,
    allowOverlap,
    bufferBetween,
    currency,
    vatEnabled,
    acceptCash,
    acceptCard,
    workerCanDelete,
    dayBefore,
    twoHoursBefore,
    dayBeforeHour,
    customReminderHours,
    channelSms,
    channelWhatsApp,
    channelEmail,
    noShowFollowup,
    autoConfirm,
    reminderTemplate,
    noShowOffer,
    publicBookingSms,
    publicBookingEmail,
    publicBookingWhatsApp,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPassword,
    smtpFromEmail,
    smtpFromName,
    twilioSid,
    twilioToken,
    twilioFrom,
  ]);

  if (loading || !settings) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 px-1 pb-10">
        <div className="space-y-3 border-b border-zinc-200/90 pb-6 dark:border-zinc-800">
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
      <div
        className="sticky top-0 z-30 -mx-1 space-y-4 border-b border-zinc-200/90 bg-background/95 px-1 pb-4 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 dark:border-zinc-800 dark:bg-background/95"
      >
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Podešavanja
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {isAdmin
              ? "Upravljaj studiom, timom i rezervacijama (lepota, masaža, wellness)."
              : "Pregled članova tima. Za izmene salona i finansija obrati se administratoru."}
          </p>
        </div>
        <SettingsTabBar tabs={settingsTabs} active={tab} onChange={setTab} />
      </div>

      {isAdmin && settingsDirty ? (
        <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
          Imaš <strong>nesačuvane izmene</strong> u podešavanjima — sačuvaj tab na
          kom si radio.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          {message}
        </div>
      ) : null}

      <SurfaceCard
        padding="md"
        className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        {isAdmin && tab === "salon" ? (
          <SalonTab
            saving={saving}
            orgName={orgName}
            setOrgName={setOrgName}
            displayName={displayName}
            setDisplayName={setDisplayName}
            phone={phone}
            setPhone={setPhone}
            address={address}
            setAddress={setAddress}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            instagram={instagram}
            setInstagram={setInstagram}
            themeColor={themeColor}
            setThemeColor={setThemeColor}
            timezone={timezone}
            setTimezone={setTimezone}
            bookingSlug={bookingSlug}
            setBookingSlug={setBookingSlug}
            publicSiteUrl={publicSiteUrl}
            setPublicSiteUrl={setPublicSiteUrl}
            onSave={() =>
              flashSave(async () => {
                const trimmedPublic = publicSiteUrl.trim().replace(/\/$/, "");
                await patchSettingsWithOptimism({
                  name: orgName.trim(),
                  phone: phone.trim() || null,
                  address: address.trim() || null,
                  logo: logoUrl.trim() || null,
                  theme_color: themeColor.trim() || null,
                  timezone: timezone.trim() || null,
                  booking_slug:
                    bookingSlug.trim() === "" ? null : bookingSlug.trim(),
                  settings: {
                    branding: {
                      display_name: displayName.trim(),
                      instagram: instagram.trim(),
                    },
                    public_site_url:
                      trimmedPublic === "" ? null : trimmedPublic,
                  },
                });
              })
            }
          />
        ) : null}

        {tab === "team" ? (
          <TeamTab
            team={team}
            teamLoading={teamLoading}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            services={teamServices}
            onTeamChanged={() => void loadTeam()}
          />
        ) : null}

        {tab === "team_schedule" ? (
          <TeamScheduleTab
            team={team}
            teamLoading={teamLoading}
            isAdmin={isAdmin}
            onTeamChanged={() => void loadTeam()}
          />
        ) : null}

        {isAdmin && tab === "services" ? <ServicesTab /> : null}

        {isAdmin && tab === "hours" ? (
          <WorkingHoursTab
            saving={saving}
            dayRows={dayRows}
            setDayRows={setDayRows}
            onSave={() =>
              flashSave(async () => {
                await patchSettingsWithOptimism({
                  working_hours: workingHoursToPayload(dayRows),
                });
              })
            }
          />
        ) : null}

        {isAdmin && tab === "calendar" ? (
          <CalendarTab
            saving={saving}
            minGap={minGap}
            setMinGap={setMinGap}
            maxClients={maxClients}
            setMaxClients={setMaxClients}
            bufferBetween={bufferBetween}
            setBufferBetween={setBufferBetween}
            allowOverlap={allowOverlap}
            setAllowOverlap={setAllowOverlap}
            onSave={() =>
              flashSave(async () => {
                await patchSettingsWithOptimism({
                  settings: {
                    calendar_rules: {
                      min_gap_minutes: minGap,
                      max_clients_per_hour: maxClients,
                      allow_overlap: allowOverlap,
                      buffer_between_minutes: bufferBetween,
                    },
                  },
                });
              })
            }
          />
        ) : null}

        {isAdmin && tab === "notify" ? (
          <NotificationsTab
            saving={saving}
            dayBefore={dayBefore}
            setDayBefore={setDayBefore}
            twoHoursBefore={twoHoursBefore}
            setTwoHoursBefore={setTwoHoursBefore}
            dayBeforeHour={dayBeforeHour}
            setDayBeforeHour={setDayBeforeHour}
            customReminderHours={customReminderHours}
            setCustomReminderHours={setCustomReminderHours}
            channelSms={channelSms}
            setChannelSms={setChannelSms}
            channelWhatsApp={channelWhatsApp}
            setChannelWhatsApp={setChannelWhatsApp}
            channelEmail={channelEmail}
            setChannelEmail={setChannelEmail}
            noShowFollowup={noShowFollowup}
            setNoShowFollowup={setNoShowFollowup}
            autoConfirm={autoConfirm}
            setAutoConfirm={setAutoConfirm}
            reminderTemplate={reminderTemplate}
            setReminderTemplate={setReminderTemplate}
            noShowOffer={noShowOffer}
            setNoShowOffer={setNoShowOffer}
            publicBookingSms={publicBookingSms}
            setPublicBookingSms={setPublicBookingSms}
            publicBookingEmail={publicBookingEmail}
            setPublicBookingEmail={setPublicBookingEmail}
            publicBookingWhatsApp={publicBookingWhatsApp}
            setPublicBookingWhatsApp={setPublicBookingWhatsApp}
            smtpHost={smtpHost}
            setSmtpHost={setSmtpHost}
            smtpPort={smtpPort}
            setSmtpPort={setSmtpPort}
            smtpSecure={smtpSecure}
            setSmtpSecure={setSmtpSecure}
            smtpUser={smtpUser}
            setSmtpUser={setSmtpUser}
            smtpPassword={smtpPassword}
            setSmtpPassword={setSmtpPassword}
            smtpPasswordConfigured={smtpPasswordConfigured}
            smtpFromEmail={smtpFromEmail}
            setSmtpFromEmail={setSmtpFromEmail}
            smtpFromName={smtpFromName}
            setSmtpFromName={setSmtpFromName}
            twilioSid={twilioSid}
            setTwilioSid={setTwilioSid}
            twilioToken={twilioToken}
            setTwilioToken={setTwilioToken}
            twilioFrom={twilioFrom}
            setTwilioFrom={setTwilioFrom}
            twilioConfigured={twilioConfigured}
            onSave={() =>
              flashSave(async () => {
                await patchSettingsWithOptimism({
                  reminders: {
                    dayBefore,
                    twoHoursBefore,
                    dayBeforeHour,
                    customReminderHours:
                      customReminderHours > 0 ? customReminderHours : null,
                    channelSms,
                    channelWhatsApp,
                    channelEmail,
                    noShowFollowup,
                  },
                  settings: {
                    automation: {
                      auto_confirm_booking: autoConfirm,
                      reminder_template: reminderTemplate.trim(),
                      no_show_offer_new_slot: noShowOffer,
                    },
                    booking_notifications: {
                      public_booking_sms: publicBookingSms,
                      public_booking_email: publicBookingEmail,
                      public_booking_whatsapp: publicBookingWhatsApp,
                      smtp: {
                        host: smtpHost.trim(),
                        port: smtpPort,
                        secure: smtpSecure,
                        user: smtpUser.trim(),
                        password: smtpPassword.trim(),
                        from_email: smtpFromEmail.trim(),
                        from_name: smtpFromName.trim(),
                      },
                      twilio_account_sid: twilioSid.trim(),
                      twilio_auth_token: twilioToken.trim(),
                      twilio_from: twilioFrom.trim(),
                    },
                  },
                });
              })
            }
          />
        ) : null}

        {isAdmin && tab === "finance" ? (
          <FinanceTab
            saving={saving}
            currency={currency}
            setCurrency={setCurrency}
            vatEnabled={vatEnabled}
            setVatEnabled={setVatEnabled}
            acceptCash={acceptCash}
            setAcceptCash={setAcceptCash}
            acceptCard={acceptCard}
            setAcceptCard={setAcceptCard}
            onSave={() =>
              flashSave(async () => {
                await patchSettingsWithOptimism({
                  settings: {
                    finance: {
                      currency,
                      vat_enabled: vatEnabled,
                      accept_cash: acceptCash,
                      accept_card: acceptCard,
                    },
                  },
                });
              })
            }
          />
        ) : null}

        {isAdmin && tab === "loyalty" ? <LoyaltyTab /> : null}

        {isAdmin && tab === "billing" ? <BillingTab /> : null}

        {isAdmin && tab === "security" ? (
          <SecurityTab
            workerCanDelete={workerCanDelete}
            onWorkerCanDeleteChange={setWorkerCanDelete}
            saving={saving}
            permissionsDirty={
              workerCanDelete !==
              Boolean(settings.worker_permissions?.can_delete)
            }
            onSaveWorkerPermissions={() =>
              flashSave(async () => {
                await patchSettingsWithOptimism({
                  settings: {
                    worker_permissions: { can_delete: workerCanDelete },
                  },
                });
              })
            }
          />
        ) : null}
      </SurfaceCard>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-1 py-2 text-sm text-zinc-500 dark:text-zinc-400">
          Učitavanje podešavanja…
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
