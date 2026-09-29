import { useEffect, useState } from "react";
import {
  getMyNotifications,
  markMyNotificationRead,
  type ClientNotification,
} from "../../services/community.service";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [message, setMessage] = useState("Chargement...");

  useEffect(() => {
    getMyNotifications()
      .then((data) => {
        setNotifications(data);
        setMessage(
          data.length === 0
            ? "Aucune notification pour le moment."
            : ""
        );
      })
      .catch(() => setMessage("Impossible de charger les notifications."));
  }, []);

  async function markRead(notificationId: string) {
    await markMyNotificationRead(notificationId);

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === notificationId
          ? { ...notification, readAt: new Date().toISOString() }
          : notification
      )
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Espace client
        </p>

        <h1 className="mt-2 text-4xl font-bold">Notifications</h1>

        {message && <p className="mt-8">{message}</p>}

        <section className="mt-8 space-y-4">
          {notifications.map((notification) => (
            <article
              key={notification._id}
              className={
                notification.readAt
                  ? "rounded-2xl border border-foreground/15 p-6 opacity-70"
                  : "rounded-2xl border border-gold bg-gold/10 p-6"
              }
            >
              <h2 className="font-semibold">{notification.title}</h2>
              <p className="mt-2">{notification.body}</p>

              <p className="mt-3 text-sm text-foreground/60">
                {new Date(notification.createdAt).toLocaleString("fr-DZ")}
              </p>

              {!notification.readAt && (
                <button
                  type="button"
                  onClick={() => void markRead(notification._id)}
                  className="mt-4 rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold"
                >
                  Marquer comme lu
                </button>
              )}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}