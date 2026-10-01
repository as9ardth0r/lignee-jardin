/**
 * Programmation des notifications : plugin natif sur Android (déclenchées
 * même app fermée), API Notification du navigateur sinon (tant que l'app
 * est ouverte). Le contenu vient de engine/notify.ts.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { planNotifications, type PlannedNotification } from './engine/notify';
import { makeTT } from './i18n';
import type { GardenData } from './model';
import { taskText } from './taskText';

export type NotifyPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

export const isNative = () => Capacitor.isNativePlatform();

export async function notifyPermission(): Promise<NotifyPermission> {
  if (isNative()) {
    const p = await LocalNotifications.checkPermissions();
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (isNative()) {
    const p = await LocalNotifications.requestPermissions();
    return p.display === 'granted' ? 'granted' : 'denied';
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  const r = await Notification.requestPermission();
  return r === 'default' ? 'prompt' : r;
}

/** Titre et texte d'une notification. */
export function renderNotification(n: PlannedNotification, lang: 'fr' | 'en'): { title: string; body: string } {
  const tt = makeTT(lang);
  if (n.kind === 'alert') return { title: tt('notif.alertTitle'), body: n.tasks.map((t) => taskText(t, tt, lang)).join('\n') };
  if (n.kind === 'backup') return { title: tt('notif.backupTitle'), body: n.days !== undefined && n.days >= 0 ? tt('notif.backupBody', { days: n.days }) : tt('notif.backupNever') };
  const top = n.tasks.slice(0, 3).map((t) => `• ${taskText(t, tt, lang)}`);
  const more = n.tasks.length - top.length;
  return { title: tt('notif.morningTitle', { n: n.tasks.length }), body: [...top, ...(more > 0 ? [tt('notif.more', { n: more })] : [])].join('\n') };
}

let webTimers: number[] = [];

/** Reprogramme toutes les notifications d'après l'état du jardin. */
export async function rescheduleNotifications(data: GardenData, lang: 'fr' | 'en', now = new Date()): Promise<number> {
  const plan = planNotifications(data, now);
  if (isNative()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    if (!plan.length || !data.settings.notify) return 0;
    if ((await notifyPermission()) !== 'granted') return 0;
    await LocalNotifications.schedule({
      notifications: plan.map((n) => {
        const { title, body } = renderNotification(n, lang);
        return { id: n.id, title, body, largeBody: body, schedule: { at: n.at, allowWhileIdle: true }, smallIcon: 'ic_stat_notify', extra: { key: n.key } };
      }),
    });
    return plan.length;
  }
  webTimers.forEach((t) => window.clearTimeout(t));
  webTimers = [];
  if (!data.settings.notify || typeof Notification === 'undefined' || Notification.permission !== 'granted') return 0;
  // Navigateur : seulement ce qui tombe dans les 24 prochaines heures, tant que la page reste ouverte.
  const soon = plan.filter((n) => n.at.getTime() - now.getTime() < 86_400_000);
  for (const n of soon) {
    const { title, body } = renderNotification(n, lang);
    webTimers.push(
      window.setTimeout(() => {
        try {
          new Notification(title, { body, tag: n.key, icon: '/icon-192.png' });
        } catch {
          // Certains navigateurs mobiles exigent le service worker : on l'utilise s'il est là.
          void navigator.serviceWorker?.ready.then((r) => r.showNotification(title, { body, tag: n.key, icon: '/icon-192.png' }));
        }
      }, n.at.getTime() - now.getTime()),
    );
  }
  return soon.length;
}

/** Notification de test, tout de suite. */
export async function testNotification(lang: 'fr' | 'en'): Promise<boolean> {
  const tt = makeTT(lang);
  const title = tt('notif.testTitle');
  const body = tt('notif.testBody');
  if (isNative()) {
    if ((await notifyPermission()) !== 'granted') return false;
    await LocalNotifications.schedule({ notifications: [{ id: 1, title, body, schedule: { at: new Date(Date.now() + 1500) }, smallIcon: 'ic_stat_notify' }] });
    return true;
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, icon: '/icon-192.png' });
  } catch {
    const r = await navigator.serviceWorker?.ready;
    await r?.showNotification(title, { body, icon: '/icon-192.png' });
  }
  return true;
}
