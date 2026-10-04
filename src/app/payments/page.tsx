'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import {
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Plus,
  X,
  Check,
  Eye,
  Download,
  Image as ImageIcon,
  RotateCcw,
  Building,
  User,
  FileText,
  HelpCircle,
  Smartphone,
  Landmark,
  Banknote,
  Send,
  Calendar,
  Phone
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'ALL' | 'pending' | 'validated' | 'complement_requested' | 'rejected'>('ALL');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal 1: Create Manual / Offline Payment
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContractId, setNewContractId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState('wave');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTxnNumber, setNewTxnNumber] = useState('');
  const [newComment, setNewComment] = useState('');
  const [autoValidate, setAutoValidate] = useState(true);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  // Modal 2: Validation
  const [validatingPayment, setValidatingPayment] = useState<any | null>(null);

  // Modal 3: Complement Requested
  const [complementPayment, setComplementPayment] = useState<any | null>(null);
  const [complementMessage, setComplementMessage] = useState('');
  const [complementError, setComplementError] = useState('');

  // Modal 4: Rejection
  const [rejectingPayment, setRejectingPayment] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Modal 5: Proof Preview
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Modal 6: Payment Details
  const [detailPayment, setDetailPayment] = useState<any | null>(null);

  const formatFcfa = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let queryUrl = `/payments?page=${page}&limit=${pageSize}`;
      if (activeTab !== 'ALL') queryUrl += `&status=${activeTab}`;
      if (methodFilter !== 'ALL') queryUrl += `&paymentMethod=${methodFilter}`;
      if (propertyFilter !== 'ALL') queryUrl += `&propertyId=${propertyFilter}`;
      if (startDate) queryUrl += `&startDate=${startDate}`;
      if (endDate) queryUrl += `&endDate=${endDate}`;
      if (search.trim()) queryUrl += `&search=${encodeURIComponent(search.trim())}`;

      const [paymentsRes, statsRes, contractsRes, propertiesRes] = await Promise.all([
        api.get(queryUrl).catch(() => ({ data: [], meta: { total: 0, totalPages: 1 } })),
        api.get('/payments/stats').catch(() => null),
        api.get('/contracts?status=active&limit=100').catch(() => ({ data: [] })),
        api.get('/properties?limit=100').catch(() => ({ data: [] })),
      ]);

      const items = Array.isArray(paymentsRes) ? paymentsRes : paymentsRes.data || paymentsRes.items || [];
      setPayments(items);
      if (paymentsRes.meta) {
        setTotalPages(paymentsRes.meta.totalPages || 1);
        setTotalItems(paymentsRes.meta.total || items.length);
      } else {
        setTotalPages(1);
        setTotalItems(items.length);
      }

      setStats(statsRes);

      const cList = Array.isArray(contractsRes) ? contractsRes : contractsRes.data || contractsRes.items || [];
      setContracts(cList);

      const pList = Array.isArray(propertiesRes) ? propertiesRes : propertiesRes.data || propertiesRes.items || [];
      setProperties(pList);
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des règlements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, activeTab, methodFilter, propertyFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
    setMethodFilter('ALL');
    setPropertyFilter('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = search || activeTab !== 'ALL' || methodFilter !== 'ALL' || propertyFilter !== 'ALL' || startDate || endDate;

  // Action 1: Create Manual Payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFieldErrors({});

    const errors: Record<string, string> = {};
    if (!newContractId) errors.contractId = 'Veuillez sélectionner un contrat de bail.';
    if (!newAmount || Number(newAmount) <= 0) errors.amount = 'Le montant doit être supérieur à 0.';

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      handleFormError(new ApiError(errors.contractId || errors.amount, 400));
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/payments', {
        contractId: newContractId,
        amount: Number(newAmount),
        paymentMethod: newMethod,
        paymentDate: new Date(newPaymentDate).toISOString(),
        transactionNumber: newTxnNumber.trim() || undefined,
        comment: newComment.trim() || undefined,
        autoValidate,
      });

      showFormSuccess(autoValidate
        ? 'Règlement enregistré et validé avec succès ! Quittance émise.'
        : 'Paiement déclaré avec succès en attente de vérification.');

      setShowCreateModal(false);
      setNewContractId('');
      setNewAmount('');
      setNewTxnNumber('');
      setNewComment('');
      loadData();
    } catch (err) {
      const res = handleFormError(err, 'Erreur lors de l’enregistrement du règlement.');
      if (res.fieldErrors) setCreateFieldErrors(res.fieldErrors);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: Validate Payment
  const handleConfirmValidation = async () => {
    if (!validatingPayment) return;
    setActionLoading(true);

    try {
      await api.put(`/payments/${validatingPayment.id}/validate`, {
        status: 'validated',
      });
      showFormSuccess('Paiement validé avec succès ! La quittance certifiée a été générée et transmise au locataire.');
      setValidatingPayment(null);
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de la validation du paiement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: Request Complement
  const handleRequestComplement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complementPayment) return;

    if (!complementMessage.trim()) {
      setComplementError('Veuillez préciser le complément d’information attendu.');
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/payments/${complementPayment.id}/validate`, {
        status: 'complement_requested',
        complementMessage: complementMessage.trim(),
      });
      showFormSuccess('Demande de complément transmise au locataire par email et SMS.');
      setComplementPayment(null);
      setComplementMessage('');
      setComplementError('');
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’envoi de la demande de complément.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action 4: Reject Payment
  const handleRejectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    if (!rejectionReason.trim()) {
      setRejectionError('Veuillez renseigner un motif de rejet.');
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/payments/${rejectingPayment.id}/validate`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      showFormSuccess('La déclaration de versement a été rejetée. Le locataire a été notifié.');
      setRejectingPayment(null);
      setRejectionReason('');
      setRejectionError('');
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors du rejet du paiement.');
    } finally {
      setActionLoading(false);
    }
  };

  // Badges & Labels
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Validé
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', fontWeight: 600 }}>
            <Clock size={13} /> En attente
          </span>
        );
      case 'complement_requested':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <HelpCircle size={13} /> Complément requis
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', fontWeight: 600 }}>
            <X size={13} /> Rejeté
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'wave':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Smartphone size={12} /> Wave CI
          </span>
        );
      case 'orange_money':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fff7ed', color: '#c2410c' }}>
            <Smartphone size={12} /> Orange Money
          </span>
        );
      case 'mtn_money':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fefce8', color: '#a16207' }}>
            <Smartphone size={12} /> MTN MoMo
          </span>
        );
      case 'moov_money':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#ecfeff', color: '#0e7490' }}>
            <Smartphone size={12} /> Moov Money
          </span>
        );
      case 'bank_transfer':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f5f3ff', color: '#6d28d9' }}>
            <Landmark size={12} /> Virement bancaire
          </span>
        );
      case 'cash':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f0fdf4', color: '#15803d' }}>
            <Banknote size={12} /> Espèces
          </span>
        );
      case 'card':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }}>
            <CreditCard size={12} /> Carte bancaire
          </span>
        );
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. Page Header SaaS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(1, 62, 55, 0.08)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                Paiements & Encaissements
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Journal des règlements reçus, vérification des justificatifs et émission des quittances
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowCreateModal(true);
              setCreateFieldErrors({});
            }}
            className="btn btn-primary"
            style={{ gap: '8px' }}
          >
            <Plus size={16} />
            Enregistrer un versement
          </button>
        </div>

        {/* 2. KPI Cards (Sans bordure gauche colorée) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Total Encaissé Validé */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Encaissé
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
              {formatFcfa(stats?.validatedAmount || 0)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {stats?.validated || 0} versement(s) validé(s)
            </span>
          </div>

          {/* Card 2: En attente de validation */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                À Valider / En Attente
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b45309' }}>
              {formatFcfa(stats?.pendingAmount || 0)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {stats?.pending || 0} déclaration(s) à traiter
            </span>
          </div>

          {/* Card 3: Compléments Requis */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Compléments Requis
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d4ed8' }}>
              {stats?.complementRequested || 0}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              En attente de justificatif du locataire
            </span>
          </div>

          {/* Card 4: Règlements Rejetés */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Déclarations Rejetées
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>
              {stats?.rejected || 0}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Non conformes ou non reçus
            </span>
          </div>
        </div>

        {/* 3. Status Tabs Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: 'Tous les versements', count: stats?.total },
            { id: 'pending', label: 'En attente', count: stats?.pending, alert: (stats?.pending || 0) > 0 },
            { id: 'validated', label: 'Validés & Encaissés', count: stats?.validated },
            { id: 'complement_requested', label: 'Compléments demandés', count: stats?.complementRequested },
            { id: 'rejected', label: 'Rejetés', count: stats?.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setPage(1); }}
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: activeTab === tab.id ? 'rgba(1, 62, 55, 0.06)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.725rem',
                  fontWeight: 600,
                  backgroundColor: tab.alert ? '#fef3c7' : activeTab === tab.id ? 'var(--primary)' : '#e2e8f0',
                  color: tab.alert ? '#b45309' : activeTab === tab.id ? '#ffffff' : '#475569'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 4. Filters Bar */}
        <div className="card" style={{ padding: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px', gridColumn: 'span 2' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Réf, transaction, locataire ou bien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Payment Method */}
            <div>
              <select
                className="form-control"
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les moyens</option>
                <option value="wave">Wave CI</option>
                <option value="orange_money">Orange Money</option>
                <option value="mtn_money">MTN MoMo</option>
                <option value="moov_money">Moov Money</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
                <option value="card">Carte bancaire</option>
              </select>
            </div>

            {/* Property */}
            <div>
              <select
                className="form-control"
                value={propertyFilter}
                onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les biens</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city || 'Abidjan'})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                className="form-control"
                title="Date de début"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                className="form-control"
                title="Date de fin"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              />
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-secondary"
                  style={{ width: '100%', gap: '6px', fontSize: '0.8125rem' }}
                >
                  <RotateCcw size={14} /> Réinitialiser
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 5. Payments Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RÉFÉRENCE & DATE</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOCATAIRE & BIEN</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MONTANT & MÉTHODE</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>JUSTIFICATIF & REÇU</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>STATUT</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Chargement des versements...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Aucun versement ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const receipt = p.receipts && p.receipts[0];

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* RÉFÉRENCE & DATE */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <button
                            onClick={() => setDetailPayment(p)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              fontWeight: 700,
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontFamily: 'inherit'
                            }}
                          >
                            {p.paymentReference}
                          </button>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(p.paymentDate).toLocaleDateString('fr-FR')}
                          </span>
                          {p.transactionNumber && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              Tx: {p.transactionNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* LOCATAIRE & BIEN */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.875rem' }}>
                            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{p.tenantProfile?.firstName} {p.tenantProfile?.lastName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Building size={12} />
                            <span>{p.contract?.property?.name || 'Bien non renseigné'} ({p.contract?.property?.city || 'Abidjan'})</span>
                          </div>
                        </div>
                      </td>

                      {/* MONTANT & MÉTHODE */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text)' }}>
                            {formatFcfa(Number(p.amount))}
                          </span>
                          <div>{getMethodBadge(p.paymentMethod)}</div>
                        </div>
                      </td>

                      {/* JUSTIFICATIF & REÇU */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {p.proofUrl ? (
                            <button
                              onClick={() => setPreviewProofUrl(`http://localhost:3000${p.proofUrl}`)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                              title="Afficher le reçu ou la capture"
                            >
                              <ImageIcon size={13} />
                              Voir preuve
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sans justificatif</span>
                          )}

                          {receipt && receipt.pdfUrl && (
                            <a
                              href={`http://localhost:3000${receipt.pdfUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px', color: 'var(--primary)' }}
                              title="Télécharger la quittance officielle certifiée"
                            >
                              <FileText size={13} />
                              Quittance {receipt.receiptNumber.slice(-6)}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* STATUT */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div>{getStatusBadge(p.status)}</div>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* En attente : Valider / Complément / Rejeter */}
                          {(p.status === 'pending' || p.status === 'complement_requested') && (
                            <>
                              <button
                                onClick={() => setValidatingPayment(p)}
                                className="btn btn-primary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                                title="Valider le paiement et émettre la quittance"
                                disabled={actionLoading}
                              >
                                <Check size={13} />
                                Valider
                              </button>

                              <button
                                onClick={() => {
                                  setComplementPayment(p);
                                  setComplementMessage('');
                                  setComplementError('');
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', color: '#1d4ed8' }}
                                title="Demander un justificatif plus lisible ou complémentaire"
                                disabled={actionLoading}
                              >
                                <HelpCircle size={13} />
                              </button>

                              <button
                                onClick={() => {
                                  setRejectingPayment(p);
                                  setRejectionReason('');
                                  setRejectionError('');
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', color: '#dc2626' }}
                                title="Rejeter ce versement non conforme"
                                disabled={actionLoading}
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}

                          {/* Détails */}
                          <button
                            onClick={() => setDetailPayment(p)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                            title="Consulter les détails du versement"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>

      </div>

      {/* MODAL 1: ENREGISTRER UN ENCAISSEMENT DIRECT */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Enregistrer un Encaissement</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saisie d'un règlement direct en agence ou hors-ligne</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Contrat de bail */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CONTRAT DE BAIL CONCERNÉ *</label>
                <select
                  className={`form-control ${createFieldErrors.contractId ? 'is-invalid' : ''}`}
                  value={newContractId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewContractId(cid);
                    const selected = contracts.find((c) => c.id === cid);
                    if (selected) {
                      setNewAmount(String(Number(selected.rentAmount || 0) + Number(selected.chargesAmount || 0)));
                    }
                  }}
                  required
                >
                  <option value="">-- Sélectionner un bail actif --</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.property?.name} · {c.tenantProfile?.firstName} {c.tenantProfile?.lastName} ({formatFcfa(Number(c.rentAmount))})
                    </option>
                  ))}
                </select>
                {createFieldErrors.contractId && <div className="form-error">{createFieldErrors.contractId}</div>}
              </div>

              {/* Montant & Moyen */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">MONTANT ENCAISSÉ (FCFA) *</label>
                  <input
                    type="number"
                    className={`form-control ${createFieldErrors.amount ? 'is-invalid' : ''}`}
                    placeholder="Ex: 200000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                  {createFieldErrors.amount && <div className="form-error">{createFieldErrors.amount}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">MODE DE RÈGLEMENT *</label>
                  <select
                    className="form-control"
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value)}
                  >
                    <option value="wave">Wave CI</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_money">MTN MoMo</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="cash">Espèces</option>
                    <option value="card">Carte bancaire</option>
                  </select>
                </div>
              </div>

              {/* Date & N° transaction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">DATE DU RÈGLEMENT *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">N° TRANSACTION / BORDEREAU</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: WVE-77821"
                    value={newTxnNumber}
                    onChange={(e) => setNewTxnNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Commentaire */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">OBSERVATIONS (OPTIONNEL)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Paiement en espèces reçu en agence, reçu n°..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              {/* Auto-validation */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  checked={autoValidate}
                  onChange={(e) => setAutoValidate(e.target.checked)}
                />
                <span><strong>Valider immédiatement</strong> et émettre la quittance certifiée PDF pour ce versement</span>
              </label>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {actionLoading ? 'Enregistrement...' : 'Enregistrer le versement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMATION VALIDATION */}
      {validatingPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Valider le Règlement</h3>
              </div>
              <button
                onClick={() => setValidatingPayment(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
              Confirmez-vous la bonne réception du versement de <strong>{formatFcfa(Number(validatingPayment.amount))}</strong> réglé via <strong>{validatingPayment.paymentMethod.toUpperCase()}</strong> par <strong>{validatingPayment.tenantProfile?.firstName} {validatingPayment.tenantProfile?.lastName}</strong> ?
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem', marginBottom: '20px' }}>
              <div>Réf : <strong>{validatingPayment.paymentReference}</strong></div>
              <div>Transaction : <strong>{validatingPayment.transactionNumber || 'N/A'}</strong></div>
              <div>Date : <strong>{new Date(validatingPayment.paymentDate).toLocaleDateString('fr-FR')}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                onClick={handleConfirmValidation}
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Validation...' : 'Valider et émettre la quittance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DEMANDE DE COMPLÉMENT */}
      {complementPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#1d4ed8' }}>
                  Demande de Complément
                </h3>
              </div>
              <button
                onClick={() => setComplementPayment(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '14px' }}>
              Le locataire recevra une notification par email et SMS l'invitant à renvoyer un justificatif conforme.
            </p>

            <form onSubmit={handleRequestComplement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MESSAGE AU LOCATAIRE *</label>
                <textarea
                  className={`form-control ${complementError ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="Ex: La capture d'écran est tronquée. Merci de renvoyer le reçu SMS officiel de l'opérateur avec le code de transaction lisible."
                  value={complementMessage}
                  onChange={(e) => {
                    setComplementMessage(e.target.value);
                    if (complementError) setComplementError('');
                  }}
                  required
                />
                {complementError && <div className="form-error">{complementError}</div>}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setComplementPayment(null)}
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
                  {actionLoading ? 'Envoi...' : 'Envoyer la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REJET DE PAIEMENT */}
      {rejectingPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#dc2626' }}>
                  Rejeter la Déclaration
                </h3>
              </div>
              <button
                onClick={() => setRejectingPayment(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '14px' }}>
              Êtes-vous sûr de vouloir rejeter le versement de <strong>{formatFcfa(Number(rejectingPayment.amount))}</strong> ?
            </p>

            <form onSubmit={handleRejectPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MOTIF DU REJET *</label>
                <input
                  type="text"
                  className={`form-control ${rejectionError ? 'is-invalid' : ''}`}
                  placeholder="Ex: Transaction introuvable sur le relevé, faux justificatif..."
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  required
                />
                {rejectionError && <div className="form-error">{rejectionError}</div>}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
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
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Traitement...' : 'Confirmer le rejet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PRÉVISUALISATION DU JUSTIFICATIF (PROOF VIEWER) */}
      {previewProofUrl && (
        <div
          onClick={() => setPreviewProofUrl(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Justificatif de Paiement</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={previewProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <Download size={13} /> Ouvrir original
                </a>
                <button
                  onClick={() => setPreviewProofUrl(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', backgroundColor: '#f8fafc' }}>
              {previewProofUrl.endsWith('.pdf') ? (
                <iframe src={previewProofUrl} style={{ width: '100%', height: '500px', border: 'none' }} />
              ) : (
                <img
                  src={previewProofUrl}
                  alt="Justificatif de paiement"
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DÉTAIL COMPLET D'UN PAIEMENT */}
      {detailPayment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Fiche Règlement {detailPayment.paymentReference}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horodatage et traçabilité de l'encaissement</span>
                </div>
              </div>
              <button
                onClick={() => setDetailPayment(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Statut :</span>
                <span>{getStatusBadge(detailPayment.status)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Montant :</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{formatFcfa(Number(detailPayment.amount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Moyen de paiement :</span>
                <span>{getMethodBadge(detailPayment.paymentMethod)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>N° de transaction :</span>
                <span style={{ fontWeight: 600 }}>{detailPayment.transactionNumber || 'Non renseigné'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Locataire :</span>
                <span style={{ fontWeight: 600 }}>{detailPayment.tenantProfile?.firstName} {detailPayment.tenantProfile?.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bien loué :</span>
                <span>{detailPayment.contract?.property?.name || 'Logement'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date de versement :</span>
                <span>{new Date(detailPayment.paymentDate).toLocaleDateString('fr-FR')}</span>
              </div>

              {detailPayment.comment && (
                <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Observation : </span>
                  <span>{detailPayment.comment}</span>
                </div>
              )}

              {detailPayment.rejectionReason && (
                <div style={{ backgroundColor: 'var(--danger-light)', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid #fecaca', fontSize: '0.8125rem', color: 'var(--danger)' }}>
                  <strong>Motif du rejet : </strong> {detailPayment.rejectionReason}
                </div>
              )}

              {detailPayment.complementMessage && (
                <div style={{ backgroundColor: '#eff6ff', padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid #bfdbfe', fontSize: '0.8125rem', color: '#1d4ed8' }}>
                  <strong>Demande de complément : </strong> {detailPayment.complementMessage}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setDetailPayment(null)}
                className="btn btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
