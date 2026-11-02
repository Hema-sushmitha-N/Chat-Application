// Desktop notifications (the browser's Notification API). All of it is optional:
// if the browser does not support it or the user says no, the in-app toasts still work.

export function notificationPermission() {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

// Shows a desktop notification, but only while this tab is in the background
export function showDesktopNotification(title, body) {
  if (typeof document === 'undefined' || !document.hidden) return;
  if (notificationPermission() !== 'granted') return;
  try {
    new Notification(title, { body });
  } catch {
    // Some browsers refuse to create notifications from a page: ignore
  }
}
