
type NotificationListener = (title: string, body: string) => void;
let listeners: NotificationListener[] = [];

export function subscribeToInAppNotifications(listener: NotificationListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  // Use a user-triggered request if possible
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (e) {
    console.error('Permission request failed', e);
    return false;
  }
}

export function sendNotification(title: string, body: string, icon?: string) {
  // 1. Save to History (localStorage)
  try {
    const historyJson = localStorage.getItem('khata_notification_history');
    const history = historyJson ? JSON.parse(historyJson) : [];
    const newEntry = {
      id: Math.random().toString(36).substring(2, 11),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false
    };
    // Keep last 50 notifications
    const updatedHistory = [newEntry, ...history].slice(0, 50);
    localStorage.setItem('khata_notification_history', JSON.stringify(updatedHistory));
    
    // Trigger storage event for reactive updates in other components
    window.dispatchEvent(new Event('khata_notifications_updated'));
  } catch (e) {
    console.error('Failed to save notification history', e);
  }

  // 2. Notify in-app listeners (Toasts)
  listeners.forEach(l => l(title, body));

  // 2. Try System Notification
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'gram-khata-notif',
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.error('Failed to send system notification', e);
  }
}

/**
 * Checks and triggers periodic reminders
 * @param lastReminderTime ISO string or timestamp
 * @returns updated reminder time if triggered
 */
export function checkPeriodicReminders(lastReminderTimeStr: string | null): string | null {
  const now = new Date();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  
  if (!lastReminderTimeStr) {
    // First time initializing
    return now.toISOString();
  }

  const lastTime = new Date(lastReminderTimeStr);
  const diffInMs = now.getTime() - lastTime.getTime();

  // 1. Every 3 days reminder
  if (diffInMs > threeDaysInMs) {
    sendNotification(
      'Grama-Khata Status',
      'Don\'t forget to record your daily sales and collection entries!',
    );
    return now.toISOString();
  }

  // 2. Weekly summary (e.g., every Monday)
  const isMonday = now.getDay() === 1;
  const lastWeeklyStr = localStorage.getItem('last_weekly_notif');
  const lastWeekly = lastWeeklyStr ? new Date(lastWeeklyStr) : null;
  const isDifferentDay = !lastWeekly || lastWeekly.toDateString() !== now.toDateString();

  if (isMonday && isDifferentDay) {
    sendNotification(
      'Weekly Business Summary',
      'Monday is here! Check your weekly reports and settle pending dues.',
    );
    localStorage.setItem('last_weekly_notif', now.toISOString());
  }

  return null;
}
