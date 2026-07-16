import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, CreditCard } from 'lucide-react';

import { getMyNotifications, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead, type NotificationResponse } from '../api/notification.api';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (notif?.isRead) return;

    try {
      await apiMarkAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info size={16} color="#3b82f6" />;
      case 'warning': return <AlertTriangle size={16} color="#f59e0b" />;
      case 'payment': return <CreditCard size={16} color="#10b981" />;
      default: return <Bell size={16} color="#94a3b8" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div ref={bellRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isHovered ? 'var(--bg-hover, rgba(0, 0, 0, 0.05))' : 'var(--bg-input, rgba(0, 0, 0, 0.02))',
          border: '1px solid var(--border-color, rgba(0, 0, 0, 0.1))',
          color: isHovered ? 'var(--text-primary, #1e293b)' : 'var(--text-secondary, #64748b)',
          width: 42, height: 42, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
          boxShadow: isHovered ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold',
            minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-primary, #0f172a)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 50, right: 0, width: 340,
          background: 'var(--bg-card, #1e293b)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={14} /> Đánh dấu đã đọc
              </button>
            )}
          </div>
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => markAsRead(n.id)} style={{
                  padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)',
                  background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                  cursor: 'pointer', display: 'flex', gap: 12, transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: n.isRead ? 500 : 700, color: n.isRead ? '#cbd5e1' : '#f8fafc', marginBottom: 4 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: 6 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {formatTime(n.createdAt)}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
