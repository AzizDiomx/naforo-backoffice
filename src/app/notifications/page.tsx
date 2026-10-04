'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import {
  Bell,
  CheckCheck,
  Building2,
  Key,
  CreditCard,
  AlertTriangle,
  Info,
  Search,
  CheckCircle2,
  Calendar,
  Settings,
  X,
  Mail,
  Smartphone,
  Clock,
  Save,
  Radio
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'payments' | 'tenants' | 'system'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Notification Preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState('15, 7, 3, 1');
  const [reminderDaysAfter, setReminderDaysAfter] = useState('3, 7, 15');

  const fetchNotifications = () => {
    setLoading(true);
    api.get('/notifications')
      .then(res => {
        const list = res.notifications || [];
        setNotifications(list);
        setUnreadCount(res.unreadCount || list.filter((n: NotificationItem) => !n.isRead).length);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const fetchPreferences = () => {
    api.get('/notifications/preferences')
      .then(res => {
        if (res) {
          setEmailEnabled(res.emailEnabled ?? true);
          setSmsEnabled(res.smsEnabled ?? false);
          setPushEnabled(res.pushEnabled ?? true);
          setReminderEnabled(res.reminderEnabled ?? true);
          if (Array.isArray(res.reminderDaysBefore)) {
            setReminderDaysBefore(res.reminderDaysBefore.join(', '));
          }
          if (Array.isArray(res.reminderDaysAfter)) {
            setReminderDaysAfter(res.reminderDaysAfter.join(', '));
          }
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const beforeArr = reminderDaysBefore.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      const afterArr = reminderDaysAfter.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

      await api.put('/notifications/preferences', {
        emailEnabled,
        smsEnabled,
        pushEnabled,
        reminderEnabled,
        reminderDaysBefore: beforeArr,
        reminderDaysAfter: afterArr
      });

      setSaveSuccess("Paramètres des notifications et relances enregistrés avec succès !");
      setTimeout(() => setShowSettingsModal(false), 1500);
    } catch (err) {
      if (err instanceof ApiError) setSaveError(err.message);
      else setSaveError("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await api.patch('/notifications/read-all', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { } finally {
      setActionLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORGANIZATION':
        return <Building2 size={20} color="var(--primary)" />;
      case 'TENANT_CREATED_LANDLORD_NOTIF':
      case 'WELCOME_TENANT':
        return <Key size={20} color="#16a34a" />;
      case 'PAYMENT_DECLARED':
      case 'PAYMENT_VALIDATED':
      case 'PAYMENT_VALIDATED_SUPERADMIN':
        return <CreditCard size={20} color="#d97706" />;
      case 'INCIDENT_CREATED':
        return <AlertTriangle size={20} color="#dc2626" />;
      default:
        return <Info size={20} color="var(--primary)" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = search === '' ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'unread') return !n.isRead;
    if (filterType === 'payments') return ['PAYMENT_DECLARED', 'PAYMENT_VALIDATED', 'PAYMENT_VALIDATED_SUPERADMIN'].includes(n.type);
    if (filterType === 'tenants') return ['TENANT_CREATED_LANDLORD_NOTIF', 'WELCOME_TENANT'].includes(n.type);
    if (filterType === 'system') return ['NEW_ORGANIZATION', 'INCIDENT_CREATED'].includes(n.type);

    return true;
  });

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1800px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>Centre de Notifications</h1>
              {unreadCount > 0 && (
                <span style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: '700', padding: '4px 10px', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px' }}>
              Consultez l'historique global de tous les événements, créations de baux et règlements
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn btn-secondary"
              style={{ gap: '8px', border: '1px solid #cbd5e1' }}
            >
              <Settings size={18} color="var(--primary)" />
              Paramètres des Relances
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="btn btn-secondary"
                style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: 'var(--primary)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <CheckCheck size={18} />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="card" style={{ padding: '16px 20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: filterType === 'all' ? '700' : '500',
                backgroundColor: filterType === 'all' ? 'var(--primary)' : '#f8fafc',
                color: filterType === 'all' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Toutes ({notifications.length})
            </button>

            <button
              onClick={() => setFilterType('unread')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: filterType === 'unread' ? '700' : '500',
                backgroundColor: filterType === 'unread' ? 'var(--primary)' : '#f8fafc',
                color: filterType === 'unread' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Non lues ({unreadCount})
            </button>

            <button
              onClick={() => setFilterType('payments')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: filterType === 'payments' ? '700' : '500',
                backgroundColor: filterType === 'payments' ? 'var(--primary)' : '#f8fafc',
                color: filterType === 'payments' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ðŸ’³ Paiements
            </button>

            <button
              onClick={() => setFilterType('tenants')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: filterType === 'tenants' ? '700' : '500',
                backgroundColor: filterType === 'tenants' ? 'var(--primary)' : '#f8fafc',
                color: filterType === 'tenants' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ðŸ”‘ Locataires
            </button>

            <button
              onClick={() => setFilterType('system')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: filterType === 'system' ? '700' : '500',
                backgroundColor: filterType === 'system' ? 'var(--primary)' : '#f8fafc',
                color: filterType === 'system' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ðŸ¢ Système & Agences
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px', fontSize: '0.85rem', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
            />
          </div>

        </div>

        {/* Notifications Main List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              Chargement de vos notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Bell size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                Aucune notification trouvée
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {search ? 'Aucun résultat ne correspond Ã  votre recherche.' : 'Vous Ãªtes Ã  jour ! Aucune alerte enregistrée pour le moment.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: n.isRead ? '#ffffff' : '#f0f9ff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
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

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: n.isRead ? '600' : '700', color: '#0f172a' }}>
                        {n.title}
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <Calendar size={13} />
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', wordBreak: 'break-word' }}>
                      {n.message}
                    </p>
                  </div>

                  {/* Read status / Action */}
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!n.isRead ? (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: '#ffffff', borderRadius: '6px', fontWeight: '600', border: 'none' }}
                      >
                        Marquer comme lu
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} color="#16a34a" /> Lu
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* SYSTEM NOTIFICATION SETTINGS MODAL */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={22} color="var(--primary)" /> Configuration des Relances Systèmes
              </h3>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {saveError && (
              <div style={{ backgroundColor: 'var(--danger-light)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div style={{ backgroundColor: 'var(--success-light)', padding: '12px', borderRadius: '8px', color: 'var(--success)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {saveSuccess}
              </div>
            )}

            <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Reminder Toggles */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                  RAPPELS AUTOMATIQUES DE LOYER
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <input
                    type="checkbox"
                    id="reminderEnabled"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="reminderEnabled" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer', flex: 1 }}>
                    Activer les relances automatisées de loyer pour tous les locataires
                  </label>
                </div>
              </div>

              {/* Channels Toggles */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                  CANAUX DE TRANSMISSION ACTIVES
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '8px' }}>

                  {/* Email */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', border: `2px solid ${emailEnabled ? 'var(--primary)' : '#e2e8f0'}`, backgroundColor: emailEnabled ? '#eff6ff' : '#ffffff', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Mail size={18} color={emailEnabled ? 'var(--primary)' : '#64748b'} />
                      <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: emailEnabled ? 'var(--primary)' : '#475569' }}>E-mail</span>
                  </label>

                  {/* SMS */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', border: `2px solid ${smsEnabled ? 'var(--primary)' : '#e2e8f0'}`, backgroundColor: smsEnabled ? '#eff6ff' : '#ffffff', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Smartphone size={18} color={smsEnabled ? 'var(--primary)' : '#64748b'} />
                      <input type="checkbox" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: smsEnabled ? 'var(--primary)' : '#475569' }}>SMS Mobile</span>
                  </label>

                  {/* Push In-App */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px', border: `2px solid ${pushEnabled ? 'var(--primary)' : '#e2e8f0'}`, backgroundColor: pushEnabled ? '#eff6ff' : '#ffffff', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Bell size={18} color={pushEnabled ? 'var(--primary)' : '#64748b'} />
                      <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: pushEnabled ? 'var(--primary)' : '#475569' }}>Push In-App</span>
                  </label>

                </div>
              </div>

              {/* Days Before Schedule */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                  RELANCES AVANT ECHEANCE (EN JOURS, SEPARES PAR DES VIRGULES)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 15, 7, 3, 1"
                    value={reminderDaysBefore}
                    onChange={(e) => setReminderDaysBefore(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Exemple: 15, 7, 3, 1 enverra un rappel 15 jours, 7 jours, 3 jours et 1 jour avant la date de loyer.
                </span>
              </div>

              {/* Days After Schedule (Overdue) */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>
                  RELANCES IMPAYES APRÃˆS ECHEANCE (EN JOURS, SEPARES PAR DES VIRGULES)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 3, 7, 15"
                    value={reminderDaysAfter}
                    onChange={(e) => setReminderDaysAfter(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Exemple: 3, 7, 15 enverra une relance d'impayé 3 jours, 7 jours et 15 jours après le retard de loyer.
                </span>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ gap: '8px' }} disabled={settingsLoading}>
                  <Save size={16} />
                  {settingsLoading ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </Layout>
  );
}

