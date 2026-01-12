import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { CalendarEvent } from "./useEvents";

interface ScheduledNotification {
  eventId: string;
  timeoutId: NodeJS.Timeout;
}

export function useNotifications() {
  const scheduledNotifications = useRef<ScheduledNotification[]>([]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      toast.error("Notificações foram bloqueadas. Habilite nas configurações do navegador.");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      toast.success("Notificações habilitadas!");
      return true;
    } else {
      toast.error("Permissão de notificações negada");
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Also show a toast as fallback
      toast.info(title, {
        description: options?.body,
      });

      return notification;
    }
  }, []);

  const scheduleEventNotification = useCallback((event: CalendarEvent) => {
    if (!event.notification_enabled || !event.notification_minutes_before) {
      return;
    }

    // Cancel existing notification for this event
    const existingIndex = scheduledNotifications.current.findIndex(
      (n) => n.eventId === event.id
    );
    if (existingIndex !== -1) {
      clearTimeout(scheduledNotifications.current[existingIndex].timeoutId);
      scheduledNotifications.current.splice(existingIndex, 1);
    }

    // Calculate notification time
    const eventDateTime = new Date(`${event.event_date}T${event.event_time}`);
    const notificationTime = new Date(
      eventDateTime.getTime() - event.notification_minutes_before * 60 * 1000
    );
    const now = new Date();

    const delay = notificationTime.getTime() - now.getTime();

    // Only schedule if the notification time is in the future
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        showNotification(`🔔 Lembrete: ${event.title}`, {
          body: `Evento em ${event.notification_minutes_before} minutos${
            event.location ? ` • Local: ${event.location}` : ""
          }`,
          tag: event.id,
          requireInteraction: true,
        });

        // Remove from scheduled list after firing
        const index = scheduledNotifications.current.findIndex(
          (n) => n.eventId === event.id
        );
        if (index !== -1) {
          scheduledNotifications.current.splice(index, 1);
        }
      }, delay);

      scheduledNotifications.current.push({
        eventId: event.id,
        timeoutId,
      });

      console.log(
        `Notificação agendada para ${event.title} em ${Math.round(delay / 60000)} minutos`
      );
    }
  }, [showNotification]);

  const scheduleAllNotifications = useCallback((events: CalendarEvent[]) => {
    // Clear all existing scheduled notifications
    scheduledNotifications.current.forEach((n) => clearTimeout(n.timeoutId));
    scheduledNotifications.current = [];

    // Schedule notifications for events with notifications enabled
    events.forEach((event) => {
      if (event.notification_enabled) {
        scheduleEventNotification(event);
      }
    });
  }, [scheduleEventNotification]);

  const cancelNotification = useCallback((eventId: string) => {
    const index = scheduledNotifications.current.findIndex(
      (n) => n.eventId === eventId
    );
    if (index !== -1) {
      clearTimeout(scheduledNotifications.current[index].timeoutId);
      scheduledNotifications.current.splice(index, 1);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scheduledNotifications.current.forEach((n) => clearTimeout(n.timeoutId));
    };
  }, []);

  return {
    requestPermission,
    showNotification,
    scheduleEventNotification,
    scheduleAllNotifications,
    cancelNotification,
    isSupported: "Notification" in window,
    permission: typeof window !== "undefined" && "Notification" in window 
      ? Notification.permission 
      : "denied",
  };
}
