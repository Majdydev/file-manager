import React, { useState, useEffect } from "react";
import NotificationToast from "./NotificationToast";
import { Rendezvous } from "../types";
import NotificationService from "../services/NotificationService";

const NotificationContainer: React.FC = () => {
  const [notifications, setNotifications] = useState<Rendezvous[]>([]);

  useEffect(() => {
    // Check for notifications on component mount
    const checkNotifications = async () => {
      const upcomingRendezvous =
        await NotificationService.checkUpcomingRendezvous();
      setNotifications(upcomingRendezvous);
    };

    // Listen for notification events
    const handleNotification = (event: Event) => {
      const rendez = (event as CustomEvent).detail as Rendezvous;

      // Check if notification is already in the list
      setNotifications((prev) => {
        if (prev.some((n) => n.id === rendez.id)) {
          return prev;
        }
        return [...prev, rendez];
      });
    };

    // Start notification service and initial check
    NotificationService.startNotificationCheck();
    checkNotifications();

    // Add event listener
    document.addEventListener("rendezvous-notification", handleNotification);

    // Cleanup
    return () => {
      document.removeEventListener(
        "rendezvous-notification",
        handleNotification
      );
    };
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter((note) => note.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-full space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
