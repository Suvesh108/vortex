import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface AppPermissionStatus {
  storage: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
}

const NOTIFICATION_ID_PROGRESS = 10101;

/**
 * Check and request required Storage & Notification permissions on Android/iOS
 */
export async function requestAppPermissions(): Promise<AppPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { storage: 'granted', notifications: 'granted' };
  }

  let storageStatus: 'granted' | 'denied' | 'prompt' = 'granted';
  let notificationStatus: 'granted' | 'denied' | 'prompt' = 'granted';

  // 1. Storage Permission
  try {
    const fsPerm = await Filesystem.checkPermissions();
    if (fsPerm.publicStorage !== 'granted') {
      const req = await Filesystem.requestPermissions();
      storageStatus = req.publicStorage as any;
    } else {
      storageStatus = 'granted';
    }
  } catch (e) {
    console.warn('Storage permission request:', e);
  }

  // 2. Notification Permission
  try {
    const notifPerm = await LocalNotifications.checkPermissions();
    if (notifPerm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      notificationStatus = req.display as any;
    } else {
      notificationStatus = 'granted';
    }
  } catch (e) {
    console.warn('Notification permission request:', e);
  }

  return {
    storage: storageStatus,
    notifications: notificationStatus
  };
}

/**
 * Update native download progress in Android notification tray
 */
export async function sendDownloadProgressNotification(title: string, progress: number, speed?: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      const cleanTitle = title.length > 30 ? title.substring(0, 27) + '...' : title;
      const speedText = speed ? ` • ${speed}` : '';
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `Downloading (${progress}%)...`,
            body: `${cleanTitle}${speedText}`,
            id: NOTIFICATION_ID_PROGRESS,
            schedule: { at: new Date(Date.now() + 50) },
            extra: { progress }
          }
        ]
      });
    }
  } catch (e) {
    // Non-fatal
  }
}

export async function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (_) {}
}

/**
 * Trigger local push notification on download completion
 */
export async function sendDownloadCompleteNotification(title: string, format: string, storagePath?: string) {
  const cleanTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
  const dest = storagePath || 'Downloads/Vortex';

  // 1. Mobile Capacitor local notifications
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'granted') {
        try {
          await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID_PROGRESS }] });
        } catch (_) {}

        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Download Complete ⚡',
              body: `"${cleanTitle}" (${format}) is ready in ${dest}`,
              id: Math.floor(Math.random() * 100000) + 1,
              schedule: { at: new Date(Date.now() + 100) }
            }
          ]
        });
      }
    } catch (e) {
      console.warn('Could not trigger local notification:', e);
    }
    return;
  }

  // 2. Desktop Web Notification API & Sound
  try {
    const rawSettings = localStorage.getItem('vortex_settings');
    const userSettings = rawSettings ? JSON.parse(rawSettings) : null;

    // Auditory Chime
    if (!userSettings || userSettings.soundNotification !== false) {
      playNotificationChime();
    }

    // Webhook event hook
    if (userSettings && userSettings.webhookUrl && userSettings.webhookUrl.startsWith('http')) {
      fetch(userSettings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'download.completed',
          title: cleanTitle,
          format: format,
          storagePath: dest,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {});
    }

    // Desktop Notification Banner
    if (
      (!userSettings || userSettings.desktopNotifications !== false) &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('Vortex Downloader ⚡', {
        body: `"${cleanTitle}" (${format}) completed successfully.`,
        icon: '/favicon.ico'
      });
    }
  } catch (_) {}
}
