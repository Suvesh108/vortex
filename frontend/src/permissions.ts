import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface AppPermissionStatus {
  storage: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
}

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
 * Trigger local push notification on download completion
 */
export async function sendDownloadCompleteNotification(title: string, format: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Download Complete ⚡',
            body: `${title} (${format}) has been saved to your device storage.`,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    }
  } catch (e) {
    console.warn('Could not trigger local notification:', e);
  }
}
