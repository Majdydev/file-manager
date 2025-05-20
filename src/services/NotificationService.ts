import { getDb } from "../db";
import { Rendezvous } from "../types";

class NotificationService {
  private static instance: NotificationService;
  private checkInterval: number | null = null;
  private notificationSound: HTMLAudioElement | null = null;
  private pendingNotifications: Map<number, NodeJS.Timeout> = new Map();

  private constructor() {
    // Initialize notification sound if browser supports it
    if (typeof Audio !== "undefined") {
      this.notificationSound = new Audio("src/sounds/bell-notification.mp3");
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Check for upcoming rendezvous
  public async checkUpcomingRendezvous(): Promise<Rendezvous[]> {
    try {
      const db = getDb();

      // Get rendezvous that are within 2 hours and status is pending
      // Note: Using proper datetime comparison with SQLite
      const upcomingRendezvous = await db.query(`
        SELECT r.*, p.name as passion_name 
        FROM rendezvous r
        JOIN passions p ON r.passion_id = p.id
        WHERE r.status = 'pending' 
        AND r.notification_state = 'pending'
        AND datetime(r.date) <= datetime('now', '+2 hours')
        AND datetime(r.date) > datetime('now')
        ORDER BY r.date ASC
      `);

      return upcomingRendezvous;
    } catch (error) {
      console.error("Error checking upcoming rendezvous:", error);
      return [];
    }
  }

  // Start periodic checking for notifications
  public startNotificationCheck(intervalMinutes: number = 5): void {
    // Clear existing interval if any
    this.stopNotificationCheck();

    // Check immediately
    this.checkAndNotify();

    // Set interval for periodic checks (convert minutes to milliseconds)
    this.checkInterval = setInterval(() => {
      this.checkAndNotify();
    }, intervalMinutes * 60 * 1000) as unknown as number;
  }

  // Stop checking for notifications
  public stopNotificationCheck(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check and show notifications if needed
  private async checkAndNotify(): Promise<void> {
    const upcomingRendezvous = await this.checkUpcomingRendezvous();

    for (const rendez of upcomingRendezvous) {
      this.showNotification(rendez);
    }
  }

  // Show notification for a rendezvous
  public showNotification(rendez: Rendezvous): void {
    // Play sound if available
    if (this.notificationSound) {
      this.notificationSound.play().catch((err) => {
        console.warn("Could not play notification sound:", err);
      });
    }

    // Show browser notification if supported
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        this.createNotification(rendez);
      } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.createNotification(rendez);
          }
        });
      }
    }

    // Dispatch custom event for in-app notification
    const event = new CustomEvent("rendezvous-notification", {
      detail: rendez,
    });
    document.dispatchEvent(event);
  }

  // Create a browser notification
  private createNotification(rendez: Rendezvous): void {
    const rendezDate = new Date(rendez.date);
    const timeString = rendezDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const notification = new Notification("Rendez-vous à venir", {
      body: `${rendez.passion_name} à ${timeString}${
        rendez.description ? ` - ${rendez.description}` : ""
      }`,
      icon: "/vite.svg", // Use your app icon
      tag: `rendez-${rendez.id}`,
      requireInteraction: true,
    });

    notification.onclick = () => {
      this.confirmNotification(rendez.id);
      notification.close();
      window.focus();
      window.location.href = "/rendezvous";
    };
  }

  // Mark notification as confirmed in the database
  public async confirmNotification(rendezvousId: number): Promise<boolean> {
    try {
      const db = getDb();
      await db.execute(
        "UPDATE rendezvous SET notification_state = 'sent' WHERE id = ?",
        [rendezvousId]
      );

      // Clear any pending notification for this rendezvous
      if (this.pendingNotifications.has(rendezvousId)) {
        clearTimeout(this.pendingNotifications.get(rendezvousId));
        this.pendingNotifications.delete(rendezvousId);
      }

      return true;
    } catch (error) {
      console.error("Error confirming notification:", error);
      return false;
    }
  }

  // Reset notification state when rendezvous is updated
  public async resetNotificationState(rendezvousId: number): Promise<boolean> {
    try {
      const db = getDb();
      await db.execute(
        "UPDATE rendezvous SET notification_state = 'pending' WHERE id = ?",
        [rendezvousId]
      );
      return true;
    } catch (error) {
      console.error("Error resetting notification state:", error);
      return false;
    }
  }
}

export default NotificationService.getInstance();
