'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import {
  Gem,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Users,
  Upload,
  Download,
  Calculator,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Database,
  ArrowRight,
  CreditCard,
  Smartphone,
  Landmark,
  X,
  FileText,
  Lock,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Tabs: 'overview' | 'plans' | 'invoices' | 'data'
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'invoices' | 'data'>('overview');

  // Plan Selection & Checkout Modal
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<any | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Checkout Form States
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [transactionNumber, setTransactionNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});

  // Interactive Agency Savings Calculator State
  const [calcPropertyCount, setCalcPropertyCount] = useState<number>(6);
  const [calcAvgRent, setCalcAvgRent] = useState<number>(250000);

  const loadData = () => {
    setLoading(true);

    Promise.all([
      api.get('/subscriptions/plans').catch(() => []),
      api.get('/subscriptions/me').catch(() => null),
      api.get('/subscriptions/payments/history').catch(() => [])
    ])
      .then(([plansData, mySubData, historyData]) => {
        const pList = Array.isArray(plansData) ? plansData : plansData?.items || plansData?.data || [];
        setPlans(pList);

        if (mySubData) {
          setMySub(mySubData);
          window.dispatchEvent(new Event('subscription-updated'));
        }

        const hList = Array.isArray(historyData) ? historyData : historyData?.items || historyData?.data || [];
        setPaymentHistory(hList);
      })
      .catch((err) => {
        handleFormError(err, 'Erreur lors du chargement des informations d’abonnement.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatFcfa = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
  };

  // Safe feature list extraction
  const FEATURE_LABELS: Record<string, string> = {
    email_reminders: 'Relances Email automatiques',
    standard_pdf: 'Quittances PDF conformes & horodatées',
    dashboard: 'Tableau de bord analytique & suivi des loyers',
    sms_whatsapp: 'Relances SMS automatiques (Twilio)',
    mobile_money_autovalidate: 'Paiements Mobile Money (Wave, Orange, MTN, Moov)',
    qr_code_verification: 'Quittances certifiées avec QR Code cryptographique',
    excel_export: 'Exports comptables Excel (.xlsx) & DGI',
    ged_vault: 'Coffre-fort GED & pièces justificatives',
    chat_encrypted: 'Messagerie locataires intégrée chiffrée',
    incident_management: 'Gestion des pannes & tickets d\'intervention',
    multi_users: 'Multi-gestionnaires & collaborateurs d’agence',
    agency_mandates: 'Mandats de gérance & multi-bailleurs',
    dgi_accounting_export: 'Conformité fiscale & bilans DGI',
    api_webhooks: 'Accès API & intégrations webhooks',
    priority_support_sla: 'Support prioritaire dédié & SLA 99.9%',
    basic_support: 'Support standard par e-mail',
  };

  const formatFeatureLabel = (feat: string): string => {
    return FEATURE_LABELS[feat] || feat;
  };

  const getPlanFeatures = (plan: any): string[] => {
    if (!plan) return [];
    if (Array.isArray(plan.features)) return plan.features;
    try {
      return JSON.parse(plan.features || '[]');
    } catch {
      return [];
    }
  };

  // Calculate price dynamically based on plan & cycle
  const calculatePlanPrice = (plan: any, cycle: 'monthly' | 'yearly') => {
    if (!plan) return 0;
    const baseMonthly = Number(plan.priceMonthlyXof || 0);
    if (baseMonthly === 0) return 0;

    const discountPercent = Number(plan.yearlyDiscountPercent || 20);
    if (cycle === 'yearly') {
      return baseMonthly * 12 * (1 - discountPercent / 100);
    }
    return baseMonthly;
  };

  // Open Checkout for a chosen plan
  const handleOpenCheckout = (plan: any) => {
    setSelectedPlanForCheckout(plan);
    setTransactionNumber('');
    setProofFile(null);
    setCheckoutErrors({});
    setShowCheckoutModal(true);
  };

  // Submit Payment Declaration
  const handleDeclareSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setCheckoutErrors({});
    if (!transactionNumber.trim()) {
      setCheckoutErrors({ transactionNumber: 'Veuillez saisir la référence ou le numéro de transaction.' });
      return;
    }

    setActionLoading(true);
    try {
      const paymentData = await api.post('/subscriptions/pay', {
        planId: selectedPlanForCheckout.id,
        billingCycle,
        paymentMethod,
        transactionNumber: transactionNumber.trim(),
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
      });

      if (proofFile && paymentData.id) {
        const formData = new FormData();
        formData.append('file', proofFile);
        await api.upload(`/subscriptions/payments/${paymentData.id}/proof`, formData);
      }

      showFormSuccess('Preuve de règlement transmise avec succès ! Votre abonnement sera activé dès validation par le super-administrateur.');
      setShowCheckoutModal(false);
      setSelectedPlanForCheckout(null);
      loadData();
    } catch (err) {
      const res = handleFormError(err, 'Erreur lors de la déclaration du règlement d’abonnement.');
      if (res.fieldErrors) setCheckoutErrors(res.fieldErrors);
    } finally {
      setActionLoading(false);
    }
  };

  // Download Full Data Backup (JSON)
  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${baseUrl}/subscriptions/export-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Impossible de générer l’archive de sauvegarde.');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `naforo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      showFormSuccess('Sauvegarde intégrale de vos données téléchargée avec succès (Format JSON certifié).');
    } catch (err: any) {
      handleFormError(err, 'Erreur lors du téléchargement de la sauvegarde.');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculations for agency comparison
  const totalMonthlyRent = calcPropertyCount * calcAvgRent;
  const agencyMonthlyCost = totalMonthlyRent * 0.08; // 8% frais de gestion moyen
  const agencyYearlyCost = agencyMonthlyCost * 12;
  const naforoYearlyCost = 19900 * 12; // Formule Pro
  const yearlySavings = Math.max(0, agencyYearlyCost - naforoYearlyCost);

  const remainingDays = mySub?.daysRemaining !== undefined ? mySub.daysRemaining : 0;
  const isExpired = mySub?.isExpired;
  const activePlanName = mySub?.planName || 'Starter';

  // Consumed time progress
  const timeProgress = useMemo(() => {
    if (!mySub?.startDate || !mySub?.endDate) return 0;
    const start = new Date(mySub.startDate).getTime();
    const end = new Date(mySub.endDate).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.min(Math.round(((now - start) / (end - start)) * 100), 100);
  }, [mySub]);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement de votre abonnement et des forfaits...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. Header SaaS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(1, 62, 55, 0.08)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Gem size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  Abonnement & Facturation
                </h1>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: mySub?.isSuspended ? 'var(--danger-light)' : mySub?.hasPendingPayment ? '#eff6ff' : 'var(--success-light)',
                  color: mySub?.isSuspended ? 'var(--danger)' : mySub?.hasPendingPayment ? '#1d4ed8' : 'var(--success)'
                }}>
                  {mySub?.isSuspended
                    ? 'Mode lecture seule'
                    : mySub?.hasPendingPayment
                    ? 'Validation en cours'
                    : `Forfait ${activePlanName} actif`}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Gérez votre souscription logicielle, surveillez vos quotas et téléchargez vos archives
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="btn btn-secondary"
              style={{ gap: '8px', fontSize: '0.8125rem' }}
              title="Exporter l'ensemble de vos données au format JSON"
            >
              <Download size={15} />
              {isExporting ? 'Export en cours...' : 'Sauvegarde RGPD'}
            </button>

            <button
              onClick={() => setActiveTab('plans')}
              className="btn btn-primary"
              style={{ gap: '8px', fontSize: '0.8125rem' }}
            >
              <Zap size={15} />
              Changer de forfait
            </button>
          </div>
        </div>

        {/* 2. Critical Alert Banners (Sans bordure gauche colorée) */}

        {/* ALERTE A: Compte Suspendu (Mode lecture seule) */}
        {mySub?.isSuspended && (
          <div className="card" style={{
            backgroundColor: '#fff5f5',
            borderColor: '#fca5a5',
            padding: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertOctagon size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                  Compte Suspendu — Accès Restreint en Mode Lecture Seule
                </h3>
                <span className="badge badge-danger">Écritures bloquées</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {mySub?.suspensionReason || 'Votre abonnement a expiré. Vous pouvez consulter vos informations mais les actions d’ajout et de modification sont temporairement suspendues.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="btn btn-danger"
                  style={{ fontSize: '0.8125rem', padding: '8px 14px', gap: '6px' }}
                >
                  <Zap size={14} /> Régulariser mon abonnement
                </button>
                <button
                  onClick={handleDownloadBackup}
                  disabled={isExporting}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem', padding: '8px 14px', gap: '6px', borderColor: '#fca5a5' }}
                >
                  <Download size={14} /> Sauvegarder mes données
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTE B: Preuve soumise en attente de validation */}
        {mySub?.hasPendingPayment && (
          <div className="card" style={{
            backgroundColor: '#eff6ff',
            borderColor: '#bfdbfe',
            padding: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                  Paiement de Réabonnement en Cours de Validation
                </h3>
                {mySub.pendingPayment?.paymentReference && (
                  <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                    {mySub.pendingPayment.paymentReference}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#1e3a8a', margin: 0, lineHeight: 1.5 }}>
                Votre déclaration de versement pour le forfait <strong>{mySub.pendingPayment?.targetPlanName || 'Sélectionné'}</strong> ({formatFcfa(mySub.pendingPayment?.amountXof)}) a bien été transmise. Votre accès sera renouvelé automatiquement dès validation par le super-administrateur.
              </p>
            </div>
          </div>
        )}

        {/* ALERTE C: Période de grâce 90 jours */}
        {mySub?.remainingGraceDays !== null && mySub?.remainingGraceDays !== undefined && (
          <div className="card" style={{
            backgroundColor: '#fffbeb',
            borderColor: '#fde68a',
            padding: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#d97706',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldAlert size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', margin: 0 }}>
                  Période de Rétention & Sauvegarde (90 Jours de Grâce)
                </h3>
                <span className="badge badge-warning">{mySub.remainingGraceDays} jour(s) restant(s)</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#78350f', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                {mySub?.deactivationReason || 'Vos données sont sécurisées dans notre coffre-fort pour encore 90 jours avant purge définitive.'}
              </p>
              <button
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '6px 12px', gap: '6px', borderColor: '#fde68a' }}
              >
                <Download size={13} /> Télécharger mon archive complète (JSON)
              </button>
            </div>
          </div>
        )}

        {/* 3. Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'Vue d’ensemble & Quotas', icon: Layers },
            { id: 'plans', label: 'Forfaits & Mise à niveau', icon: Zap },
            { id: 'invoices', label: 'Historique des Factures', icon: FileText, count: paymentHistory.length },
            { id: 'data', label: 'Sauvegarde & Rétention RGPD', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  fontSize: '0.875rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                  backgroundColor: isCurrent ? 'rgba(1, 62, 55, 0.06)' : 'transparent',
                  border: 'none',
                  borderBottom: isCurrent ? '2px solid var(--primary)' : '2px solid transparent',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: isCurrent ? 'var(--primary)' : '#e2e8f0',
                    color: isCurrent ? '#ffffff' : '#475569'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. Tab 1: VUE D’ENSEMBLE & QUOTAS */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* A. Status Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

              {/* Card 1: Forfait Actuel */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    FORFAIT ACTUEL
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gem size={14} />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    {activePlanName}
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: isExpired ? 'var(--danger)' : remainingDays <= 7 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                    {isExpired ? 'Abonnement expiré' : `Reste ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${timeProgress}%`,
                        height: '100%',
                        backgroundColor: isExpired ? 'var(--danger)' : remainingDays <= 7 ? 'var(--warning)' : 'var(--primary)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Début : {mySub?.startDate ? new Date(mySub.startDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    <span>Échéance : {mySub?.endDate ? new Date(mySub.endDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Quota Biens Immobiliers */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    QUOTA BIENS IMMOBILIERS
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={14} />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    {mySub?.quotas?.properties?.used || 0} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {mySub?.quotas?.properties?.max || 2} biens</span>
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: (mySub?.quotas?.properties?.used || 0) >= (mySub?.quotas?.properties?.max || 2) ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {(mySub?.quotas?.properties?.used || 0) >= (mySub?.quotas?.properties?.max || 2) ? 'Quota maximal atteint' : `${Math.max(0, (mySub?.quotas?.properties?.max || 2) - (mySub?.quotas?.properties?.used || 0))} place(s) disponible(s)`}
                  </span>
                </div>

                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round(((mySub?.quotas?.properties?.used || 0) / (mySub?.quotas?.properties?.max || 2)) * 100))}%`,
                      height: '100%',
                      backgroundColor: (mySub?.quotas?.properties?.used || 0) >= (mySub?.quotas?.properties?.max || 2) ? 'var(--danger)' : 'var(--primary)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

              {/* Card 3: Quota Locataires */}
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    QUOTA LOCATAIRES ACTIFS
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    {mySub?.quotas?.tenants?.used || 0} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {mySub?.quotas?.tenants?.max || 2} locataires</span>
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: (mySub?.quotas?.tenants?.used || 0) >= (mySub?.quotas?.tenants?.max || 2) ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {(mySub?.quotas?.tenants?.used || 0) >= (mySub?.quotas?.tenants?.max || 2) ? 'Quota maximal atteint' : `${Math.max(0, (mySub?.quotas?.tenants?.max || 2) - (mySub?.quotas?.tenants?.used || 0))} place(s) disponible(s)`}
                  </span>
                </div>

                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.round(((mySub?.quotas?.tenants?.used || 0) / (mySub?.quotas?.tenants?.max || 2)) * 100))}%`,
                      height: '100%',
                      backgroundColor: (mySub?.quotas?.tenants?.used || 0) >= (mySub?.quotas?.tenants?.max || 2) ? 'var(--danger)' : 'var(--success)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>

            </div>

            {/* B. Calculateur d'Économie Interactif vs Agence */}
            <div className="card" style={{
              backgroundColor: '#013E37',
              color: '#ffffff',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(255, 239, 179, 0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                    Calculateur d’Économies vs Agence Traditionnelle (8% à 10%)
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Estimez votre gain net annuel en utilisant Naforo plutôt qu’un mandat d’agence coûteux
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', alignItems: 'center' }}>
                {/* Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Nombre de logements gérés :</span>
                      <strong style={{ color: 'var(--accent)' }}>{calcPropertyCount} bien(s)</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={calcPropertyCount}
                      onChange={(e) => setCalcPropertyCount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                      <span style={{ color: '#cbd5e1' }}>Loyer mensuel moyen :</span>
                      <strong style={{ color: 'var(--accent)' }}>{formatFcfa(calcAvgRent)}</strong>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="1500000"
                      step="25000"
                      value={calcAvgRent}
                      onChange={(e) => setCalcAvgRent(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                </div>

                {/* Comparison Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#94a3b8' }}>Honoraires Agence (8% / an) :</span>
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{formatFcfa(agencyYearlyCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Abonnement Naforo Pro (Annuel) :</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{formatFcfa(naforoYearlyCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>Économie Nette :</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                      + {formatFcfa(yearlySavings)} / an
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. Tab 2: FORFAITS & MISE À NIVEAU (PRICING TIERS) */}
        {activeTab === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Billing Cycle Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'inline-flex',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                border: '1px solid var(--border)'
              }}>
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: billingCycle === 'monthly' ? 'var(--primary)' : 'transparent',
                    color: billingCycle === 'monthly' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Facturation Mensuelle
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: billingCycle === 'yearly' ? 'var(--primary)' : 'transparent',
                    color: billingCycle === 'yearly' ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Facturation Annuelle</span>
                  <span style={{ backgroundColor: 'var(--success)', color: '#ffffff', fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '9999px', fontWeight: 800 }}>
                    -20% Remise
                  </span>
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {billingCycle === 'yearly' ? 'Profitez de 2 mois offerts sur l’ensemble des forfaits annuels !' : 'Paiement mois par mois sans engagement à long terme.'}
              </span>
            </div>

            {/* Plans Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              alignItems: 'stretch'
            }}>
              {plans.map((plan) => {
                const isCurrentPlan = mySub?.planCode === plan.code;
                const isRecommended = plan.isRecommended || plan.code === 'pro';
                const price = calculatePlanPrice(plan, billingCycle);
                const features = getPlanFeatures(plan);

                return (
                  <div
                    key={plan.id}
                    className="card"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      border: isRecommended ? '2px solid var(--primary)' : '1px solid var(--border)',
                      position: 'relative',
                      boxShadow: isRecommended ? '0 8px 24px rgba(1, 62, 55, 0.1)' : 'var(--shadow-sm)'
                    }}
                  >
                    {isRecommended && (
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'var(--primary)',
                        color: '#ffffff',
                        fontSize: '0.6875rem',
                        fontWeight: 800,
                        padding: '3px 12px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        ⭐ Recommandé
                      </div>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div style={{ marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {plan.code?.toUpperCase() || 'FORFAIT'}
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 6px 0', color: 'var(--text)' }}>
                          {plan.name}
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', minHeight: '38px', margin: 0 }}>
                          {plan.description || `Gestion locative optimale jusqu’à ${plan.maxProperties} biens.`}
                        </p>
                      </div>

                      {/* Price */}
                      <div style={{ marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
                            {formatFcfa(price)}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {billingCycle === 'yearly' ? '/ an' : '/ mois'}
                          </span>
                        </div>
                        {billingCycle === 'yearly' && Number(plan.priceMonthlyXof) > 0 && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                            Soit {formatFcfa(Math.round(price / 12))} / mois
                          </span>
                        )}
                      </div>

                      {/* Features List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                          <span><strong>Jusqu’à {plan.maxProperties} biens</strong> immobiliers</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                          <span><strong>Jusqu’à {plan.maxTenants} locataires</strong> actifs</span>
                        </div>
                        {features.map((feat: string, fIdx: number) => (
                          <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Check size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                            <span>{formatFeatureLabel(feat)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isCurrentPlan ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ width: '100%', opacity: 0.7, cursor: 'default' }}
                          disabled
                        >
                          ✓ Forfait actuel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(plan)}
                          className={isRecommended ? 'btn btn-primary' : 'btn btn-secondary'}
                          style={{ width: '100%', padding: '12px', fontWeight: 700 }}
                        >
                          Choisir {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 6. Tab 3: HISTORIQUE DES FACTURES */}
        {activeTab === 'invoices' && (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Historique des Factures de Souscription
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Consultez et téléchargez les factures acquittées de votre abonnement Naforo
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RÉFÉRENCE & DATE</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FORFAIT & CYCLE</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MONTANT</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>STATUT</th>
                  <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>FACTURE PDF</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      Aucune facture d’abonnement enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  paymentHistory.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{p.paymentReference}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(p.paymentDate || p.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem' }}>
                        <span>{p.subscription?.plan?.name || 'Abonnement'}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.billingCycle === 'yearly' ? 'Annuel (-20%)' : 'Mensuel'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.9375rem', fontWeight: 700 }}>
                        {formatFcfa(Number(p.amountXof))}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {p.status === 'validated' ? (
                          <span className="badge badge-success" style={{ gap: '4px' }}>
                            <CheckCircle2 size={12} /> Validé
                          </span>
                        ) : p.status === 'pending' ? (
                          <span className="badge badge-warning" style={{ gap: '4px' }}>
                            <Clock size={12} /> En cours
                          </span>
                        ) : (
                          <span className="badge badge-danger">Rejeté</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {p.pdfUrl ? (
                          <a
                            href={`http://localhost:3000${p.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                          >
                            <Download size={13} />
                            Facture PDF
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En attente</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Tab 4: SAUVEGARDE & RÉTENTION RGPD */}
        {activeTab === 'data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      Souveraineté des Données & Export Intégral (RGPD)
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Vos données vous appartiennent. Téléchargez à tout moment une sauvegarde complète.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadBackup}
                  disabled={isExporting}
                  className="btn btn-primary"
                  style={{ gap: '8px' }}
                >
                  <Download size={16} />
                  {isExporting ? 'Génération...' : 'Télécharger l’archive JSON'}
                </button>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius)',
                padding: '16px',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6
              }}>
                <strong style={{ color: 'var(--text)' }}>📌 Politique de Sécurité & Rétention des Données Naforo :</strong>
                <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                  <li><strong>Périmètre de l’export :</strong> L’archive JSON téléchargeable comprend la totalité de votre organisation : biens immobiliers, locataires, contrats de bail, échéances, factures, encaissements, quittances et journal comptable.</li>
                  <li><strong>Période de grâce de 90 jours :</strong> En cas de non-renouvellement de votre abonnement, votre compte passe d’abord en mode lecture seule (5 jours), puis est désactivé. Vos données demeurent intégralement conservées et sauvegardées pendant 90 jours avant toute suppression définitive.</li>
                  <li><strong>Chiffrement & Sauvegardes continues :</strong> Vos données sont sauvegardées quotidiennement dans nos bases de données PostgreSQL sécurisées avec réplication continue.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL CHECKOUT & DÉCLARATION DU PAIEMENT */}
      {showCheckoutModal && selectedPlanForCheckout && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gem size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                    Souscription au Forfait {selectedPlanForCheckout.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Règlement par Mobile Money ou Virement Bancaire
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Price Summary Banner */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  CYCLE : {billingCycle === 'yearly' ? 'ANNUEL (12 MOIS, -20%)' : 'MENSUEL (30 JOURS)'}
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatFcfa(calculatePlanPrice(selectedPlanForCheckout, billingCycle))}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Jusqu’à {selectedPlanForCheckout.maxProperties} biens
              </span>
            </div>

            <form onSubmit={handleDeclareSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Canal de règlement */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MOYEN DE PAIEMENT SÉLECTIONNÉ *</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="wave">Wave Côte d’Ivoire (Paiement direct)</option>
                  <option value="orange_money">Orange Money CI</option>
                  <option value="mtn_money">MTN Mobile Money CI</option>
                  <option value="moov_money">Moov Money CI</option>
                  <option value="bank_transfer">Virement bancaire (Dépôt direct)</option>
                </select>
              </div>

              {/* Instructions de paiement Mobile Money */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '10px 14px', fontSize: '0.7825rem', color: '#92400e', lineHeight: 1.4 }}>
                <strong>📱 Instructions :</strong> Effectuez votre dépôt ou transfert vers le compte marchand Naforo officiel, puis reportez ci-dessous le numéro de transaction et la preuve.
              </div>

              {/* Référence transaction */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">NUMÉRO DE TRANSACTION / BORDEREAU *</label>
                <input
                  type="text"
                  className={`form-control ${checkoutErrors.transactionNumber ? 'is-invalid' : ''}`}
                  placeholder="Ex: WAVE-982183921, Réf Orange Money..."
                  value={transactionNumber}
                  onChange={(e) => {
                    setTransactionNumber(e.target.value);
                    if (checkoutErrors.transactionNumber) setCheckoutErrors({});
                  }}
                  required
                />
                {checkoutErrors.transactionNumber && (
                  <div className="form-error">{checkoutErrors.transactionNumber}</div>
                )}
              </div>

              {/* Date du règlement */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DATE DE RÈGLEMENT *</label>
                <input
                  type="date"
                  className="form-control"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </div>

              {/* Justificatif / Capture d'écran */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">PREUVE DE PAIEMENT (IMAGE OU PDF)</label>
                <div style={{
                  border: '1.5px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  textAlign: 'center',
                  backgroundColor: proofFile ? 'var(--success-light)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <Upload size={16} />
                  <span style={{ fontSize: '0.8125rem' }}>
                    {proofFile ? proofFile.name : 'Cliquez pour ajouter la capture d’écran'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Transmission...' : 'Confirmer mon réabonnement'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
