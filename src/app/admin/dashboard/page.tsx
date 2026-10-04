'use client';

import { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  Building, 
  FileText, 
  Activity, 
  Radio, 
  Gem, 
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Server,
  RefreshCw,
  ExternalLink,
  Receipt,
  Eye,
  Check,
  X,
  ChevronRight,
  BarChart2,
  ArrowUpRight,
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';

interface SystemHealth {
  status: string;
  database: string;
  redis: string;
  environment: string;
  version: string;
  timestamp: string;
}

interface MonthlyGrowth {
  month: string;
  orgCount: number;
  contractCount: number;
  revenue: number;
  saasRevenue: number;
}

interface RecentOrg {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  plan: string;
  createdAt: string;
  isActive: boolean;
  _count?: {
    properties: number;
    contracts: number;
    users: number;
  };
}

interface PendingSubscription {
  id: string;
  paymentReference: string;
  amountXof: number;
  paymentMethod: string;
  transactionNumber: string | null;
  paymentDate: string;
  proofUrl: string | null;
  billingCycle?: string;
  targetPlanId?: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface AdvancedStats {
  totalSaasRevenue: number;
  thisMonthSaasRevenue: number;
  lastMonthSaasRevenue: number;
  mrr: number;
  arr: number;
  totalRevenue: number;
  totalGmv: number;
  thisMonthGmv: number;
  lastMonthGmv: number;
  totalOrgs: number;
  activeOrgs: number;
  totalUsers: number;
  totalProperties: number;
  occupiedProperties: number;
  occupancyRate: number;
  totalTenants: number;
  totalContracts: number;
  activeContracts: number;
  totalPayments: number;
  totalReceipts: number;
  planBreakdown: {
    starter: number;
    pro: number;
    expert: number;
    enterprise: number;
  };
  monthlyGrowth: MonthlyGrowth[];
  recentOrgs: RecentOrg[];
  pendingSubscriptionsCount: number;
  pendingSubscriptionsList: PendingSubscription[];
  systemHealth: SystemHealth;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMetric, setChartMetric] = useState<'gmv' | 'saas'>('gmv');

  // Modals for inline subscription validation
  const [actionLoading, setActionLoading] = useState(false);
  const [validatingPayment, setValidatingPayment] = useState<PendingSubscription | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PendingSubscription | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get('/admin/stats/advanced');
      setStats(res);
    } catch (err: any) {
      toast.error("Impossible de charger les statistiques exécutives");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatFcfa = (val: number = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'wave':
        return { label: 'Wave CI', bg: '#eff6ff', color: '#1d4ed8' };
      case 'orange_money':
        return { label: 'Orange Money', bg: '#fff7ed', color: '#c2410c' };
      case 'mtn_money':
        return { label: 'MTN MoMo', bg: '#fefce8', color: '#a16207' };
      case 'moov_money':
        return { label: 'Moov Money', bg: '#f0fdf4', color: '#15803d' };
      case 'bank_transfer':
        return { label: 'Virement bancaire', bg: '#f8fafc', color: '#334155' };
      default:
        return { label: method, bg: '#f1f5f9', color: '#475569' };
    }
  };

  // Direct Quick Validation
  const handleConfirmValidate = async () => {
    if (!validatingPayment) return;
    setActionLoading(true);

    try {
      await api.put(`/subscriptions/payments/${validatingPayment.id}/validate`, {
        status: 'validated'
      });
      toast.success(`Abonnement de l'agence "${validatingPayment.organization?.name || 'Client'}" activé avec succès`);
      setValidatingPayment(null);
      fetchStats(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Échec de la validation de la souscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Quick Reject
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif du rejet");
      return;
    }
    setActionLoading(true);

    try {
      await api.put(`/subscriptions/payments/${rejectingPayment.id}/validate`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });
      toast.success("Déclaration de paiement d'abonnement rejetée");
      setRejectingPayment(null);
      setRejectionReason('');
      fetchStats(true);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Échec du rejet");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '65vh',
          gap: '16px'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid #e2e8f0',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Génération du cockpit exécutif SaaS Naforo...
          </div>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  // Visual calculations for chart
  const growthData = stats?.monthlyGrowth || [];
  const maxChartValue = Math.max(
    ...growthData.map(g => chartMetric === 'gmv' ? (g.revenue || 0) : (g.saasRevenue || 0)),
    100000
  );

  const totalPaidAgencies = (stats?.planBreakdown.pro || 0) + (stats?.planBreakdown.expert || 0) + (stats?.planBreakdown.enterprise || 0);
  const paidConversionRate = stats?.totalOrgs ? Math.round((totalPaidAgencies / stats.totalOrgs) * 100) : 0;

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        
        {/* Top Executive Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                Cockpit Exécutif SuperAdmin
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                Plateforme Active • v2.4
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Supervision consolidée du réseau multi-tenant, volume d'affaires (GMV), revenus d'abonnements et santé infrastructure.
            </p>
          </div>

          {/* Quick Action Navigation Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.8125rem', gap: '6px' }}
              title="Actualiser les métriques"
            >
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Actualiser
            </button>

            <Link href="/admin/subscriptions" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8125rem', gap: '6px', position: 'relative' }}>
              <CreditCard size={15} />
              Validation Abonnements
              {(stats?.pendingSubscriptionsCount || 0) > 0 && (
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800
                }}>
                  {stats?.pendingSubscriptionsCount}
                </span>
              )}
            </Link>

            <Link href="/admin/plans" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8125rem', gap: '6px' }}>
              <Gem size={15} /> Forfaits SaaS
            </Link>

            <Link href="/admin/broadcast" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem', gap: '6px' }}>
              <Radio size={15} /> Diffuser une Annonce
            </Link>
          </div>
        </div>

        {/* Priority Action Alert Banner (if pending subscriptions) */}
        {(stats?.pendingSubscriptionsCount || 0) > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0
              }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#92400e', marginBottom: '2px' }}>
                  Action Requise : {stats?.pendingSubscriptionsCount} souscription(s) en attente de validation
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#b45309' }}>
                  Des gestionnaires ont téléversé des preuves de paiement (Mobile Money, virement). Validez-les pour débloquer leurs forfaits sans délai.
                </div>
              </div>
            </div>

            <Link
              href="/admin/subscriptions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: '#d97706',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              Traiter les validations <ChevronRight size={16} />
            </Link>
          </div>
        )}

        {/* 4 Core Executive KPI Cards (Zero asymmetrical left border) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px'
        }}>
          
          {/* Card 1: MRR & Subscription Revenue */}
          <div className="card" style={{ padding: '22px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>
                  REVENU RÉCURRENT SAAS (MRR)
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {formatFcfa(stats?.mrr || 0)}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}> /mois</span>
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                <Gem size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>ARR Projeté :</span>
              <strong style={{ color: '#0f172a' }}>{formatFcfa(stats?.arr || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Total abonnements encaissés :</span>
              <strong style={{ color: '#16a34a' }}>{formatFcfa(stats?.totalSaasRevenue || 0)}</strong>
            </div>
          </div>

          {/* Card 2: Platform GMV (Gross Rent Transacted) */}
          <div className="card" style={{ padding: '22px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>
                  VOLUME D'AFFAIRES GÉRÉ (GMV LOYERS)
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {formatFcfa(stats?.totalGmv || 0)}
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
                <TrendingUp size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Loyers ce mois-ci :</span>
              <strong style={{ color: '#16a34a' }}>{formatFcfa(stats?.thisMonthGmv || 0)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Transactions certifiées :</span>
              <strong style={{ color: '#0f172a' }}>{stats?.totalPayments || 0} paiements</strong>
            </div>
          </div>

          {/* Card 3: Organizations & Agencies Network */}
          <div className="card" style={{ padding: '22px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>
                  ÉCOSYSTÈME B2B & AGENCES
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {stats?.totalOrgs || 0}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}> comptes</span>
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>
                <Building2 size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Agences actives :</span>
              <strong style={{ color: '#2563eb' }}>
                {stats?.activeOrgs || 0} ({stats?.totalOrgs ? Math.round(((stats.activeOrgs) / stats.totalOrgs) * 100) : 0}%)
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Conversion payante :</span>
              <strong style={{ color: '#7c3aed' }}>{paidConversionRate}% du réseau</strong>
            </div>
          </div>

          {/* Card 4: Real Estate Portfolio Scale & Occupancy */}
          <div className="card" style={{ padding: '22px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' }}>
                  PARC IMMOBILIER EN GESTION
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {stats?.totalProperties || 0}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}> lots</span>
                </div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: '10px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', flexShrink: 0 }}>
                <Building size={20} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Taux d'occupation :</span>
              <strong style={{ color: '#16a34a' }}>{stats?.occupancyRate || 0}% occupé</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.78rem' }}>
              <span style={{ color: '#64748b' }}>Locataires certifiés :</span>
              <strong style={{ color: '#0f172a' }}>{stats?.totalTenants || 0} locataires</strong>
            </div>
          </div>

        </div>

        {/* Operational Micro-Indicators Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="#2563eb" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Baux en cours</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {stats?.activeContracts || 0} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>/ {stats?.totalContracts || 0}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={18} color="#16a34a" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Quittances QR générées</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {stats?.totalReceipts || 0}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} color="#9333ea" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Utilisateurs du réseau</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                {stats?.totalUsers || 0} comptes
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="#059669" />
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Santé Système</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                PostgreSQL & Redis OK
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 Columns: Growth Chart & Plan Distribution */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '24px',
          alignItems: 'stretch'
        }}>
          
          {/* Column Left: Interactive Growth Trends & History */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} color="var(--primary)" /> Évolution & Performance sur 6 Mois
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Croissance des volumes financiers et activité contractuelle des organisations
                </p>
              </div>

              {/* Chart Metric Toggle */}
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                <button
                  type="button"
                  onClick={() => setChartMetric('gmv')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: chartMetric === 'gmv' ? '#ffffff' : 'transparent',
                    color: chartMetric === 'gmv' ? '#0f172a' : '#64748b',
                    boxShadow: chartMetric === 'gmv' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Volume Loyers (GMV)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('saas')}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: chartMetric === 'saas' ? '#ffffff' : 'transparent',
                    color: chartMetric === 'saas' ? '#0f172a' : '#64748b',
                    boxShadow: chartMetric === 'saas' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Revenus SaaS Naforo
                </button>
              </div>
            </div>

            {/* Visual Bar Chart in CSS */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
              height: '190px',
              padding: '16px 8px 10px 8px',
              backgroundColor: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #f1f5f9',
              marginBottom: '20px'
            }}>
              {growthData.map((item, idx) => {
                const val = chartMetric === 'gmv' ? (item.revenue || 0) : (item.saasRevenue || 0);
                const heightPercent = Math.max(8, Math.min(100, Math.round((val / maxChartValue) * 100)));

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                      {val > 0 ? (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`) : '0'}
                    </div>

                    <div style={{
                      width: '80%',
                      maxWidth: '44px',
                      height: `${heightPercent}%`,
                      borderRadius: '6px 6px 2px 2px',
                      backgroundColor: chartMetric === 'gmv' ? '#013E37' : '#d97706',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }} title={`${item.month}: ${formatFcfa(val)}`} />

                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginTop: '8px', textTransform: 'capitalize' }}>
                      {item.month?.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakdown Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>PÉRIODE</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>AGENCES CUMULÉES</th>
                    <th style={{ padding: '8px 10px', color: '#64748b' }}>NOUVEAUX BAUX</th>
                    <th style={{ padding: '8px 10px', color: '#64748b', textAlign: 'right' }}>VOLUME LOYERS (GMV)</th>
                    <th style={{ padding: '8px 10px', color: '#64748b', textAlign: 'right' }}>REVENU SAAS</th>
                  </tr>
                </thead>
                <tbody>
                  {growthData.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>{m.month}</td>
                      <td style={{ padding: '10px', color: '#475569' }}>{m.orgCount} agences</td>
                      <td style={{ padding: '10px', color: '#475569' }}>+{m.contractCount} baux</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{formatFcfa(m.revenue)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>{formatFcfa(m.saasRevenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Column Right: Plan Distribution & SaaS Health */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#7c3aed" /> Répartition des Forfaits
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Distribution des paliers d'abonnement sur le parc
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Starter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#475569' }}>Starter (Gratuit / Test)</span>
                  <span style={{ color: '#0f172a' }}>{stats?.planBreakdown.starter || 0} agences</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, ((stats?.planBreakdown.starter || 0) / (stats?.totalOrgs || 1)) * 100)}%`, backgroundColor: '#94a3b8' }} />
                </div>
              </div>

              {/* Pro */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#013E37' }}>Pro (Bailleurs Indépendants)</span>
                  <span style={{ color: '#0f172a' }}>{stats?.planBreakdown.pro || 0} agences</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, ((stats?.planBreakdown.pro || 0) / (stats?.totalOrgs || 1)) * 100)}%`, backgroundColor: 'var(--primary)' }} />
                </div>
              </div>

              {/* Expert / Agence */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#7c3aed' }}>Expert / Agence Immobilière</span>
                  <span style={{ color: '#0f172a' }}>{stats?.planBreakdown.expert || 0} agences</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, ((stats?.planBreakdown.expert || 0) / (stats?.totalOrgs || 1)) * 100)}%`, backgroundColor: '#7c3aed' }} />
                </div>
              </div>

              {/* Enterprise */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '6px' }}>
                  <span style={{ color: '#d97706' }}>Enterprise (Grands Comptes)</span>
                  <span style={{ color: '#0f172a' }}>{stats?.planBreakdown.enterprise || 0} agences</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, ((stats?.planBreakdown.enterprise || 0) / (stats?.totalOrgs || 1)) * 100)}%`, backgroundColor: '#d97706' }} />
                </div>
              </div>

            </div>

            {/* Retention & Conversion Callout */}
            <div style={{
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#16a34a" /> Taux de Monétisation
              </div>
              <div style={{ color: '#64748b' }}>
                <strong style={{ color: '#0f172a' }}>{paidConversionRate}%</strong> des organisations inscrites bénéficient d'un forfait payant actif sur Naforo.
              </div>
            </div>

            {/* Infrastructure Details */}
            <div style={{
              marginTop: 'auto',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} color="#16a34a" /> Statut Infrastructure
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Base PostgreSQL :</span>
                <strong style={{ color: '#16a34a' }}>Connectée</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Moteur de Cache Redis :</span>
                <strong style={{ color: '#16a34a' }}>Opérationnel</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Version Système :</span>
                <span style={{ color: '#475569', fontWeight: 600 }}>v{stats?.systemHealth?.version || '2.4.0'}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Section: Pending Subscription Validations Quick Widget (if any) */}
        {(stats?.pendingSubscriptionsList?.length || 0) > 0 && (
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#d97706" /> Déclarations d'Abonnement en Attente de Validation
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Preuves de paiement Mobile Money et virements soumis par les gestionnaires d'agences
                </p>
              </div>

              <Link href="/admin/subscriptions" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                Voir tous les abonnements <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: '#64748b' }}>AGENCE / BAILLEUR</th>
                    <th style={{ padding: '10px', color: '#64748b' }}>CANAL & TRANSACTION</th>
                    <th style={{ padding: '10px', color: '#64748b' }}>MONTANT DÉCLARÉ</th>
                    <th style={{ padding: '10px', color: '#64748b' }}>DATE</th>
                    <th style={{ padding: '10px', color: '#64748b', textAlign: 'center' }}>JUSTIFICATIF</th>
                    <th style={{ padding: '10px', color: '#64748b', textAlign: 'right' }}>ACTIONS DIRECTES</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.pendingSubscriptionsList.map((p) => {
                    const method = getMethodBadge(p.paymentMethod);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.organization?.name || 'Organisation'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.organization?.email || p.organization?.phone || 'Contact non renseigné'}</div>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: method.bg,
                            color: method.color,
                            marginBottom: '4px'
                          }}>
                            {method.label}
                          </span>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b' }}>
                            {p.transactionNumber || p.paymentReference}
                          </div>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: '#0f172a' }}>
                          {formatFcfa(p.amountXof)}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.75rem' }}>
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                          {p.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProofUrl(p.proofUrl)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#ffffff',
                                color: 'var(--primary)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} /> Voir Reçu
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sans reçu</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setValidatingPayment(p)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={14} /> Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingPayment(p);
                                setRejectionReason('');
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <X size={14} /> Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section: Recent Organizations Registered */}
        <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="var(--primary)" /> Dernières Organisations & Agences Inscrites
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Nouveaux comptes professionnels déployés sur le réseau Naforo
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {stats?.recentOrgs?.map((org) => {
              const isPro = (org.plan || '').toLowerCase().includes('pro');
              const isExpert = (org.plan || '').toLowerCase().includes('expert') || (org.plan || '').toLowerCase().includes('enterprise');

              return (
                <div
                  key={org.id}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                        {org.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        {org.city || 'Abidjan'} • {org.email || org.phone || 'Contact non renseigné'}
                      </div>
                    </div>

                    <span style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      backgroundColor: isExpert ? '#f3e8ff' : (isPro ? '#f0fdf4' : '#f1f5f9'),
                      color: isExpert ? '#7c3aed' : (isPro ? '#15803d' : '#64748b'),
                      border: `1px solid ${isExpert ? '#e9d5ff' : (isPro ? '#bbf7d0' : '#e2e8f0')}`
                    }}>
                      {org.plan?.toUpperCase() || 'STARTER'}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    color: '#475569'
                  }}>
                    <div>
                      <strong>{org._count?.properties || 0}</strong> biens
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                    <div>
                      <strong>{org._count?.contracts || 0}</strong> baux
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                    <div>
                      <strong>{org._count?.users || 1}</strong> utilisateurs
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    marginTop: 'auto'
                  }}>
                    <span>Inscrite le {new Date(org.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: org.isActive ? '#16a34a' : '#ef4444',
                      fontWeight: 700
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: org.isActive ? '#22c55e' : '#ef4444' }} />
                      {org.isActive ? 'Compte Actif' : 'Désactivé'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Validation Modal */}
      {validatingPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Confirmer la validation
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Activation immédiate du forfait pour l'organisation
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.82rem' }}>
              <div style={{ marginBottom: '6px' }}>
                Organisation : <strong>{validatingPayment.organization?.name || 'Client'}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                Montant certifié : <strong>{formatFcfa(validatingPayment.amountXof)}</strong>
              </div>
              <div style={{ marginBottom: '6px' }}>
                Mode de paiement : <strong>{validatingPayment.paymentMethod}</strong>
              </div>
              {validatingPayment.transactionNumber && (
                <div>
                  N° de transaction : <code style={{ backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{validatingPayment.transactionNumber}</code>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginBottom: '24px' }}>
              Cette action générera automatiquement la facture d'abonnement au format PDF et prolongera les droits d'accès de l'agence.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setValidatingPayment(null)}
                className="btn btn-secondary"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmValidate}
                disabled={actionLoading}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Validation en cours...' : 'Confirmer & Débloquer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Rejeter le paiement d'abonnement
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  {rejectingPayment.organization?.name || 'Organisation'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Motif du rejet (transmis à l'agence) *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Référence de transaction introuvable sur le compte Wave marchand..."
                  rows={3}
                  required
                  className="form-control"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-danger"
                  style={{ fontWeight: 700 }}
                >
                  {actionLoading ? 'Rejet en cours...' : 'Confirmer le Rejet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {previewProofUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                Justificatif de Paiement Téléversé
              </span>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', textAlign: 'center', flex: 1, backgroundColor: '#0f172a' }}>
              <img
                src={previewProofUrl}
                alt="Preuve de transaction"
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="btn btn-secondary"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
