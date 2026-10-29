import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { connectSocket } from '../../lib/socket';

const formatDate = (value) => new Date(value).toLocaleString([], {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export default function NotificationBell({ isAuthenticated, accessToken }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/me/notifications', {
        params: { page: 1, limit: 8 },
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return undefined;

    loadNotifications();
    const socket = connectSocket(accessToken);
    const handleNotification = (notification) => {
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item._id !== notification._id),
      ].slice(0, 8));
      if (!notification.readAt) setUnreadCount((count) => count + 1);
    };
    socket.on('notification:new', handleNotification);
    return () => socket.off('notification:new', handleNotification);
  }, [accessToken, isAuthenticated, loadNotifications]);

  const markRead = async (notification) => {
    if (notification.readAt) return;
    try {
      const { data } = await api.patch(`/users/me/notifications/${notification._id}/read`);
      setNotifications((current) => current.map((item) => (
        item._id === notification._id ? data.notification : item
      )));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not mark notification as read.');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/users/me/notifications/read-all');
      setNotifications((current) => current.map((item) => (
        item.readAt ? item : { ...item, readAt: new Date().toISOString() }
      )));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not mark notifications as read.');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-forest-200 hover:text-forest-700"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!unreadCount}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-forest-700 transition hover:bg-forest-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>

          {error && (
            <div className="m-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
              <p>{error}</p>
              <button type="button" onClick={loadNotifications} className="mt-2 font-bold underline">
                Try again
              </button>
            </div>
          )}

          <div className="max-h-[390px] overflow-y-auto p-2">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-500">
                <LoaderCircle size={15} className="animate-spin" /> Loading notifications
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <Link
                  key={notification._id}
                  to={`/trips/${notification.tripId}`}
                  onClick={() => {
                    markRead(notification);
                    setOpen(false);
                  }}
                  className={`block rounded-xl px-3 py-3 transition hover:bg-slate-50 ${
                    notification.readAt ? '' : 'bg-emerald-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      notification.readAt ? 'bg-slate-200' : 'bg-emerald-500'
                    }`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-slate-800">{notification.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">{notification.message}</span>
                      <span className="mt-1.5 block text-[10px] text-slate-400">{formatDate(notification.createdAt)}</span>
                    </span>
                  </div>
                </Link>
              ))
            ) : !error ? (
              <div className="px-5 py-9 text-center">
                <Bell size={22} className="mx-auto text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="mt-1 text-[11px] text-slate-500">Trip updates and safety alerts will show up here.</p>
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
