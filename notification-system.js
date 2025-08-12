
// Système de notifications pour les prières
class PrayerNotificationSystem {
  constructor() {
    this.notificationsEnabled = false;
    this.soundEnabled = true;
    this.reminderTimes = [5, 10, 15]; // minutes avant
    this.activeTimeouts = new Set();
    
    // Horaires de prière (Bobo-Dioulasso)
    this.prayerTimes = {
      Fajr: "05:00",
      Dhuhr: "12:30", 
      Asr: "15:45",
      Maghrib: "18:30",
      Isha: "19:45"
    };

    this.init();
  }

  async init() {
    // Vérifier le statut des permissions
    if ('Notification' in window) {
      this.notificationsEnabled = Notification.permission === 'granted';
    }
    
    console.log('[Notifications] Système initialisé');
    this.scheduleNextReminders();
  }

  async toggleNotifications() {
    if (!('Notification' in window)) {
      alert('Ce navigateur ne supporte pas les notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.notificationsEnabled = !this.notificationsEnabled;
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      this.notificationsEnabled = permission === 'granted';
    } else {
      alert('Les notifications sont bloquées. Activez-les dans les paramètres du navigateur.');
      return false;
    }

    if (this.notificationsEnabled) {
      this.scheduleNextReminders();
    } else {
      this.clearAllTimeouts();
    }

    console.log('[Notifications] État:', this.notificationsEnabled ? 'activé' : 'désactivé');
    return this.notificationsEnabled;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    console.log('[Notifications] Sons:', this.soundEnabled ? 'activés' : 'désactivés');
    return this.soundEnabled;
  }

  setReminderTimes(times) {
    this.reminderTimes = times;
    console.log('[Notifications] Rappels configurés:', times, 'minutes avant');
    
    if (this.notificationsEnabled) {
      this.clearAllTimeouts();
      this.scheduleNextReminders();
    }
  }

  showNotification(title, body, icon = '/icons/icon-192.png') {
    if (!this.notificationsEnabled) return;

    const notification = new Notification(title, {
      body: body,
      icon: icon,
      badge: icon,
      tag: 'prayer-reminder',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close après 10 secondes
    setTimeout(() => notification.close(), 10000);

    // Son de notification
    if (this.soundEnabled) {
      this.playNotificationSound();
    }
  }

  playNotificationSound() {
    try {
      // Créer un son simple
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('[Notifications] Impossible de jouer le son:', error);
    }
  }

  scheduleNextReminders() {
    if (!this.notificationsEnabled) return;

    this.clearAllTimeouts();
    
    Object.entries(this.prayerTimes).forEach(([prayerName, timeStr]) => {
      this.reminderTimes.forEach(minutesBefore => {
        const timeoutId = this.schedulePrayerReminder(prayerName, timeStr, minutesBefore);
        if (timeoutId) {
          this.activeTimeouts.add(timeoutId);
        }
      });
    });
  }

  schedulePrayerReminder(prayerName, timeStr, minutesBefore) {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (prayerTime <= now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }
    
    const reminderTime = new Date(prayerTime.getTime() - (minutesBefore * 60 * 1000));
    const delay = reminderTime.getTime() - now.getTime();
    
    if (delay > 0) {
      return setTimeout(() => {
        const message = minutesBefore === 1 
          ? `La prière ${prayerName} commence dans 1 minute` 
          : `La prière ${prayerName} commence dans ${minutesBefore} minutes`;
          
        this.showNotification(`🕌 Rappel de Prière`, message);
        
        // Programmer le prochain rappel pour demain
        setTimeout(() => {
          const nextTimeoutId = this.schedulePrayerReminder(prayerName, timeStr, minutesBefore);
          if (nextTimeoutId) {
            this.activeTimeouts.add(nextTimeoutId);
          }
        }, 24 * 60 * 60 * 1000); // 24 heures
        
      }, delay);
    }
    
    return null;
  }

  clearAllTimeouts() {
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeTimeouts.clear();
  }
}

// Initialiser le système
const prayerNotifications = new PrayerNotificationSystem();

// Exposer globalement
window.prayerNotifications = prayerNotifications;

console.log('[Notifications] Système de notifications de prières initialisé');
