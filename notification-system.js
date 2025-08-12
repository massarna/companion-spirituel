
// notification-system.js - Système de notifications pour les heures de prières

class PrayerNotificationSystem {
  constructor() {
    this.notificationsEnabled = false;
    this.reminderTimes = [5, 10, 15]; // minutes avant la prière
    this.soundEnabled = true;
    this.init();
  }

  async init() {
    // Vérifier le support des notifications
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await this.requestPermission();
      } else if (Notification.permission === 'granted') {
        this.notificationsEnabled = true;
      }
    }

    // Vérifier les rappels existants
    await this.loadSettings();
    this.setupNotificationScheduler();
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled = (permission === 'granted');
      
      if (this.notificationsEnabled) {
        this.showWelcomeNotification();
      }
      
      return this.notificationsEnabled;
    } catch (error) {
      console.error('[Notifications] Erreur demande permission:', error);
      return false;
    }
  }

  showWelcomeNotification() {
    new Notification('🤲 Compagnon Spirituel', {
      body: 'Les notifications pour les prières sont maintenant activées',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'welcome',
      silent: false
    });
  }

  setupNotificationScheduler() {
    // Vérifier toutes les minutes
    setInterval(() => {
      this.checkUpcomingPrayers();
    }, 60000);
    
    // Vérification immédiate
    this.checkUpcomingPrayers();
  }

  checkUpcomingPrayers() {
    if (!this.notificationsEnabled) return;

    const now = moment();
    const PRAYERS = [
      { name: "Fajr", time: "05:00", emoji: "🌅" },
      { name: "Shuruq", time: "06:15", emoji: "☀️" },
      { name: "Dhuhr", time: "12:30", emoji: "🌞" },
      { name: "Asr", time: "15:45", emoji: "🌤️" },
      { name: "Maghrib", time: "18:30", emoji: "🌇" },
      { name: "Isha", time: "19:45", emoji: "🌙" },
    ];

    PRAYERS.forEach(prayer => {
      const prayerTime = this.todayAt(prayer.time);
      const diffMinutes = prayerTime.diff(now, 'minutes');

      // Notifications de rappel
      this.reminderTimes.forEach(reminderMin => {
        if (diffMinutes === reminderMin) {
          this.showPrayerReminder(prayer, reminderMin);
        }
      });

      // Notification au moment exact
      if (diffMinutes === 0) {
        this.showPrayerTimeNotification(prayer);
      }
    });
  }

  showPrayerReminder(prayer, minutesBefore) {
    const notification = new Notification(`${prayer.emoji} Rappel - ${prayer.name}`, {
      body: `La prière ${prayer.name} commence dans ${minutesBefore} minutes`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `reminder-${prayer.name}-${minutesBefore}`,
      requireInteraction: false,
      silent: !this.soundEnabled
    });

    // Auto-fermeture après 10 secondes
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  showPrayerTimeNotification(prayer) {
    const notification = new Notification(`${prayer.emoji} Il est l'heure - ${prayer.name}`, {
      body: `C'est maintenant l'heure de la prière ${prayer.name}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `prayer-time-${prayer.name}`,
      requireInteraction: true,
      silent: !this.soundEnabled,
      actions: [
        { action: 'done', title: '✅ Prière faite' },
        { action: 'remind', title: '⏰ Rappeler dans 5 min' }
      ]
    });

    // Gérer les actions de notification
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  async loadSettings() {
    try {
      const api = window.storageAPI;
      if (api) {
        this.reminderTimes = await api.storageGet('notificationReminderTimes', [5, 10, 15]);
        this.soundEnabled = await api.storageGet('notificationSoundEnabled', true);
      }
    } catch (error) {
      console.error('[Notifications] Erreur chargement paramètres:', error);
    }
  }

  async saveSettings() {
    try {
      const api = window.storageAPI;
      if (api) {
        await api.storageSet('notificationReminderTimes', this.reminderTimes);
        await api.storageSet('notificationSoundEnabled', this.soundEnabled);
      }
    } catch (error) {
      console.error('[Notifications] Erreur sauvegarde paramètres:', error);
    }
  }

  todayAt(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return moment().hours(hours).minutes(minutes).seconds(0).milliseconds(0);
  }

  // Méthodes publiques pour les paramètres
  setReminderTimes(times) {
    this.reminderTimes = times;
    this.saveSettings();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.saveSettings();
    return this.soundEnabled;
  }

  async toggleNotifications() {
    if (!this.notificationsEnabled) {
      this.notificationsEnabled = await this.requestPermission();
    } else {
      this.notificationsEnabled = false;
    }
    return this.notificationsEnabled;
  }
}

// Export de l'instance globale
window.prayerNotifications = new PrayerNotificationSystem();
export default window.prayerNotifications;
