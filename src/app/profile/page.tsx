'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import Link from 'next/link';
import {
  User,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Mail,
  Trash2,
  AlertTriangle,
  X,
  RefreshCw,
  Phone,
  Building,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  Smartphone,
  Send,
  Sliders,
  CheckCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'organization'>('profile');

  // Données utilisateur & organisation
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [orgId, setOrgId] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState<any>(null);
  const [copiedOrgId, setCopiedOrgId] = useState(false);

  // Champs Mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showDeletePass, setShowDeletePass] = useState(false);

  // Préférences de Notifications
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState('15, 7, 3, 1');
  const [reminderDaysAfter, setReminderDaysAfter] = useState('3, 7, 15');

  // Modal de Suppression / Période de grâce
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPendingDeletion, setIsPendingDeletion] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);

  // Téléchargement export RGPD
  const [exportLoading, setExportLoading] = useState(false);

  const loadProfile = () => {
    setLoading(true);
    setError(null);
    api.get('/auth/me')
      .then((res: any) => {
        const u = res.user;
        if (u) {
          setCurrentUser(u);
          setOrgId(u.organizationId || '');
          setUserRole(u.role || '');
          setFirstName(u.firstName || '');
          setLastName(u.lastName || '');
          setEmail(u.email || '');
          setPhone(u.phone || '');
          setOrganization(u.organization || null);

          if (u.organization?.settings?.deletionRequested) {
            setIsPendingDeletion(true);
            setDeletionDate(u.organization.settings.deletionRequestedAt);
          } else {
            setIsPendingDeletion(false);
          }

          if (u.notificationPreferences) {
            setEmailEnabled(u.notificationPreferences.emailEnabled ?? true);
            setSmsEnabled(u.notificationPreferences.smsEnabled ?? false);
            setPushEnabled(u.notificationPreferences.pushEnabled ?? true);
            setReminderEnabled(u.notificationPreferences.reminderEnabled ?? true);
            if (Array.isArray(u.notificationPreferences.reminderDaysBefore)) {
              setReminderDaysBefore(u.notificationPreferences.reminderDaysBefore.join(', '));
            }
            if (Array.isArray(u.notificationPreferences.reminderDaysAfter)) {
              setReminderDaysAfter(u.notificationPreferences.reminderDaysAfter.join(', '));
            }
          }
        }
        setLoading(false);
      })
      .catch((err: any) => {
        if (err instanceof ApiError) setError(err.message);
        else setError("Impossible de charger les données du profil.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Calcul du score de robustesse du mot de passe
  const passwordCriteria = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
    };
  }, [newPassword]);

  const passwordScore = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (passwordCriteria.length) score += 1;
    if (passwordCriteria.uppercase && passwordCriteria.lowercase) score += 1;
    if (passwordCriteria.number) score += 1;
    if (passwordCriteria.special) score += 1;
    return score;
  }, [newPassword, passwordCriteria]);

  const getPasswordStrengthLabel = () => {
    if (!newPassword) return { text: 'Non renseigné', color: '#64748B', percent: 0 };
    switch (passwordScore) {
      case 1:
        return { text: 'Très faible', color: '#EF4444', percent: 25 };
      case 2:
        return { text: 'Moyen', color: '#F59E0B', percent: 50 };
      case 3:
        return { text: 'Robuste', color: '#3B82F6', percent: 75 };
      case 4:
        return { text: 'Excellente sécurité', color: '#059669', percent: 100 };
      default:
        return { text: 'Insuffisant', color: '#EF4444', percent: 15 };
    }
  };

  // Mise à jour des informations personnelles
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put('/auth/profile', { firstName, lastName, phone });
      setSuccess("Vos informations personnelles ont été mises à jour avec succès.");
      loadProfile();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors de la mise à jour de votre profil.");
    } finally {
      setActionLoading(false);
    }
  };

  // Changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    if (passwordScore < 4) {
      setError("Le mot de passe doit respecter l'ensemble des critères de sécurité (8 caractères, majuscule, minuscule, chiffre et caractère spécial).");
      return;
    }

    setActionLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess("Votre mot de passe a été modifié avec succès. Vos prochaines connexions utiliseront ce nouveau code d'accès.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors du changement de mot de passe. Vérifiez votre mot de passe actuel.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mise à jour des préférences de notification
  const handleUpdateNotifications = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const parsedBefore = reminderDaysBefore
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const parsedAfter = reminderDaysAfter
      .split(',')
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    try {
      await api.put('/notifications/preferences', {
        emailEnabled,
        smsEnabled,
        pushEnabled,
        reminderEnabled,
        reminderDaysBefore: parsedBefore.length ? parsedBefore : [15, 7, 3, 1],
        reminderDaysAfter: parsedAfter.length ? parsedAfter : [3, 7, 15],
      });
      setSuccess("Vos préférences de notifications et le calendrier des relances ont été enregistrés avec succès.");
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors de l'enregistrement des préférences.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export complet des données RGPD
  const handleExportData = async () => {
    setExportLoading(true);
    setError(null);
    try {
      const data = await api.get('/subscriptions/export-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Naforo_Backup_${organization?.name ? organization.name.replace(/\s+/g, '_') : 'Org'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("L'archive complète de vos données (JSON) a été téléchargée avec succès.");
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Impossible d'exporter les données de l'organisation.");
    } finally {
      setExportLoading(false);
    }
  };

  // Copie de l'ID d'organisation
  const handleCopyOrgId = () => {
    if (!orgId) return;
    navigator.clipboard.writeText(orgId);
    setCopiedOrgId(true);
    setTimeout(() => setCopiedOrgId(false), 2000);
  };

  // Demande de suppression de compte
  const handleRequestAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    setActionLoading(true);

    try {
      const res = await api.post(`/organizations/${orgId}/request-deletion`, { password: deletePassword });
      setShowDeleteModal(false);
      setDeletePassword('');
      setSuccess(res.message || "Demande de suppression enregistrée. Période de grâce de 30 jours activée.");
      loadProfile();
    } catch (err: any) {
      if (err instanceof ApiError) setDeleteError(err.message);
      else setDeleteError("Une erreur est survenue lors de la demande de suppression.");
    } finally {
      setActionLoading(false);
    }
  };

  // Annulation de la suppression
  const handleCancelAccountDeletion = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.post(`/organizations/${orgId}/cancel-deletion`, {});
      setSuccess(res.message || "Demande de suppression annulée. Votre compte et vos données sont pleinement actifs.");
      loadProfile();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Impossible d'annuler la suppression.");
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrateur Plateforme';
      case 'admin':
        return 'Administrateur / Bailleur Principal';
      case 'owner':
        return 'Propriétaire / Bailleur';
      case 'manager':
        return 'Gestionnaire Immobilier';
      case 'accountant':
        return 'Comptable / DAF';
      case 'technician':
        return 'Technicien & Maintenance';
      case 'tenant':
        return 'Locataire';
      default:
        return role;
    }
  };

  const strength = getPasswordStrengthLabel();

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '65vh', color: '#64748B', gap: '12px' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: '#013E37' }} />
          <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>Chargement de vos paramètres et sécurité...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

        {/* ----------------------------------------------------------------- */}
        {/* EXECUTIVE HEADER */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* User Avatar Circle */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#013E37',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '800',
              boxShadow: '0 4px 12px rgba(1, 62, 55, 0.25)',
              position: 'relative'
            }}>
              {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
              {lastName ? lastName.charAt(0).toUpperCase() : ''}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2.5px solid #FFFFFF'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  {firstName} {lastName}
                </h1>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  backgroundColor: userRole === 'super_admin' ? '#EFF6FF' : '#ECFDF5',
                  color: userRole === 'super_admin' ? '#1D4ED8' : '#047857',
                  border: `1px solid ${userRole === 'super_admin' ? '#BFDBFE' : '#A7F3D0'}`
                }}>
                  {getRoleDisplayName(userRole)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '0.8125rem', color: '#64748B', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} color="#64748B" /> {email}
                </span>
                {phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#64748B" /> {phone}
                  </span>
                )}
                {organization?.name && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={14} color="#64748B" /> {organization.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header Quick Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadProfile}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '9px 15px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#013E37',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '9px 16px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(1, 62, 55, 0.2)'
              }}
            >
              Tableau de Bord <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 4 KPI METRIC CARDS */}
        {/* ----------------------------------------------------------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

          {/* Card 1: Statut du Compte */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Statut du Compte
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>
              Actif & Vérifié
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
              Authentification sécurisée
            </div>
          </div>

          {/* Card 2: Rôle Système */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Niveau d'Accès
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Shield size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>
              {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' || userRole === 'owner' ? 'Propriétaire' : 'Gestionnaire'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
              Droits étendus sur la plateforme
            </div>
          </div>

          {/* Card 3: Canaux d'Alerte */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Canaux d'Alerte
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FDF2F8',
                color: '#DB2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bell size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>
              {Number(emailEnabled) + Number(smsEnabled) + Number(pushEnabled)} / 3 Actifs
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
              Email {emailEnabled ? '✓' : '✗'} &bull; SMS {smsEnabled ? '✓' : '✗'} &bull; Push {pushEnabled ? '✓' : '✗'}
            </div>
          </div>

          {/* Card 4: Sécurité Bancaire */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                Chiffrement & Sécurité
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#013E37', marginTop: '10px' }}>
              AES-256 Bit
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '4px', fontWeight: '600' }}>
              Session & données scellées
            </div>
          </div>

        </div>

        {/* Global Success / Error Alerts */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '14px 18px',
            color: '#15803D',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Deletion Warning Banner if pending */}
        {isPendingDeletion && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '14px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <strong style={{ color: '#991B1B', fontSize: '0.95rem' }}>
                  Demande de suppression de compte et d'organisation en cours
                </strong>
                <div style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '2px' }}>
                  Demande effectuée le {deletionDate ? new Date(deletionDate).toLocaleDateString('fr-FR') : ''}. Période de grâce de 30 jours active. Vos données seront définitivement purgées au terme du délai.
                </div>
              </div>
            </div>

            <button
              onClick={handleCancelAccountDeletion}
              type="button"
              disabled={actionLoading}
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: '700',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
              }}
            >
              <RefreshCw size={14} /> Annuler la suppression & Réactiver
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TABS NAVIGATION */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #E2E8F0',
          paddingBottom: '2px',
          overflowX: 'auto'
        }}>
          {[
            { id: 'profile', label: 'Profil & Identité', icon: User },
            { id: 'security', label: 'Sécurité & Mot de Passe', icon: Lock },
            { id: 'notifications', label: 'Alertes & Relances', icon: Bell },
            { id: 'organization', label: 'Organisation & Données', icon: Building },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px 10px 0 0',
                  border: 'none',
                  borderBottom: isCurrent ? '3px solid #013E37' : '3px solid transparent',
                  backgroundColor: isCurrent ? '#FFFFFF' : 'transparent',
                  color: isCurrent ? '#013E37' : '#64748B',
                  fontWeight: isCurrent ? '800' : '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isCurrent ? '#013E37' : '#64748B'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: PROFIL & IDENTITÉ */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Identity Form */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#013E37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Informations Personnelles
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Vos coordonnées de contact et informations de facturation
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      PRÉNOM *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      NOM DE FAMILLE *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    ADRESSE EMAIL (IDENTIFIANT UNIQUE)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={email}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '90px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        backgroundColor: '#F8FAFC',
                        color: '#64748B',
                        cursor: 'not-allowed'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.6875rem',
                      fontWeight: '700',
                      color: '#047857',
                      backgroundColor: '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid #A7F3D0'
                    }}>
                      ✓ Vérifié
                    </span>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                    L'adresse email sert d'identifiant sécurisé. Contactez le support pour toute modification.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    NUMÉRO DE TÉLÉPHONE (WHATSAPP / SMS)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: +225 07 00 00 00 00"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                  />
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                    Utilisé pour les alertes SMS et la communication instantanée avec vos locataires.
                  </p>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      backgroundColor: '#013E37',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px 22px',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
                    }}
                  >
                    {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                    {actionLoading ? 'Enregistrement en cours...' : 'Enregistrer mon profil'}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Overview & Privilege Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#013E37" />
                  Rôle & Permissions Système
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Rôle d'administration</span>
                    <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{getRoleDisplayName(userRole)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Organisation</span>
                    <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>{organization?.name || 'Indépendant'}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Plan d'abonnement</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#047857' }}>
                      {organization?.plan ? organization.plan.toUpperCase() : 'STANDARD'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Pays d'immatriculation</span>
                    <strong style={{ fontSize: '0.8125rem', color: '#0F172A' }}>🇨🇮 Côte d'Ivoire</strong>
                  </div>
                </div>
              </div>

              {/* Quick links to plans */}
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Sparkles size={20} color="#D97706" />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                      Gestion de votre Abonnement SaaS
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                      Consultez vos quotas, factures et options débloquées.
                    </div>
                  </div>
                </div>

                <Link
                  href="/subscription"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#013E37',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Voir l'abonnement <ArrowRight size={12} />
                </Link>
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: SÉCURITÉ & MOT DE PASSE */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Formulaire Changement de Mot de passe */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Modifier votre Mot de Passe
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Protégez votre compte avec un mot de passe robuste et unique
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Current Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    MOT DE PASSE ACTUEL *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Saisissez votre mot de passe actuel"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '40px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    NOUVEAU MOT DE PASSE *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 caractères complexes"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '40px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Gauge */}
                  {newPassword && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: '700', color: '#64748B' }}>Force du mot de passe :</span>
                        <span style={{ fontSize: '0.6875rem', fontWeight: '800', color: strength.color }}>{strength.text}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', backgroundColor: '#F1F5F9', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ width: `${strength.percent}%`, height: '100%', backgroundColor: strength.color, transition: 'all 0.25s ease' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    CONFIRMER LE NOUVEAU MOT DE PASSE *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez votre nouveau mot de passe"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '40px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      backgroundColor: '#013E37',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '11px 22px',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
                    }}
                  >
                    {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <Lock size={16} />}
                    {actionLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </button>
                </div>
              </form>
            </div>

            {/* Checklist des exigences de sécurité */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#059669" />
                  Règles de Robustesse Requises
                </h3>

                <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5', marginBottom: '16px' }}>
                  Pour garantir la sécurité de votre patrimoine et des transactions locatives, votre mot de passe doit remplir les 4 conditions suivantes :
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passwordCriteria.length ? '#047857' : '#64748B' }}>
                    <CheckCircle2 size={16} color={passwordCriteria.length ? '#059669' : '#CBD5E1'} />
                    <span>Au moins <strong>8 caractères</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: (passwordCriteria.uppercase && passwordCriteria.lowercase) ? '#047857' : '#64748B' }}>
                    <CheckCircle2 size={16} color={(passwordCriteria.uppercase && passwordCriteria.lowercase) ? '#059669' : '#CBD5E1'} />
                    <span>Au moins une <strong>majuscule (A-Z)</strong> et une <strong>minuscule (a-z)</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passwordCriteria.number ? '#047857' : '#64748B' }}>
                    <CheckCircle2 size={16} color={passwordCriteria.number ? '#059669' : '#CBD5E1'} />
                    <span>Au moins un <strong>chiffre (0-9)</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem', color: passwordCriteria.special ? '#047857' : '#64748B' }}>
                    <CheckCircle2 size={16} color={passwordCriteria.special ? '#059669' : '#CBD5E1'} />
                    <span>Au moins un <strong>caractère spécial (@, $, !, %, *, ?, &, #)</strong></span>
                  </div>
                </div>
              </div>

              {/* Bonnes pratiques */}
              <div style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '14px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: '700', fontSize: '0.875rem' }}>
                  <ShieldCheck size={18} />
                  Sécurité des Sessions Naforo
                </div>
                <p style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '6px', lineHeight: '1.5', margin: '6px 0 0 0' }}>
                  Votre session est automatiquement expirée en cas d'inactivité prolongée. Ne communiquez jamais votre mot de passe, même à un membre du support Naforo.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: NOTIFICATIONS & RELANCES */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Canaux d'Alertes */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Canaux de Transmission
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Activez les canaux de réception pour vous et votre équipe
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Email toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>Notifications par E-mail</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Reçus de paiement, quittances PDF, alertes de contrat et rapports
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#013E37' }}
                  />
                </div>

                {/* SMS toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>Notifications SMS Mobiles</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Alertes instantanées par SMS sur le réseau Orange, MTN, Moov CI
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#013E37' }}
                  />
                </div>

                {/* Push toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>Notifications Push In-App</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Alertes temps réel dans le backoffice et sur l'application mobile
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#013E37' }}
                  />
                </div>

                {/* Relances automatiques toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#166534' }}>Moteur de Relance Automatique</div>
                      <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '2px' }}>
                        Déclenchement automatique des avis d'échéance et relances d'impayés
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#013E37' }}
                  />
                </div>

              </div>
            </div>

            {/* Calendrier & Fréquences des Relances */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#013E37" />
                  Calendrier des Relances Planifiées
                </h3>

                <p style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: '1.5', marginBottom: '18px' }}>
                  Indiquez les jours de déclenchement automatique pour avertir les locataires par SMS et Email :
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      AVIS D'ÉCHÉANCE AVANT TERME (JOURS RESTANTS)
                    </label>
                    <input
                      type="text"
                      value={reminderDaysBefore}
                      onChange={(e) => setReminderDaysBefore(e.target.value)}
                      placeholder="Ex: 15, 7, 3, 1"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                      Exemple : <strong>15, 7, 3, 1</strong> enverra un rappel à J-15, J-7, J-3 et la veille de l'échéance.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                      RELANCES D'IMPAYÉS APRÈS ÉCHÉANCE (JOURS DE RETARD)
                    </label>
                    <input
                      type="text"
                      value={reminderDaysAfter}
                      onChange={(e) => setReminderDaysAfter(e.target.value)}
                      placeholder="Ex: 3, 7, 15"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        color: '#0F172A'
                      }}
                    />
                    <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>
                      Exemple : <strong>3, 7, 15</strong> relancera le locataire à J+3, J+7 et J+15 après la date d'exigibilité.
                    </p>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleUpdateNotifications}
                      disabled={actionLoading}
                      style={{
                        backgroundColor: '#013E37',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '11px 22px',
                        fontWeight: '700',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
                      }}
                    >
                      {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                      {actionLoading ? 'Enregistrement...' : 'Enregistrer les alertes & relances'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: ORGANISATION, DONNÉES & SUPPRESSION */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'organization' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Identity & RGPD Center */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ECFDF5', color: '#013E37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={16} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    Fiche Organisation & Souveraineté
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0 0' }}>
                    Identifiant légal, export de sauvegarde et conformité des données
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    RAISON SOCIALE / NOM DU BAILLEUR
                  </label>
                  <input
                    type="text"
                    value={organization?.name || 'Non renseigné'}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      backgroundColor: '#F8FAFC',
                      color: '#0F172A',
                      fontWeight: '600'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    IDENTIFIANT UNIQUE D'ORGANISATION (UUID)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={orgId || 'Aucune organisation'}
                      disabled
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        paddingRight: '90px',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace',
                        backgroundColor: '#F8FAFC',
                        color: '#64748B'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyOrgId}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        color: copiedOrgId ? '#059669' : '#013E37',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedOrgId ? <Check size={12} /> : <Copy size={12} />}
                      {copiedOrgId ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                </div>

                {/* Backup export card */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '18px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={20} color="#013E37" />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                        Sauvegarde Intégrale des Données (Export RGPD)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Exportez l'intégralité de vos biens, locataires, baux, paiements et écritures comptables sous format JSON chiffré.
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={handleExportData}
                      disabled={exportLoading}
                      style={{
                        backgroundColor: '#013E37',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '9px 18px',
                        fontWeight: '700',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {exportLoading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                      {exportLoading ? 'Génération de l\'archive...' : 'Télécharger la sauvegarde complète (.JSON)'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Life Cycle & Danger Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {userRole === 'super_admin' ? (
                <div style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '14px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DBEAFE', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#1E40AF', margin: 0 }}>
                        Compte Super Administrateur Protégé
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                        Le compte SuperAdmin constitue le garant souverain de la plateforme Naforo. Il bénéficie d'une immunité totale et ne peut être supprimé.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#FFF5F5',
                  border: '1px solid #FED7D7',
                  borderRadius: '14px',
                  padding: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#C53030', marginBottom: '14px' }}>
                    <Trash2 size={18} />
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>
                      Cycle de Vie & Suppression du Compte
                    </h3>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#742A2A', lineHeight: '1.5', margin: 0 }}>
                    Demandez la suppression irréversible de votre organisation et de l'ensemble des données associées.
                    Une <strong>période de grâce légale de 30 jours</strong> s'applique automatiquement pour prévenir toute suppression accidentelle.
                  </p>

                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #FEB2B2',
                    fontSize: '0.6875rem',
                    color: '#9B2C2C'
                  }}>
                    ⚠️ <strong>Prérequis strict :</strong> Tous les contrats de baux en cours doivent avoir été préalablement résiliés ou clôturés.
                  </div>

                  {!isPendingDeletion && (
                    <div style={{ marginTop: '18px' }}>
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        style={{
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '9px 18px',
                          fontSize: '0.8125rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Trash2 size={14} /> Demander la suppression de l'organisation
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {/* ----------------------------------------------------------------- */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: '#991B1B', margin: 0 }}>
                  Suppression de Compte
                </h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {deleteError && (
              <div style={{ backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '8px', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '16px' }}>
                {deleteError}
              </div>
            )}

            <div style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: '1.5', marginBottom: '18px' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                Vous êtes sur le point d'enclencher la procédure de suppression définitive de votre organisation <strong>{organization?.name}</strong>.
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li>Une période de grâce de 30 jours commence dès maintenant.</li>
                <li>Pendant ces 30 jours, vous pouvez annuler la suppression à tout moment.</li>
                <li>Au 30ème jour, toutes vos données (biens, locataires, baux, pièces jointes) seront irrémédiablement effacées.</li>
              </ul>
            </div>

            <form onSubmit={handleRequestAccountDeletion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  CONFIRMEZ VOTRE MOT DE PASSE ACTUEL *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showDeletePass ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe pour valider"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      paddingRight: '40px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePass(!showDeletePass)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer'
                    }}
                  >
                    {showDeletePass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{
                    flex: 1,
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer'
                  }}
                >
                  {actionLoading ? 'Validation...' : 'Confirmer la suppression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
