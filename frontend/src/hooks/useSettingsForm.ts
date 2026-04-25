"use client";

import {
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
import { useT } from "@/lib/i18n/locale";
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

/* ── Hook ── */

export function useSettingsForm() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const settingsTabs = isAdmin ? SETTINGS_TABS : WORKER_SETTINGS_TABS;
  const { settings, loading, patchSettingsWithOptimism } = useOrganization();
  const t = useT();

  const [tab, setTab] = useState<SettingsTabId>("salon");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Salon ── */
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

  /* ── Working hours ── */
  const [dayRows, setDayRows] = useState<DayScheduleRow[]>(() =>
    parseWorkingHoursFromApi(undefined)
  );

  /* ── Calendar rules ── */
  const [minGap, setMinGap] = useState(30);
  const [maxClients, setMaxClients] = useState(4);
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [bufferBetween, setBufferBetween] = useState(0);

  /* ── Notifications / reminders ── */
  const [dayBefore, setDayBefore] = useState(true);
  const [twoHoursBefore, setTwoHoursBefore] = useState(true);
  const [dayBeforeHour, setDayBeforeHour] = useState(17);
  const [customReminderHours, setCustomReminderHours] = useState(0);
  const [channelSms, setChannelSms] = useState(true);
  const [channelWhatsApp, setChannelWhatsApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [noShowFollowup, setNoShowFollowup] = useState(false);

  /* ── Automation ── */
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState("");
  const [noShowOffer, setNoShowOffer] = useState(false);

  /* ── Booking notifications / SMTP / Twilio ── */
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

  /* ── Finance ── */
  const [currency, setCurrency] = useState("RSD");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [acceptCash, setAcceptCash] = useState(true);
  const [acceptCard, setAcceptCard] = useState(true);

  /* ── Security ── */
  const [workerCanDelete, setWorkerCanDelete] = useState(false);

  /* ── Team ── */
  const [team, setTeam] = useState<OrgTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamServices, setTeamServices] = useState<Service[]>([]);

  /* ── Tab from URL ── */
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (!urlTab) return;
    const ids = (isAdmin ? SETTINGS_TABS : WORKER_SETTINGS_TABS).map((x) => x.id);
    if (ids.includes(urlTab as SettingsTabId)) setTab(urlTab as SettingsTabId);
  }, [searchParams, isAdmin]);

  /* ── Sync form state from org settings ── */
  useEffect(() => {
    if (!settings) return;
    setOrgName(settings.name ?? "");
    const branding = settings.branding ?? {};
    setDisplayName(typeof branding.display_name === "string" ? branding.display_name : "");
    setPhone(settings.phone ?? "");
    setAddress(settings.address ?? "");
    setLogoUrl(settings.logo ?? "");
    setInstagram(typeof branding.instagram === "string" ? branding.instagram : "");
    setThemeColor(settings.theme_color ?? DEFAULT_THEME_COLOR_HEX);
    setTimezone(settings.timezone ?? "Europe/Belgrade");
    setBookingSlug(typeof settings.booking_slug === "string" ? settings.booking_slug : "");
    setPublicSiteUrl(typeof settings.public_site_url === "string" ? settings.public_site_url : "");
    setDayRows(parseWorkingHoursFromApi(settings.working_hours as Record<string, unknown> | undefined));

    const cr = settings.calendar_rules ?? {};
    setMinGap(typeof cr.min_gap_minutes === "number" ? cr.min_gap_minutes : 30);
    setMaxClients(typeof cr.max_clients_per_hour === "number" ? cr.max_clients_per_hour : 4);
    setAllowOverlap(Boolean(cr.allow_overlap));
    setBufferBetween(typeof cr.buffer_between_minutes === "number" ? cr.buffer_between_minutes : 0);

    const r = settings.reminders ?? {};
    setDayBefore(Boolean(r.dayBefore ?? true));
    setTwoHoursBefore(Boolean(r.twoHoursBefore ?? true));
    const h = r.dayBeforeHour;
    setDayBeforeHour(typeof h === "number" && h >= 0 && h <= 23 ? h : 17);
    const crh = r.customReminderHours;
    setCustomReminderHours(typeof crh === "number" && crh > 0 ? crh : 0);
    setChannelSms(r.channelSms !== false);
    setChannelWhatsApp(r.channelWhatsApp !== false);
    setChannelEmail(r.channelEmail === true);
    setNoShowFollowup(Boolean(r.noShowFollowup));

    const au = settings.automation ?? {};
    setAutoConfirm(Boolean(au.auto_confirm_booking));
    setReminderTemplate(typeof au.reminder_template === "string" ? au.reminder_template : "");
    setNoShowOffer(Boolean(au.no_show_offer_new_slot));

    const bn = settings.booking_notifications;
    if (bn && typeof bn === "object") {
      setPublicBookingSms(bn.public_booking_sms !== false);
      setPublicBookingEmail(bn.public_booking_email === true);
      setPublicBookingWhatsApp(bn.public_booking_whatsapp === true);
      const sm = bn.smtp;
      if (sm && typeof sm === "object") {
        setSmtpHost(typeof sm.host === "string" ? sm.host : "");
        setSmtpPort(typeof sm.port === "number" && sm.port > 0 ? sm.port : 587);
        setSmtpSecure(Boolean(sm.secure));
        setSmtpUser(typeof sm.user === "string" ? sm.user : "");
        setSmtpFromEmail(typeof sm.from_email === "string" ? sm.from_email : "");
        setSmtpFromName(typeof sm.from_name === "string" ? sm.from_name : "");
        setSmtpPasswordConfigured(Boolean(sm.smtp_password_configured));
      } else {
        setSmtpPasswordConfigured(false);
      }
      setSmtpPassword("");
      setTwilioSid(typeof bn.twilio_account_sid === "string" ? bn.twilio_account_sid : "");
      setTwilioFrom(typeof bn.twilio_from === "string" ? bn.twilio_from : "");
      setTwilioToken("");
      setTwilioConfigured(Boolean(bn.twilio_configured));
    } else {
      setPublicBookingSms(true); setPublicBookingEmail(false); setPublicBookingWhatsApp(false);
      setSmtpHost(""); setSmtpPort(587); setSmtpSecure(false); setSmtpUser("");
      setSmtpPassword(""); setSmtpPasswordConfigured(false); setSmtpFromEmail(""); setSmtpFromName("");
      setTwilioSid(""); setTwilioToken(""); setTwilioFrom(""); setTwilioConfigured(false);
    }

    const fin = settings.finance ?? {};
    setCurrency(typeof fin.currency === "string" ? fin.currency : "RSD");
    setVatEnabled(Boolean(fin.vat_enabled));
    setAcceptCash(fin.accept_cash !== false);
    setAcceptCard(fin.accept_card !== false);
    setWorkerCanDelete(Boolean(settings.worker_permissions?.can_delete));
  }, [settings]);

  /* ── Load team ── */
  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const { data } = await getOrgTeam();
      const rows = Array.isArray(data) ? data : [];
      setTeam(rows.map((m) => {
        const wp = m.worker_profile as WorkerProfile | undefined;
        const profile: WorkerProfile = wp && typeof wp === "object"
          ? { service_ids: Array.isArray(wp.service_ids) ? wp.service_ids : [], working_hours: wp.working_hours && typeof wp.working_hours === "object" ? wp.working_hours : {} }
          : { service_ids: [], working_hours: {} };
        return { ...m, display_name: m.display_name ?? null, worker_profile: profile };
      }));
    } catch { setTeam([]); }
    finally { setTeamLoading(false); }
  }, []);

  useEffect(() => {
    if (tab !== "team" || !isAdmin) return;
    let c = false;
    void (async () => {
      try { const { data } = await getServices(); if (!c) setTeamServices(Array.isArray(data) ? data : []); }
      catch { if (!c) setTeamServices([]); }
    })();
    return () => { c = true; };
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab === "team" || tab === "team_schedule") void loadTeam();
  }, [tab, loadTeam]);

  useLayoutEffect(() => {
    if (!user || user.role === "admin") return;
    if (tab !== "team" && tab !== "team_schedule") setTab("team");
  }, [user, tab]);

  /* ── Flash save ── */
  async function flashSave(fn: () => Promise<void>) {
    setError(null); setMessage(null); setSaving(true);
    try { await fn(); setMessage(t.common.toasts.saved); }
    catch (err) { setError(getApiErrorMessage(err, t.common.toasts.error)); }
    finally { setSaving(false); }
  }

  /* ── Dirty check ── */
  const settingsDirty = useMemo(() => {
    if (!settings) return false;
    const whSame = JSON.stringify(workingHoursToPayload(dayRows)) === JSON.stringify(settings.working_hours ?? {});
    const cr = settings.calendar_rules ?? {};
    const calSame = minGap === (typeof cr.min_gap_minutes === "number" ? cr.min_gap_minutes : 30) && maxClients === (typeof cr.max_clients_per_hour === "number" ? cr.max_clients_per_hour : 4) && allowOverlap === Boolean(cr.allow_overlap) && bufferBetween === (typeof cr.buffer_between_minutes === "number" ? cr.buffer_between_minutes : 0);
    const fin = settings.finance ?? {};
    const finSame = currency === (typeof fin.currency === "string" ? fin.currency : "RSD") && vatEnabled === Boolean(fin.vat_enabled) && acceptCash === (fin.accept_cash !== false) && acceptCard === (fin.accept_card !== false);
    const r = settings.reminders ?? {};
    const remindersSame = dayBefore === Boolean(r.dayBefore ?? true) && twoHoursBefore === Boolean(r.twoHoursBefore ?? true) && dayBeforeHour === (typeof r.dayBeforeHour === "number" && r.dayBeforeHour >= 0 && r.dayBeforeHour <= 23 ? r.dayBeforeHour : 17) && customReminderHours === (typeof r.customReminderHours === "number" && r.customReminderHours > 0 ? r.customReminderHours : 0) && channelSms === (r.channelSms !== false) && channelWhatsApp === (r.channelWhatsApp !== false) && channelEmail === (r.channelEmail === true) && noShowFollowup === Boolean(r.noShowFollowup);
    const au = settings.automation ?? {};
    const automationSame = autoConfirm === Boolean(au.auto_confirm_booking) && reminderTemplate.trim() === (typeof au.reminder_template === "string" ? au.reminder_template : "").trim() && noShowOffer === Boolean(au.no_show_offer_new_slot);
    return orgName.trim() !== (settings.name ?? "").trim() || displayName.trim() !== (typeof settings.branding?.display_name === "string" ? settings.branding.display_name : "").trim() || phone.trim() !== (settings.phone ?? "").trim() || address.trim() !== (settings.address ?? "").trim() || logoUrl.trim() !== (settings.logo ?? "").trim() || instagram.trim() !== (typeof settings.branding?.instagram === "string" ? settings.branding.instagram : "").trim() || themeColor.trim() !== (settings.theme_color ?? DEFAULT_THEME_COLOR_HEX).trim() || timezone.trim() !== (settings.timezone ?? "Europe/Belgrade").trim() || bookingSlug.trim() !== (typeof settings.booking_slug === "string" ? settings.booking_slug : "") || publicSiteUrl.trim() !== (typeof settings.public_site_url === "string" ? settings.public_site_url : "").trim() || !whSame || !calSame || !finSame || !remindersSame || !automationSame || workerCanDelete !== Boolean(settings.worker_permissions?.can_delete);
  }, [settings, orgName, displayName, phone, address, logoUrl, instagram, themeColor, timezone, bookingSlug, publicSiteUrl, dayRows, minGap, maxClients, allowOverlap, bufferBetween, currency, vatEnabled, acceptCash, acceptCard, workerCanDelete, dayBefore, twoHoursBefore, dayBeforeHour, customReminderHours, channelSms, channelWhatsApp, channelEmail, noShowFollowup, autoConfirm, reminderTemplate, noShowOffer]);

  /* ── Save builders ── */
  const saveSalon = () => flashSave(async () => {
    const trimmedPublic = publicSiteUrl.trim().replace(/\/$/, "");
    await patchSettingsWithOptimism({ name: orgName.trim(), phone: phone.trim() || null, address: address.trim() || null, logo: logoUrl.trim() || null, theme_color: themeColor.trim() || null, timezone: timezone.trim() || null, booking_slug: bookingSlug.trim() === "" ? null : bookingSlug.trim(), settings: { branding: { display_name: displayName.trim(), instagram: instagram.trim() }, public_site_url: trimmedPublic === "" ? null : trimmedPublic } });
  });

  const saveHours = () => flashSave(async () => {
    await patchSettingsWithOptimism({ working_hours: workingHoursToPayload(dayRows) });
  });

  const saveCalendar = () => flashSave(async () => {
    await patchSettingsWithOptimism({ settings: { calendar_rules: { min_gap_minutes: minGap, max_clients_per_hour: maxClients, allow_overlap: allowOverlap, buffer_between_minutes: bufferBetween } } });
  });

  const saveNotifications = () => flashSave(async () => {
    await patchSettingsWithOptimism({
      reminders: { dayBefore, twoHoursBefore, dayBeforeHour, customReminderHours: customReminderHours > 0 ? customReminderHours : null, channelSms, channelWhatsApp, channelEmail, noShowFollowup },
      settings: { automation: { auto_confirm_booking: autoConfirm, reminder_template: reminderTemplate.trim(), no_show_offer_new_slot: noShowOffer }, booking_notifications: { public_booking_sms: publicBookingSms, public_booking_email: publicBookingEmail, public_booking_whatsapp: publicBookingWhatsApp, smtp: { host: smtpHost.trim(), port: smtpPort, secure: smtpSecure, user: smtpUser.trim(), password: smtpPassword.trim(), from_email: smtpFromEmail.trim(), from_name: smtpFromName.trim() }, twilio_account_sid: twilioSid.trim(), twilio_auth_token: twilioToken.trim(), twilio_from: twilioFrom.trim() } },
    });
  });

  const saveFinance = () => flashSave(async () => {
    await patchSettingsWithOptimism({ settings: { finance: { currency, vat_enabled: vatEnabled, accept_cash: acceptCash, accept_card: acceptCard } } });
  });

  const saveSecurity = () => flashSave(async () => {
    await patchSettingsWithOptimism({ settings: { worker_permissions: { can_delete: workerCanDelete } } });
  });

  return {
    // Meta
    user, isAdmin, settings, loading, settingsTabs, tab, setTab,
    saving, message, error, settingsDirty, t,
    // Salon
    orgName, setOrgName, displayName, setDisplayName, phone, setPhone,
    address, setAddress, logoUrl, setLogoUrl, instagram, setInstagram,
    themeColor, setThemeColor, timezone, setTimezone,
    bookingSlug, setBookingSlug, publicSiteUrl, setPublicSiteUrl,
    saveSalon,
    // Working hours
    dayRows, setDayRows, saveHours,
    // Calendar
    minGap, setMinGap, maxClients, setMaxClients,
    allowOverlap, setAllowOverlap, bufferBetween, setBufferBetween,
    saveCalendar,
    // Notifications
    dayBefore, setDayBefore, twoHoursBefore, setTwoHoursBefore,
    dayBeforeHour, setDayBeforeHour, customReminderHours, setCustomReminderHours,
    channelSms, setChannelSms, channelWhatsApp, setChannelWhatsApp,
    channelEmail, setChannelEmail, noShowFollowup, setNoShowFollowup,
    autoConfirm, setAutoConfirm, reminderTemplate, setReminderTemplate,
    noShowOffer, setNoShowOffer,
    publicBookingSms, setPublicBookingSms, publicBookingEmail, setPublicBookingEmail,
    publicBookingWhatsApp, setPublicBookingWhatsApp,
    smtpHost, setSmtpHost, smtpPort, setSmtpPort, smtpSecure, setSmtpSecure,
    smtpUser, setSmtpUser, smtpPassword, setSmtpPassword,
    smtpPasswordConfigured, smtpFromEmail, setSmtpFromEmail,
    smtpFromName, setSmtpFromName,
    twilioSid, setTwilioSid, twilioToken, setTwilioToken,
    twilioFrom, setTwilioFrom, twilioConfigured,
    saveNotifications,
    // Finance
    currency, setCurrency, vatEnabled, setVatEnabled,
    acceptCash, setAcceptCash, acceptCard, setAcceptCard,
    saveFinance,
    // Security
    workerCanDelete, setWorkerCanDelete, saveSecurity,
    // Team
    team, teamLoading, teamServices, loadTeam,
  };
}
