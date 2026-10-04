'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  X, 
  Gem, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  ArrowRight, 
  Eye, 
  FileText, 
  RefreshCw, 
  Copy, 
  Clock, 
  XCircle, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Layers,
  Phone,
  Mail,
  Zap,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Tabs
  const [selectedTab, setSelectedTab] = useState<'pending' | 'validated' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  // Modals state
  const [validatingPayment, setValidatingPayment] = useState<any | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    // Charger tous les paiements pour permettre le basculement instantané d'onglets
    api.get('/subscriptions/payments/pending?status=all')
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
        setPayments(list);
        setLoading(false);
        setRefreshing(false);
      })
      .catch((err) => {
        setError("Impossible de charger les déclarations d'abonnements.");
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs
  const metrics = useMemo(() => {
    const pendingList = payments.filter(p => p.status === 'pending');
    const validatedList = payments.filter(p => p.status === 'validated');
    const rejectedList = payments.filter(p => p.status === 'rejected');

    const pendingTotal = pendingList.reduce((acc, p) => acc + Number(p.amountXof || 0), 0);
    const validatedTotal = validatedList.reduce((acc, p) => acc + Number(p.amountXof || 0), 0);

    const totalProcessed = validatedList.length + rejectedList.length;
    const approvalRate = totalProcessed > 0 ? Math.round((validatedList.length / totalProcessed) * 100) : 100;

    return {
      pendingCount: pendingList.length,
      pendingTotal,
      validatedCount: validatedList.length,
      validatedTotal,
      rejectedCount: rejectedList.length,
      approvalRate,
    };
  }, [payments]);

  // Quick Rejection Motives
  const QUICK_REJECTION_REASONS = [
    "Montant transféré inférieur au montant du forfait sélectionné.",
    "Numéro de transaction Mobile Money introuvable ou non reconnu par l'opérateur.",
    "Preuve de transfert illisible, tronquée ou déjà utilisée.",
    "Nom de l'émetteur ne correspondant pas au compte de l'organisation.",
    "Paiement non reçu sur le compte récepteur Naforo."
  ];

  // Validation
  const confirmValidatePayment = async () => {
    if (!validatingPayment) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/subscriptions/payments/${validatingPayment.id}/validate`, {
        status: 'validated'
      });
      const orgName = validatingPayment.organization?.name || 'Organisation';
      setSuccess(`L'abonnement de "${orgName}" a été validé avec succès ! Quotas activés et facture PDF envoyée.`);
      setValidatingPayment(null);
      loadData(true);
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors de la validation de la souscription.");
    } finally {
      setActionLoading(false);
    }
  };

  // Rejection
  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;
    if (!rejectionReason.trim()) {
      setError("Veuillez renseigner un motif de rejet clair.");
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/subscriptions/payments/${rejectingPayment.id}/validate`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });
      setSuccess(`Le paiement ${rejectingPayment.paymentReference} a été rejeté. Le client a été notifié du motif.`);
      setRejectingPayment(null);
      setRejectionReason('');
      loadData(true);
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors du rejet de l'abonnement.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Tab filter
      if (selectedTab !== 'all' && p.status !== selectedTab) return false;

      // Method filter
      if (selectedMethod !== 'all' && p.paymentMethod !== selectedMethod) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const orgName = (p.organization?.name || '').toLowerCase();
        const ref = (p.paymentReference || '').toLowerCase();
        const txn = (p.transactionNumber || '').toLowerCase();
        const planName = (p.targetPlan?.name || p.subscription?.plan?.name || '').toLowerCase();
        if (!orgName.includes(q) && !ref.includes(q) && !txn.includes(q) && !planName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [payments, selectedTab, selectedMethod, searchQuery]);

  const getMethodBadge = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m === 'wave') {
      return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd', label: 'Wave' };
    }
    if (m === 'orange_money') {
      return { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5', label: 'Orange Money' };
    }
    if (m === 'mtn_money') {
      return { bg: '#fefce8', text: '#ca8a04', border: '#fef08a', label: 'MTN MoMo' };
    }
    if (m === 'moov_money') {
      return { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe', label: 'Moov Money' };
    }
    if (m === 'bank_transfer') {
      return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Virement Bancaire' };
    }
    if (m === 'card') {
      return { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe', label: 'Carte Bancaire' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: method.toUpperCase() };
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
          Chargement des déclarations d'abonnements Naforo...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 800, color: '#15803d', marginBottom: 8 }}>
              <CreditCard size={14} color="#16a34a" /> CONTRÔLE FINANCIER & SOUSCRIPTIONS SAAS
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Validation des Abonnements & Encaissements
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: 4 }}>
              Contrôlez les pièces justificatives, activez les formules d'abonnement payantes et déclenchez la génération des factures avec conformité fiscale.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1.5px solid #cbd5e1',
              borderRadius: 14,
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Actualisation...' : 'Actualiser les règlements'}
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: 16, color: '#991b1b', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 14, padding: 16, color: '#166534', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span>{success}</span>
          </div>
        )}

        {/* EXECUTIVE KPI CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          
          {/* EN ATTENTE */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>EN ATTENTE DE VÉRIFICATION</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                <Clock size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: metrics.pendingCount > 0 ? '#ea580c' : '#0f172a', marginTop: 8 }}>
              {metrics.pendingCount} {metrics.pendingCount > 1 ? 'dossiers' : 'dossier'}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700, marginTop: 4 }}>
              Montant en attente : <strong style={{ color: '#ea580c' }}>{formatFcfa(metrics.pendingTotal)}</strong>
            </div>
          </div>

          {/* TOTAL VALIDÉ & ENCAISSÉ */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>TOTAL ENCAISSÉ VALIDÉ</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#16a34a', marginTop: 8 }}>
              {formatFcfa(metrics.validatedTotal)}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700, marginTop: 4 }}>
              {metrics.validatedCount} souscription{metrics.validatedCount > 1 ? 's' : ''} approuvée{metrics.validatedCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* REJETS */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>DOSSIERS REJETÉS</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <XCircle size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: metrics.rejectedCount > 0 ? '#dc2626' : '#0f172a', marginTop: 8 }}>
              {metrics.rejectedCount} rejet{metrics.rejectedCount > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748b', fontWeight: 700, marginTop: 4 }}>
              Motifs notifiés aux agences
            </div>
          </div>

          {/* TAUX D'APPROBATION */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 22, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>TAUX DE CONFORMITÉ</span>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--primary)', marginTop: 8 }}>
              {metrics.approvalRate}%
            </div>
            <div style={{ fontSize: '0.825rem', color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
              Délai moyen de validation &lt; 2h
            </div>
          </div>

        </div>

        {/* TABS & SEARCH / FILTER TOOLBAR */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            
            {/* STATUS TABS */}
            <div style={{ display: 'flex', gap: 6, backgroundColor: '#f1f5f9', padding: '4px', borderRadius: 14 }}>
              <button
                type="button"
                onClick={() => setSelectedTab('pending')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  backgroundColor: selectedTab === 'pending' ? '#ea580c' : 'transparent',
                  color: selectedTab === 'pending' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedTab === 'pending' ? '0 2px 6px rgba(234, 88, 12, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>À Valider</span>
                <span style={{
                  backgroundColor: selectedTab === 'pending' ? '#ffffff' : '#e2e8f0',
                  color: selectedTab === 'pending' ? '#ea580c' : '#475569',
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontSize: '0.725rem',
                  fontWeight: 900
                }}>
                  {metrics.pendingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab('validated')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  backgroundColor: selectedTab === 'validated' ? '#16a34a' : 'transparent',
                  color: selectedTab === 'validated' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedTab === 'validated' ? '0 2px 6px rgba(22, 163, 74, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Validés & Actifs</span>
                <span style={{
                  backgroundColor: selectedTab === 'validated' ? '#ffffff' : '#e2e8f0',
                  color: selectedTab === 'validated' ? '#16a34a' : '#475569',
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontSize: '0.725rem',
                  fontWeight: 900
                }}>
                  {metrics.validatedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab('rejected')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  backgroundColor: selectedTab === 'rejected' ? '#dc2626' : 'transparent',
                  color: selectedTab === 'rejected' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedTab === 'rejected' ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Rejetés</span>
                <span style={{
                  backgroundColor: selectedTab === 'rejected' ? '#ffffff' : '#e2e8f0',
                  color: selectedTab === 'rejected' ? '#dc2626' : '#475569',
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontSize: '0.725rem',
                  fontWeight: 900
                }}>
                  {metrics.rejectedCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTab('all')}
                style={{
                  padding: '8px 18px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  backgroundColor: selectedTab === 'all' ? 'var(--primary)' : 'transparent',
                  color: selectedTab === 'all' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedTab === 'all' ? '0 2px 6px rgba(1, 62, 55, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Tous les Règlements</span>
                <span style={{
                  backgroundColor: selectedTab === 'all' ? '#ffffff' : '#e2e8f0',
                  color: selectedTab === 'all' ? 'var(--primary)' : '#475569',
                  padding: '2px 7px',
                  borderRadius: 20,
                  fontSize: '0.725rem',
                  fontWeight: 900
                }}>
                  {payments.length}
                </span>
              </button>
            </div>

            {/* PAYMENT METHOD DROPDOWN */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={15} color="#64748b" />
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                style={{
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">Tous les moyens de paiement</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="mtn_money">MTN MoMo</option>
                <option value="moov_money">Moov Money</option>
                <option value="bank_transfer">Virement Bancaire</option>
                <option value="card">Carte Bancaire</option>
              </select>
            </div>

          </div>

          {/* SEARCH BAR */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom d'agence, référence (SUB-...), numéro de transaction opérateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: '#f8fafc',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* PAYMENTS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredPayments.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <CreditCard size={26} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Aucun règlement trouvé
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 420, margin: 0 }}>
                {selectedTab === 'pending'
                  ? 'Toutes les déclarations d\'abonnements ont été traitées. Aucun dossier en attente pour le moment.'
                  : 'Aucun paiement d\'abonnement ne correspond aux critères de filtre sélectionnés.'}
              </p>
            </div>
          ) : (
            filteredPayments.map((p) => {
              const isPending = p.status === 'pending';
              const isValidated = p.status === 'validated';
              const isRejected = p.status === 'rejected';

              const methodBadge = getMethodBadge(p.paymentMethod);
              const targetPlanName = p.targetPlan?.name || (p.subscription?.plan?.name !== 'Starter' ? p.subscription?.plan?.name : 'Pro / Sérénité');
              const currentPlanName = p.subscription?.plan?.name || 'Starter';
              const isYearly = p.billingCycle === 'yearly';

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: isPending ? '1.5px solid #fed7aa' : '1px solid #e2e8f0',
                    borderRadius: 22,
                    padding: 24,
                    boxShadow: isPending ? '0 4px 18px rgba(234, 88, 12, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                    transition: 'all 0.15s ease'
                  }}
                >
                  
                  {/* TOP HEADER ROW */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    
                    {/* AGENCY INFO & REF */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: isPending ? '#fff7ed' : (isValidated ? '#f0fdf4' : '#fef2f2'),
                        border: `1px solid ${isPending ? '#ffedd5' : (isValidated ? '#bbf7d0' : '#fecaca')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isPending ? '#ea580c' : (isValidated ? '#16a34a' : '#dc2626')
                      }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                            {p.organization?.name || 'Agence Inconnue'}
                          </h3>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 20,
                            backgroundColor: isPending ? '#fff7ed' : (isValidated ? '#f0fdf4' : '#fef2f2'),
                            color: isPending ? '#ea580c' : (isValidated ? '#16a34a' : '#dc2626'),
                            border: `1px solid ${isPending ? '#fed7aa' : (isValidated ? '#bbf7d0' : '#fecaca')}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {isPending && <Clock size={12} />}
                            {isValidated && <CheckCircle2 size={12} />}
                            {isRejected && <XCircle size={12} />}
                            {isPending ? 'En attente de validation' : (isValidated ? 'Souscription Validée' : 'Paiement Rejeté')}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.78rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            Réf : <strong style={{ color: '#0f172a' }}>{p.paymentReference}</strong>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.paymentReference, `ref-${p.id}`)}
                              title="Copier la référence"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                            >
                              <Copy size={12} color={copiedId === `ref-${p.id}` ? '#16a34a' : '#94a3b8'} />
                            </button>
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={13} /> Déclaré le {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                          </span>
                          {p.organization?.email && (
                            <>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Mail size={13} /> {p.organization.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AMOUNT */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a' }}>
                        {formatFcfa(Number(p.amountXof))}
                      </div>
                      <span style={{
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        backgroundColor: isYearly ? '#fef3c7' : '#f1f5f9',
                        color: isYearly ? '#92400e' : '#475569',
                        border: isYearly ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {isYearly ? '⭐ Facturation Annuelle (-20%)' : 'Facturation Mensuelle'}
                      </span>
                    </div>

                  </div>

                  {/* DETAILS CARD GRID */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: 14,
                    backgroundColor: '#f8fafc',
                    padding: 16,
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    fontSize: '0.825rem'
                  }}>
                    
                    {/* PLAN TRANSITION */}
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, marginBottom: 4 }}>
                        FORMULE DEMANDÉE
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: '#475569' }}>
                          Actuel: {currentPlanName}
                        </span>
                        <ArrowRight size={14} color="#64748b" />
                        <span style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', padding: '3px 8px', borderRadius: 6, fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Gem size={13} /> {targetPlanName}
                        </span>
                      </div>
                    </div>

                    {/* PAYMENT METHOD & TRANSACTION */}
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, marginBottom: 4 }}>
                        MODE DE RÈGLEMENT & TRANSACTION
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: methodBadge.bg,
                          color: methodBadge.text,
                          border: `1px solid ${methodBadge.border}`,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: '0.75rem'
                        }}>
                          {methodBadge.label}
                        </span>
                        <span style={{ color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          N°: {p.transactionNumber || 'Non renseigné'}
                          {p.transactionNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.transactionNumber, `txn-${p.id}`)}
                              title="Copier le N° de transaction"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <Copy size={12} color={copiedId === `txn-${p.id}` ? '#16a34a' : '#94a3b8'} />
                            </button>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* PROOF OF PAYMENT PREVIEW */}
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, marginBottom: 4 }}>
                        PIÈCE JUSTIFICATIVE DU TRANSFERT
                      </div>
                      {p.proofUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setPreviewProofUrl(`http://localhost:3000/${p.proofUrl}`)}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1.5px solid #cbd5e1',
                              borderRadius: 8,
                              padding: '4px 10px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <Eye size={14} /> Voir le reçu
                          </button>
                          <a
                            href={`http://localhost:3000/${p.proofUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: '#64748b', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            Ouvrir plein écran <ExternalLink size={11} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                          Aucun fichier uploadé
                        </span>
                      )}
                    </div>

                  </div>

                  {/* REJECTION REASON DISPLAY */}
                  {isRejected && p.rejectionReason && (
                    <div style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 12,
                      padding: '12px 16px',
                      color: '#991b1b',
                      fontSize: '0.825rem'
                    }}>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>Motif du rejet communiqué au client :</div>
                      <div>{p.rejectionReason}</div>
                    </div>
                  )}

                  {/* VALIDATION CONFIRMATION / INVOICE DOWNLOAD */}
                  {isValidated && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 12,
                      padding: '10px 16px',
                      fontSize: '0.825rem',
                      color: '#166534',
                      flexWrap: 'wrap',
                      gap: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                        <CheckCheck size={16} color="#16a34a" />
                        <span>Abonnement actif et synchronisé en base de données.</span>
                        {p.validatedAt && (
                          <span style={{ fontSize: '0.75rem', color: '#15803d' }}>
                            (Approuvé le {new Date(p.validatedAt).toLocaleDateString('fr-FR')})
                          </span>
                        )}
                      </div>

                      {p.pdfUrl && (
                        <a
                          href={`http://localhost:3000/${p.pdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#166534',
                            border: '1px solid #86efac',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            textDecoration: 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          <FileText size={14} /> Facture PDF Générée
                        </a>
                      )}
                    </div>
                  )}

                  {/* ACTION BUTTONS (FOR PENDING ONLY) */}
                  {isPending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 6 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingPayment(p);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1.5px solid #fecaca',
                          color: '#dc2626',
                          borderRadius: 12,
                          padding: '10px 18px',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <XCircle size={16} /> Rejeter le règlement
                      </button>

                      <button
                        type="button"
                        onClick={() => setValidatingPayment(p)}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: 'var(--primary)',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: 12,
                          padding: '10px 22px',
                          fontSize: '0.85rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          boxShadow: '0 3px 10px rgba(1, 62, 55, 0.25)'
                        }}
                      >
                        <CheckCircle2 size={16} /> Valider & Déverrouiller le Forfait
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* MODAL 1: VALIDATION CONFIRMATION */}
        {validatingPayment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 580,
              width: '100%',
              padding: 32,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Confirmer l'Activation de l'Abonnement
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Organisation : <strong>{validatingPayment.organization?.name || 'Agence'}</strong>
                  </p>
                </div>
              </div>

              {/* RECAP BOX */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, display: 'block' }}>FORFAIT ACTIVÉ</span>
                    <strong style={{ color: '#166534', fontSize: '1rem' }}>
                      {validatingPayment.targetPlan?.name || validatingPayment.subscription?.plan?.name || 'Pro / Sérénité'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, display: 'block' }}>MONTANT ENCAISSÉ</span>
                    <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                      {formatFcfa(Number(validatingPayment.amountXof))}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, display: 'block' }}>CYCLE & DURÉE</span>
                    <strong style={{ color: '#0f172a' }}>
                      {validatingPayment.billingCycle === 'yearly' ? '365 jours (Annuel)' : '30 jours (Mensuel)'}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.725rem', fontWeight: 800, display: 'block' }}>PÉRIODE DE GRÂCE</span>
                    <strong style={{ color: '#0f172a' }}>+90 jours de rétention</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: 14, paddingTop: 12, fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#16a34a" /> Déblocage immédiat des quotas de biens et fonctionnalités logicielles.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#16a34a" /> Génération automatique de la facture PDFKit avec quittance fiscale.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#16a34a" /> Envoi d'un email de confirmation avec facture PDF à l'agence.
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setValidatingPayment(null)}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmValidatePayment}
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(1, 62, 55, 0.3)'
                  }}
                >
                  {actionLoading ? 'Validation en cours...' : 'Oui, Valider & Activer'}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: REJECTION FORM */}
        {rejectingPayment && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 580,
              width: '100%',
              padding: 32,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <XCircle size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Rejeter la Déclaration d'Abonnement
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Organisation : <strong>{rejectingPayment.organization?.name}</strong> • Réf: {rejectingPayment.paymentReference}
                  </p>
                </div>
              </div>

              <form onSubmit={handleRejectPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* QUICK REASONS PILLS */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 8 }}>
                    MOTIFS RAPIDES (CLIQUEZ POUR INSÉRER) :
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {QUICK_REJECTION_REASONS.map((reason, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRejectionReason(reason)}
                        style={{
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          padding: '6px 10px',
                          borderRadius: 8,
                          backgroundColor: rejectionReason === reason ? '#fee2e2' : '#f8fafc',
                          color: rejectionReason === reason ? '#991b1b' : '#334155',
                          border: rejectionReason === reason ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          fontWeight: rejectionReason === reason ? 700 : 500
                        }}
                      >
                        • {reason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TEXTAREA MOTIF */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                    JUSTIFICATION PRÉCISE DU REJET (NOTIFIÉE AU CLIENT) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Saisissez la raison du refus (ex: numéro de transaction invalide, justificatif illisible...)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                    Le client recevra cette explication par email et dans son espace pour pouvoir régulariser.
                  </span>
                </div>

                {/* BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRejectingPayment(null)}
                    disabled={actionLoading}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !rejectionReason.trim()}
                    style={{
                      padding: '12px 22px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 3px 10px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    {actionLoading ? 'Rejet en cours...' : 'Confirmer le Rejet'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: PROOF LIGHTBOX VIEWER */}
        {previewProofUrl && (
          <div 
            onClick={() => setPreviewProofUrl(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: 24
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 20,
                maxWidth: 800,
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  <Eye size={18} color="var(--primary)" /> Justificatif de Paiement Téléversé
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a
                    href={previewProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Plein écran <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => setPreviewProofUrl(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ padding: 20, overflowY: 'auto', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <img
                  src={previewProofUrl}
                  alt="Preuve de transfert"
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
