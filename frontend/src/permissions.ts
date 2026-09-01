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

/**
 * Trigger local push notification on download completion
 */
export async function sendDownloadCompleteNotification(title: string, format: string, storagePath?: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      // Remove progress notification
      try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID_PROGRESS }] });
      } catch (_) {}

      const cleanTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
      const dest = storagePath || 'Internal Storage > Download > VortexDownloader';
      
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
}
