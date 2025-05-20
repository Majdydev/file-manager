import React, { useState, useEffect } from "react";
import { X, Bell, Check } from "lucide-react";
import { Rendezvous } from "../types";
import NotificationService from "../services/NotificationService";

interface NotificationToastProps {
  notification: Rendezvous;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    // Update time remaining
    const updateTimeLeft = () => {
      const now = new Date();
      const rendezDate = new Date(notification.date);
      const diffMs = rendezDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("Maintenant");
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}min`);
      } else {
        setTimeLeft(`${mins} min`);
      }
    };

    // Initial update
    updateTimeLeft();

    // Set interval to update time left every minute
    const interval = setInterval(updateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [notification]);

  const handleConfirm = async () => {
    await NotificationService.confirmNotification(notification.id);
    onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-3 border-l-4 border-[#0A2463] animate-slideIn">
      <div className="flex justify-between items-start">
        <div className="flex items-center text-[#0A2463]">
          <Bell className="h-5 w-5 mr-2" />
          <span className="font-semibold">Rappel de rendez-vous</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2">
        <p className="font-medium">{notification.passion_name}</p>
        <p className="text-sm text-gray-600">
          {new Date(notification.date).toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
        {notification.description && (
          <p className="text-sm text-gray-600 mt-1">
            {notification.description}
          </p>
        )}
        <div className="mt-1 text-sm font-medium text-yellow-600">
          Dans {timeLeft}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleConfirm}
          className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
        >
          <Check size={16} className="mr-1" />
          Confirmer
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
