'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Download,
  Mail,
  Building,
  User,
  Plus,
  Zap,
  X,
  Eye,
  Ban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Calendar,
  Phone,
  FileText
} from 'lucide-react';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal: Create Manual Invoice
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractId, setContractId] = useState('');
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [dueDate, setDueDate] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [chargesAmount, setChargesAmount] = useState('0');
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});

  // Modal: Cancel Invoice
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFieldError, setCancelFieldError] = useState('');

  const clearCreateFieldError = (field: string) => {
    if (createFieldErrors[field]) {
      setCreateFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let queryUrl = `/invoices?page=${page}&limit=${pageSize}`;
      if (statusFilter && statusFilter !== 'ALL') queryUrl += `&status=${statusFilter}`;
      if (propertyFilter && propertyFilter !== 'ALL') queryUrl += `&propertyId=${propertyFilter}`;
      if (monthFilter && monthFilter !== 'ALL') queryUrl += `&month=${monthFilter}`;
      if (yearFilter && yearFilter !== 'ALL') queryUrl += `&year=${yearFilter}`;
      if (search.trim()) queryUrl += `&search=${encodeURIComponent(search.trim())}`;

      const [invoicesRes, statsRes, contractsRes, propertiesRes] = await Promise.all([
        api.get(queryUrl).catch(() => ({ data: [], meta: { total: 0, totalPages: 1 } })),
        api.get('/invoices/stats').catch(() => null),
        api.get('/contracts?status=active&limit=100').catch(() => ({ data: [] })),
        api.get('/properties?limit=100').catch(() => ({ data: [] })),
      ]);

      const invList = Array.isArray(invoicesRes) ? invoicesRes : invoicesRes.data || invoicesRes.items || [];
      setInvoices(invList);
      if (invoicesRes.meta) {
        setTotalPages(invoicesRes.meta.totalPages || 1);
        setTotalItems(invoicesRes.meta.total || invList.length);
      } else {
        setTotalPages(1);
        setTotalItems(invList.length);
      }

      setStats(statsRes);

      const contractList = Array.isArray(contractsRes) ? contractsRes : contractsRes.data || contractsRes.items || [];
      setContracts(contractList);

      const propList = Array.isArray(propertiesRes) ? propertiesRes : propertiesRes.data || propertiesRes.items || [];
      setProperties(propList);
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des factures de loyer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, propertyFilter, monthFilter, yearFilter]);

  // Handle Search Debounce or trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPropertyFilter('ALL');
    setMonthFilter('ALL');
    setYearFilter('ALL');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'ALL' || propertyFilter !== 'ALL' || monthFilter !== 'ALL' || yearFilter !== 'ALL';

  const formatFcfa = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
  };

  // Generate Monthly Invoices
  const handleGenerateMonthly = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/invoices/generate-monthly', {});
      const count = res.generatedCount || 0;
      const skipped = res.skippedCount || 0;
      showFormSuccess(`${count} facture(s) générée(s) avec succès pour le mois en cours (${skipped} contrats ignorés car déjà facturés ou hors période).`);
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de la génération automatique des factures.');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Manual Invoice
  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFieldErrors({});

    const errors: Record<string, string> = {};
    if (!contractId) errors.contractId = 'Veuillez sélectionner un contrat de bail actif.';
    if (!rentAmount || Number(rentAmount) <= 0) errors.rentAmount = 'Veuillez indiquer un loyer supérieur à 0.';

    if (Object.keys(errors).length > 0) {
      setCreateFieldErrors(errors);
      handleFormError(new ApiError(errors.contractId || errors.rentAmount, 400));
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/invoices', {
        contractId,
        periodMonth: Number(periodMonth),
        periodYear: Number(periodYear),
        rentAmount: Number(rentAmount),
        chargesAmount: Number(chargesAmount || 0),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });

      showFormSuccess('Facture de loyer créée et émise avec succès !');
      setShowCreateModal(false);
      setContractId('');
      setRentAmount('');
      setChargesAmount('0');
      setDueDate('');
      loadData();
    } catch (err) {
      const result = handleFormError(err, 'Erreur lors de la création manuelle de la facture.');
      if (result.fieldErrors) {
        setCreateFieldErrors(result.fieldErrors);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Send Reminder
  const handleSendReminder = async (invoiceId: string) => {
    setActionLoading(true);
    try {
      await api.post(`/invoices/${invoiceId}/send`, {});
      showFormSuccess('Avis d’échéance et relance envoyés avec succès au locataire par email !');
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’envoi de la relance.');
    } finally {
      setActionLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPdf = async (invoice: any) => {
    if (invoice.pdfUrl) {
      window.open(`http://localhost:3000${invoice.pdfUrl}`, '_blank');
    } else {
      try {
        const res = await api.post(`/invoices/${invoice.id}/pdf`, {});
        if (res.pdfUrl) {
          window.open(`http://localhost:3000${res.pdfUrl}`, '_blank');
          loadData();
        }
      } catch (err) {
        handleFormError(err, 'Erreur lors de la génération du document PDF.');
      }
    }
  };

  // Cancel Invoice
  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelFieldError('Veuillez préciser le motif de l’annulation.');
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/invoices/${invoiceToCancel.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      showFormSuccess('La facture a été annulée avec succès.');
      setShowCancelModal(false);
      setInvoiceToCancel(null);
      setCancelReason('');
      setCancelFieldError('');
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’annulation de la facture.');
    } finally {
      setActionLoading(false);
    }
  };

  // Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Soldée
          </span>
        );
      case 'partial':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <Clock size={13} /> Partielle
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontWeight: 600 }}>
            <Clock size={13} /> En attente
          </span>
        );
      case 'overdue':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontWeight: 600 }}>
            <AlertCircle size={13} /> En retard
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#64748b' }}>
            <Ban size={13} /> Annulée
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. Header SaaS */}
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
              <Receipt size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                Factures de Loyer
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Facturation automatisée, suivi des échéances, encaissements et recouvrement des loyers
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateMonthly}
              className="btn btn-secondary"
              style={{ gap: '8px', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600 }}
              disabled={actionLoading}
              title="Générer les factures de loyer de tous les contrats actifs pour le mois en cours"
            >
              <Zap size={16} />
              Générer factures du mois
            </button>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateFieldErrors({});
              }}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <Plus size={16} />
              Émettre une facture
            </button>
          </div>
        </div>

        {/* 2. KPI Cards (Sans bordure gauche colorée) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Total Facturé */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Émis & Facturé
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                {formatFcfa(stats?.totalBilled || 0)}
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {stats?.total || 0} facture(s) émises au total
            </span>
          </div>

          {/* Card 2: Total Encaissé */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Encaissé
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                {formatFcfa(stats?.totalCollected || 0)}
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {stats?.paid || 0} facture(s) entièrement soldées
            </span>
          </div>

          {/* Card 3: Taux de Recouvrement */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Taux de Recouvrement
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                {stats?.recoveryRate !== undefined ? `${stats.recoveryRate}%` : '100%'}
              </span>
            </div>
            {/* Visual Gauge */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, stats?.recoveryRate || 100))}%`,
                  height: '100%',
                  backgroundColor: (stats?.recoveryRate || 100) >= 80 ? 'var(--success)' : (stats?.recoveryRate || 100) >= 50 ? 'var(--warning)' : 'var(--danger)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Card 4: Reste à Recouvrer / Impayés */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Reste à Recouvrer
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>
                {formatFcfa(stats?.totalDue || 0)}
              </span>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {stats?.overdue || 0} en retard · {stats?.pending || 0} en attente
            </span>
          </div>
        </div>

        {/* 3. Filter Bar */}
        <div className="card" style={{ padding: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', minWidth: '220px', gridColumn: 'span 2' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="N° facture, locataire ou bien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Status */}
            <div>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="paid">Payées / Soldées</option>
                <option value="partial">Partiellement payées</option>
                <option value="pending">En attente</option>
                <option value="overdue">En retard</option>
                <option value="cancelled">Annulées</option>
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

            {/* Month */}
            <div>
              <select
                className="form-control"
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les mois</option>
                {MONTH_NAMES.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <select
                className="form-control"
                value={yearFilter}
                onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Toutes les années</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
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

        {/* 4. High-Density Invoices Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>FACTURE & PÉRIODE</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>BIEN IMMOBILIER</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOCATAIRE</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MONTANT & SOLDE</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ÉCHÉANCE & STATUT</th>
                <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Chargement des factures de loyer...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Aucune facture ne correspond aux filtres appliqués.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const paidAmount = Number(inv.paidAmount || 0);
                  const totalAmount = Number(inv.totalAmount || 0);
                  const remaining = Math.max(0, totalAmount - paidAmount);
                  const periodText = `${MONTH_NAMES[inv.periodMonth - 1] || 'Mois ' + inv.periodMonth} ${inv.periodYear}`;

                  return (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* FACTURE & PÉRIODE */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Link
                            href={`/invoices/${inv.id}`}
                            style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem' }}
                            className="hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              {periodText}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* BIEN IMMOBILIER */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.875rem' }}>
                            <Building size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{inv.property?.name || 'Bien non renseigné'}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {inv.property?.city || 'Abidjan'} · {inv.property?.type || 'Logement'}
                          </span>
                        </div>
                      </td>

                      {/* LOCATAIRE */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '0.875rem' }}>
                            <User size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span>{inv.tenantProfile?.firstName} {inv.tenantProfile?.lastName}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {inv.tenantProfile?.phone || inv.tenantProfile?.email || 'Contact non renseigné'}
                          </span>
                        </div>
                      </td>

                      {/* MONTANT & SOLDE */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>
                            {formatFcfa(totalAmount)}
                          </span>
                          
                          {/* Payment status progress / breakdown */}
                          {inv.status === 'paid' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                              Soldé 100% ({formatFcfa(paidAmount)})
                            </span>
                          ) : inv.status === 'partial' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '120px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <span>Payé: {formatFcfa(paidAmount)}</span>
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>Reste: {formatFcfa(remaining)}</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, (paidAmount / totalAmount) * 100)}%`,
                                    height: '100%',
                                    backgroundColor: '#2563eb'
                                  }}
                                />
                              </div>
                            </div>
                          ) : inv.status === 'cancelled' ? (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Annulée</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: inv.status === 'overdue' ? '#dc2626' : 'var(--text-muted)', fontWeight: inv.status === 'overdue' ? 600 : 400 }}>
                              Reste dû: {formatFcfa(totalAmount)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ÉCHÉANCE & STATUT */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div>{getStatusBadge(inv.status)}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            Échéance : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {/* Détails */}
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                            title="Voir la fiche détaillée de la facture"
                          >
                            <Eye size={13} />
                            Détails
                          </Link>

                          {/* PDF */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                            title="Télécharger l'avis d'échéance ou la facture en PDF"
                          >
                            <Download size={13} />
                            PDF
                          </button>

                          {/* Relancer */}
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => handleSendReminder(inv.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                              title="Envoyer une notification de relance au locataire"
                              disabled={actionLoading}
                            >
                              <Mail size={13} />
                              Relancer
                            </button>
                          )}

                          {/* Annuler */}
                          {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setInvoiceToCancel(inv);
                                setCancelReason('');
                                setCancelFieldError('');
                                setShowCancelModal(true);
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', color: '#dc2626' }}
                              title="Annuler cette facture"
                            >
                              <Ban size={13} />
                            </button>
                          )}
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

      {/* MODAL 1: CRÉATION MANUELLE D'UNE FACTURE */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Émettre une Facture de Loyer</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Générez manuellement un appel de loyer pour un contrat</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Contrat de bail */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">CONTRAT DE BAIL & LOCATAIRE *</label>
                <select
                  className={`form-control ${createFieldErrors.contractId ? 'is-invalid' : ''}`}
                  value={contractId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setContractId(cid);
                    clearCreateFieldError('contractId');
                    const selected = contracts.find((c) => c.id === cid);
                    if (selected) {
                      setRentAmount(String(selected.rentAmount || ''));
                      setChargesAmount(String(selected.chargesAmount || 0));
                    }
                  }}
                  required
                >
                  <option value="">-- Sélectionner un contrat actif --</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.property?.name} · {c.tenantProfile?.firstName} {c.tenantProfile?.lastName} ({formatFcfa(Number(c.rentAmount))})
                    </option>
                  ))}
                </select>
                {createFieldErrors.contractId && <div className="form-error">{createFieldErrors.contractId}</div>}
              </div>

              {/* Mois & Année */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">MOIS *</label>
                  <select
                    className="form-control"
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m} ({idx + 1})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ANNÉE *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Loyer Nu & Charges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">LOYER NU (FCFA) *</label>
                  <input
                    type="number"
                    className={`form-control ${createFieldErrors.rentAmount ? 'is-invalid' : ''}`}
                    placeholder="Ex: 200000"
                    value={rentAmount}
                    onChange={(e) => {
                      setRentAmount(e.target.value);
                      clearCreateFieldError('rentAmount');
                    }}
                    required
                  />
                  {createFieldErrors.rentAmount && <div className="form-error">{createFieldErrors.rentAmount}</div>}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">CHARGES (FCFA)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ex: 15000"
                    value={chargesAmount}
                    onChange={(e) => setChargesAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Date d'échéance optionnelle */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DATE LIMITE D’ÉCHÉANCE (OPTIONNELLE)</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Si laissée vide, la date d’échéance sera calculée selon le jour de paiement stipulé au contrat.
                </span>
              </div>

              {/* Total prévisionnel */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '12px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL FACTURÉ :</span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatFcfa(Number(rentAmount || 0) + Number(chargesAmount || 0))}
                </span>
              </div>

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
                  {actionLoading ? 'Émission...' : 'Émettre la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ANNULATION D'UNE FACTURE */}
      {showCancelModal && invoiceToCancel && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ban size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#dc2626' }}>
                  Annuler la Facture
                </h3>
              </div>
              <button
                onClick={() => { setShowCancelModal(false); setInvoiceToCancel(null); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '16px' }}>
              Êtes-vous certain de vouloir annuler la facture <strong>{invoiceToCancel.invoiceNumber}</strong> d'un montant de <strong>{formatFcfa(Number(invoiceToCancel.totalAmount))}</strong> ?
            </p>

            <form onSubmit={handleCancelInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MOTIF DE L'ANNULATION *</label>
                <textarea
                  className={`form-control ${cancelFieldError ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="Ex: Erreur de saisie de charges, résiliation anticipée, régularisation..."
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelFieldError) setCancelFieldError('');
                  }}
                  required
                />
                {cancelFieldError && <div className="form-error">{cancelFieldError}</div>}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setInvoiceToCancel(null); }}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Abandonner
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Annulation...' : 'Confirmer l’annulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
}
