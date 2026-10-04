'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Building2, Key, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { api } from '@/lib/api';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = () => {
    api.get('/notifications')
      .then(res => {
        const list = res.notifications || [];
        setNotifications(list);
        setUnreadCount(res.unreadCount || list.filter((n: NotificationItem) => !n.isRead).length);
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORGANIZATION':
        return <Building2 size={16} color="var(--primary)" />;
      case 'TENANT_CREATED_LANDLORD_NOTIF':
      case 'WELCOME_TENANT':
        return <Key size={16} color="#16a34a" />;
      case 'PAYMENT_DECLARED':
      case 'PAYMENT_VALIDATED':
      case 'PAYMENT_VALIDATED_SUPERADMIN':
        return <CreditCard size={16} color="#d97706" />;
      case 'INCIDENT_CREATED':
        return <AlertTriangle size={16} color="#dc2626" />;
      default:
        return <Info size={16} color="var(--primary)" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: open ? '#f1f5f9' : 'transparent',
          border: '1px solid ' + (open ? '#cbd5e1' : 'transparent'),
          color: open ? 'var(--primary)' : '#64748b',
          cursor: 'pointer',
          position: 'relative',
          padding: '7px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '0.6875rem',
            fontWeight: '700',
            borderRadius: '10px',
            padding: '2px 5px',
            lineHeight: 1,
            boxShadow: '0 0 0 2px #ffffff'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Lumineux Epuré (Fond Blanc Epuré) */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: '360px',
          maxWidth: '90vw',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '480px',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '600'
                }}
              >
                <CheckCheck size={14} /> Tout lire
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: n.isRead ? '#ffffff' : '#f0f9ff',
                    cursor: n.isRead ? 'default' : 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {getIcon(n.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.isRead ? '500' : '700', fontSize: '0.825rem', color: '#0f172a', marginBottom: '2px', wordBreak: 'break-word' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  {!n.isRead && (
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />
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

