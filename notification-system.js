// Système de notifications intelligentes pour les prières
export class PrayerNotificationSystem {
  constructor() {
    this.notificationsEnabled = false;
    this.soundEnabled = true;
    this.reminderTimes = [5, 10, 15]; // minutes avant la prière
    this.scheduledNotifications = new Map();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Notifications] API non supportée');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async toggleNotifications() {
    if (this.notificationsEnabled) {
      this.disable();
      return false;
    } else {
      const granted = await this.requestPermission();
      if (granted) {
        this.enable();
        this.scheduleAllPrayerNotifications();
        return true;
      }
      return false;
    }
  }

  enable() {
    this.notificationsEnabled = true;
    localStorage.setItem('prayerNotificationsEnabled', 'true');
    console.log('[Notifications] Activées');
  }

  disable() {
    this.notificationsEnabled = false;
    this.clearAllScheduledNotifications();
    localStorage.setItem('prayerNotificationsEnabled', 'false');
    console.log('[Notifications] Désactivées');
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('prayerSoundEnabled', this.soundEnabled.toString());
    return this.soundEnabled;
  }

  setReminderTimes(times) {
    this.reminderTimes = times;
    localStorage.setItem('prayerReminderTimes', JSON.stringify(times));
    if (this.notificationsEnabled) {
      this.scheduleAllPrayerNotifications();
    }
  }

  scheduleAllPrayerNotifications() {
    this.clearAllScheduledNotifications();

    const prayers = [
      { name: "Fajr", time: "05:00" },
      { name: "Dhuhr", time: "12:30" },
      { name: "Asr", time: "15:45" },
      { name: "Maghrib", time: "18:30" },
      { name: "Isha", time: "19:45" }
    ];

    prayers.forEach(prayer => {
      this.schedulePrayerNotifications(prayer);
    });
  }

  schedulePrayerNotifications(prayer) {
    const now = new Date();
    const today = new Date();
    const [hours, minutes] = prayer.time.split(':').map(Number);

    today.setHours(hours, minutes, 0, 0);

    // Si l'heure est passée aujourd'hui, programmer pour demain
    if (today <= now) {
      today.setDate(today.getDate() + 1);
    }

    this.reminderTimes.forEach(minutesBefore => {
      const notificationTime = new Date(today.getTime() - (minutesBefore * 60 * 1000));

      if (notificationTime > now) {
        const timeoutId = setTimeout(() => {
          this.showPrayerReminder(prayer.name, minutesBefore);
        }, notificationTime.getTime() - now.getTime());

        const key = `${prayer.name}-${minutesBefore}`;
        this.scheduledNotifications.set(key, timeoutId);
      }
    });
  }

  showPrayerReminder(prayerName, minutesBefore) {
    if (!this.notificationsEnabled) return;

    const notification = new Notification(`🕌 Rappel de prière`, {
      body: `${prayerName} dans ${minutesBefore} minutes`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `prayer-${prayerName}`,
      requireInteraction: false,
      silent: !this.soundEnabled
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 10000);

    console.log(`[Notifications] Rappel ${prayerName} - ${minutesBefore} min`);
  }

  clearAllScheduledNotifications() {
    this.scheduledNotifications.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  loadSettings() {
    this.notificationsEnabled = localStorage.getItem('prayerNotificationsEnabled') === 'true';
    this.soundEnabled = localStorage.getItem('prayerSoundEnabled') !== 'false';

    const savedTimes = localStorage.getItem('prayerReminderTimes');
    if (savedTimes) {
      this.reminderTimes = JSON.parse(savedTimes);
    }

    if (this.notificationsEnabled && Notification.permission === 'granted') {
      this.scheduleAllPrayerNotifications();
    }
  }
}

// Instance globale
const prayerNotifications = new PrayerNotificationSystem();
prayerNotifications.loadSettings();

// Exposer globalement
window.prayerNotifications = prayerNotifications;

console.log('[Notifications] Système initialisé');