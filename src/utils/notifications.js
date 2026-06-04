const STORAGE_KEY = "healthcare_notifications";
const DISMISSED_REMINDERS_KEY = "healthcare_dismissed_reminders";
const EVENT_NAME = "healthcare:notifications-updated";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function readStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  return safeParse(localStorage.getItem(key), fallback);
}

function writeStorage(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function emitUpdate(detail = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function getNotifications() {
  return readStorage(STORAGE_KEY, []);
}

export function saveNotifications(notifications) {
  const normalized = Array.isArray(notifications) ? notifications.slice(0, 80) : [];
  writeStorage(STORAGE_KEY, normalized);
  emitUpdate({ notifications: normalized });
  return normalized;
}

export function addNotification(notification = {}) {
  const item = {
    id: notification.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: notification.type || "info",
    title: notification.title || "Notification",
    message: notification.message || "",
    createdAt: notification.createdAt || nowIso(),
    read: Boolean(notification.read),
    appointmentAt: notification.appointmentAt || "",
    appointmentType: notification.appointmentType || "",
    playSound: Boolean(notification.playSound),
    autoDismiss: notification.autoDismiss !== false,
  };
  const notifications = saveNotifications([item, ...getNotifications()]);
  emitUpdate({ notifications, toast: item });
  return item;
}

export function markAllNotificationsRead() {
  return saveNotifications(getNotifications().map(item => ({ ...item, read: true })));
}

export function removeNotification(id) {
  return saveNotifications(getNotifications().filter(item => item.id !== id));
}

export function clearNotifications() {
  return saveNotifications([]);
}

export function subscribeNotifications(callback) {
  if (typeof window === "undefined") return () => {};
  const handler = event => callback(event.detail || {});
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function formatAppointmentDateTime(date, time) {
  if (!date) return "the selected date";
  const dateTime = new Date(`${date}T${String(time || "00:00:00").slice(0, 8)}`);
  if (Number.isNaN(dateTime.getTime())) return date;
  return dateTime.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function notifyAppointmentBooked({ date, time, doctor, type }) {
  const appointmentAt = date && time ? `${date}T${String(time).slice(0, 8)}` : "";
  return addNotification({
    type: "appointment",
    title: "Appointment booked",
    message: `${doctor ? `With ${doctor} ` : ""}on ${formatAppointmentDateTime(date, time)}.`,
    appointmentAt,
    appointmentType: type || "follow_up",
    playSound: true,
  });
}

export function notifyAppointmentUpdated({ title, message }) {
  return addNotification({
    type: "appointment",
    title: title || "Appointment updated",
    message: message || "Your appointment details were updated.",
  });
}

export function notifyRecordUploaded({ title, type }) {
  return addNotification({
    type: "record",
    title: "Record uploaded",
    message: `${title || "Medical record"}${type ? ` (${type})` : ""} was uploaded successfully.`,
  });
}

export function notifyProfileUpdated() {
  return addNotification({
    type: "profile",
    title: "Profile updated",
    message: "Your profile changes were saved successfully.",
  });
}

function getDismissedReminderIds() {
  return readStorage(DISMISSED_REMINDERS_KEY, []);
}

function rememberReminder(id) {
  writeStorage(DISMISSED_REMINDERS_KEY, [...new Set([id, ...getDismissedReminderIds()])].slice(0, 200));
}

function reminderAlreadyHandled(id) {
  return getDismissedReminderIds().includes(id) || getNotifications().some(item => item.id === id);
}

function normalizeAppointmentTime(time) {
  const value = String(time || "00:00:00").trim();
  const ampmMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = Number(ampmMatch[1]);
    const minute = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}:00`;
  }
  return value.slice(0, 8);
}

function appointmentDate(appointment) {
  const date = appointment.appointment_date || appointment.date;
  const time = normalizeAppointmentTime(appointment.appointment_time || appointment.time);
  const parsed = new Date(`${date}T${time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function syncAppointmentReminders(appointments = []) {
  const now = Date.now();
  const upcoming = appointments.filter(item => {
    const status = String(item.status || "upcoming").toLowerCase();
    const when = appointmentDate(item);
    return when && when.getTime() > now && ["upcoming", "pending"].includes(status);
  });

  upcoming.forEach(item => {
    const when = appointmentDate(item);
    const type = String(item.appointment_type || item.type || "follow_up").toLowerCase();
    const reminderMs = type === "follow_up" || type === "regular" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const reminderTime = when.getTime() - reminderMs;
    const reminderId = `appt-reminder-${item.id || item.appointment_id || when.getTime()}-${reminderMs}`;

    if (now >= reminderTime && now < when.getTime() && !reminderAlreadyHandled(reminderId)) {
      addNotification({
        id: reminderId,
        type: "reminder",
        title: type === "follow_up" || type === "regular" ? "Appointment tomorrow" : "Appointment in 1 hour",
        message: `${item.doc || item.doctor || "Your doctor"} at ${formatAppointmentDateTime(item.appointment_date || item.date, item.appointment_time || item.time)}.`,
        appointmentAt: when.toISOString(),
        appointmentType: type,
        playSound: true,
      });
      rememberReminder(reminderId);
    }
  });
}
