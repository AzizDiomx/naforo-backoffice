'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  Download,
  Mail,
  Building,
  User,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  Plus,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal: Record Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wave');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [paymentFieldErrors, setPaymentFieldErrors] = useState<Record<string, string>>({});

  // Modal: Cancel Invoice
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFieldError, setCancelFieldError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      const data = res.data || res;
      setInvoice(data);
      // Pre-fill remaining amount for payment modal
      if (data.remainingAmount !== undefined) {
        setPaymentAmount(String(data.remainingAmount));
      }
    } catch (err) {
      handleFormError(err, 'Impossible de charger la facture demandée.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const formatFcfa = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' FCFA';
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!invoice) return;
    if (invoice.pdfUrl) {
      window.open(`http://localhost:3000${invoice.pdfUrl}`, '_blank');
    } else {
      setActionLoading(true);
      try {
        const res = await api.post(`/invoices/${invoice.id}/pdf`, {});
        if (res.pdfUrl) {
          window.open(`http://localhost:3000${res.pdfUrl}`, '_blank');
          loadData();
        }
      } catch (err) {
        handleFormError(err, 'Erreur lors de la génération du document PDF.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Send Reminder / Notice
  const handleSendReminder = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${invoice.id}/send`, {});
      showFormSuccess('Avis d’échéance et relance envoyés avec succès au locataire par email !');
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’envoi de la relance.');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Offline Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentFieldErrors({});

    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentFieldErrors({ amount: 'Veuillez saisir un montant supérieur à 0.' });
      return;
    }

    setActionLoading(true);
    try {
      // 1. Déclarer le paiement
      const declared = await api.post('/payments', {
        contractId: invoice.contractId,
        invoiceId: invoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        paymentDate: new Date(paymentDate).toISOString(),
        transactionNumber: transactionNumber.trim() || undefined,
        comment: paymentComment.trim() || undefined,
      });

      const paymentRecord = declared.data || declared;

      // 2. Valider automatiquement le paiement (car enregistré par le gestionnaire/bailleur)
      if (paymentRecord?.id) {
        await api.put(`/payments/${paymentRecord.id}/validate`, {
          status: 'validated',
        });
      }

      showFormSuccess('Règlement enregistré et validé avec succès ! Quittance émise.');
      setShowPaymentModal(false);
      setPaymentComment('');
      setTransactionNumber('');
      loadData();
    } catch (err) {
      const res = handleFormError(err, 'Erreur lors de l’enregistrement du règlement.');
      if (res.fieldErrors) setPaymentFieldErrors(res.fieldErrors);
    } finally {
      setActionLoading(false);
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
      await api.put(`/invoices/${invoice.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      showFormSuccess('La facture a été annulée avec succès.');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelFieldError('');
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’annulation de la facture.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontWeight: 600, fontSize: '0.8125rem' }}>
            <CheckCircle2 size={14} /> Soldée
          </span>
        );
      case 'partial':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <Clock size={14} /> Partiellement payée
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontWeight: 600, fontSize: '0.8125rem' }}>
            <Clock size={14} /> En attente de règlement
          </span>
        );
      case 'overdue':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', fontWeight: 600, fontSize: '0.8125rem' }}>
            <AlertCircle size={14} /> En retard / Impayé
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#64748b' }}>
            <Ban size={14} /> Annulée
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'orange_money': return 'Orange Money';
      case 'mtn_money': return 'MTN Mobile Money';
      case 'moov_money': return 'Moov Money';
      case 'wave': return 'Wave CI';
      case 'bank_transfer': return 'Virement bancaire';
      case 'cash': return 'Espèces';
      case 'card': return 'Carte bancaire';
      default: return method;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement des détails de la facture...
        </div>
      </Layout>
    );
  }

  if (!invoice) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
          <AlertCircle size={40} color="var(--danger)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Facture introuvable</h2>
          <Link href="/invoices" className="btn btn-primary">
            Retour aux factures
          </Link>
        </div>
      </Layout>
    );
  }

  const periodText = `${MONTH_NAMES[invoice.periodMonth - 1] || 'Mois ' + invoice.periodMonth} ${invoice.periodYear}`;
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const remainingAmount = Number(invoice.remainingAmount !== undefined ? invoice.remainingAmount : Math.max(0, totalAmount - paidAmount));
  const isOverdue = invoice.status === 'overdue' || (new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled');

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* 1. Breadcrumb & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem' }}>
          <Link
            href="/invoices"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            Factures de Loyer
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {invoice.invoiceNumber}
          </span>
        </div>

        {/* 2. Page Header SaaS */}
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
              <Receipt size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
                  Facture {invoice.invoiceNumber}
                </h1>
                {getStatusBadge(invoice.status)}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Émise pour la période de <strong>{periodText}</strong> · Échéance le <strong>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Télécharger PDF */}
            <button
              onClick={handleDownloadPdf}
              className="btn btn-secondary"
              style={{ gap: '8px' }}
              disabled={actionLoading}
            >
              <Download size={16} />
              Télécharger PDF
            </button>

            {/* Relancer locataire */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={handleSendReminder}
                className="btn btn-secondary"
                style={{ gap: '8px' }}
                disabled={actionLoading}
                title="Envoyer un avis d’échéance ou une relance au locataire"
              >
                <Mail size={16} />
                Relancer
              </button>
            )}

            {/* Enregistrer un règlement */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => {
                  setPaymentAmount(String(remainingAmount));
                  setShowPaymentModal(true);
                }}
                className="btn btn-primary"
                style={{ gap: '8px' }}
              >
                <CreditCard size={16} />
                Enregistrer un règlement
              </button>
            )}

            {/* Annuler la facture */}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <button
                onClick={() => {
                  setCancelReason('');
                  setCancelFieldError('');
                  setShowCancelModal(true);
                }}
                className="btn btn-secondary"
                style={{ gap: '8px', color: '#dc2626' }}
                title="Annuler cette facture"
              >
                <Ban size={16} />
                Annuler
              </button>
            )}
          </div>
        </div>

        {/* 3. Financial Summary KPI Cards (Sans bordure gauche colorée) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Montant Total */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Émis
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
              {formatFcfa(totalAmount)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Loyer nu + charges locatives
            </span>
          </div>

          {/* Card 2: Montant Encaissé */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Montant Encaissé
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
              {formatFcfa(paidAmount)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {totalAmount > 0 ? `${Math.round((paidAmount / totalAmount) * 100)}% de la facture réglé` : '100%'}
            </span>
          </div>

          {/* Card 3: Solde Restant Dû */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: remainingAmount > 0 ? '#dc2626' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Solde Restant Dû
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: remainingAmount > 0 ? 'var(--danger-light)' : '#f1f5f9', color: remainingAmount > 0 ? 'var(--danger)' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: remainingAmount > 0 ? '#dc2626' : 'var(--text)' }}>
              {formatFcfa(remainingAmount)}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {remainingAmount === 0 ? 'Facture intégralement soldée' : 'À régler par le locataire'}
            </span>
          </div>

          {/* Card 4: Date d'Échéance */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Date Limite d'Échéance
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={14} />
              </div>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>
              {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </span>
            <span style={{ fontSize: '0.8125rem', color: isOverdue ? '#dc2626' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
              {invoice.status === 'paid' ? 'Acquittée dans les délais' : isOverdue ? 'Date d’échéance dépassée !' : 'Paiement attendu avant échéance'}
            </span>
          </div>
        </div>

        {/* 4. Two-Column Layout (Desktop 2fr / 1fr) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

          {/* LEFT COLUMN: Financial Breakdown & Payments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', gridColumn: 'span 2' }}>

            {/* A. Décomposition Financière */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="var(--primary)" />
                Décomposition Financière de la Facture
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Loyer nu contractuel</span>
                  <span style={{ fontWeight: 600 }}>{formatFcfa(Number(invoice.rentAmount))}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Charges locatives / Charges de copropriété</span>
                  <span style={{ fontWeight: 600 }}>{formatFcfa(Number(invoice.chargesAmount || 0))}</span>
                </div>

                {Number(invoice.penaltyAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <span style={{ color: '#dc2626' }}>Pénalités de retard applicables</span>
                    <span style={{ fontWeight: 600, color: '#dc2626' }}>+{formatFcfa(Number(invoice.penaltyAmount))}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '2px solid var(--border)', fontSize: '1rem', fontWeight: 700 }}>
                  <span>TOTAL FACTURÉ TTC</span>
                  <span style={{ color: 'var(--primary)', fontSize: '1.125rem' }}>{formatFcfa(totalAmount)}</span>
                </div>

                {paidAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Règlements & acomptes encaissés</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>-{formatFcfa(paidAmount)}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 16px',
                  backgroundColor: remainingAmount > 0 ? '#fef2f2' : '#f0fdf4',
                  borderRadius: 'var(--radius)',
                  border: remainingAmount > 0 ? '1px solid #fee2e2' : '1px solid #dcfce7',
                  marginTop: '8px'
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: remainingAmount > 0 ? '#991b1b' : '#166534' }}>
                    SOLDE RESTANT DÛ
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: remainingAmount > 0 ? '#dc2626' : 'var(--success)' }}>
                    {formatFcfa(remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* B. Historique des Règlements Associés */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={18} color="var(--primary)" />
                    Règlements Enregistrés pour cette Facture
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Traçabilité complète des versements, modes de paiement et quittances
                  </span>
                </div>

                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                  <button
                    onClick={() => {
                      setPaymentAmount(String(remainingAmount));
                      setShowPaymentModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '8px 12px', gap: '6px' }}
                  >
                    <Plus size={14} /> Ajouter un règlement
                  </button>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>RÉFÉRENCE</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DATE</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MODE</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>MONTANT</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  {(!invoice.payments || invoice.payments.length === 0) ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Aucun paiement enregistré pour le moment.
                      </td>
                    </tr>
                  ) : (
                    invoice.payments.map((p: any) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 20px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                          {p.paymentReference}
                          {p.transactionNumber && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              Tx: {p.transactionNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '0.8125rem' }}>
                          <span style={{ backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontWeight: 500, color: '#334155' }}>
                            {getPaymentMethodLabel(p.paymentMethod)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--success)' }}>
                          {formatFcfa(Number(p.amount))}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (Tenant, Property, Contract) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Locataire */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Locataire Débiteur
                </span>
                {invoice.tenantProfile?.id && (
                  <Link
                    href={`/tenants/${invoice.tenantProfile.id}`}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                  >
                    Profil <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(1, 62, 55, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {invoice.tenantProfile?.firstName?.charAt(0) || 'L'}{invoice.tenantProfile?.lastName?.charAt(0) || ''}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                    {invoice.tenantProfile?.firstName} {invoice.tenantProfile?.lastName}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Locataire principal
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8125rem', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                {invoice.tenantProfile?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <a href={`tel:${invoice.tenantProfile.phone}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                      {invoice.tenantProfile.phone}
                    </a>
                  </div>
                )}
                {invoice.tenantProfile?.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <a href={`mailto:${invoice.tenantProfile.email}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                      {invoice.tenantProfile.email}
                    </a>
                  </div>
                )}
                {invoice.tenantProfile?.reliabilityScore !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                    <span style={{ fontWeight: 600 }}>Score de fiabilité : {invoice.tenantProfile.reliabilityScore}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bien Immobilier */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Bien Immobilier
                </span>
                {invoice.property?.id && (
                  <Link
                    href={`/properties/${invoice.property.id}`}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                  >
                    Fiche bien <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>
                    {invoice.property?.name || 'Bien immobilier'}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {invoice.property?.type || 'Logement'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                {invoice.property?.address && <div>{invoice.property.address}</div>}
                <div>{invoice.property?.city || 'Abidjan'} · Côte d’Ivoire</div>
              </div>
            </div>

            {/* Contrat de Bail */}
            <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contrat de Bail
                </span>
                {invoice.contractId && (
                  <Link
                    href={`/contracts/${invoice.contractId}`}
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                  >
                    Voir contrat <ExternalLink size={12} />
                  </Link>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>N° Contrat :</span>
                  <span style={{ fontWeight: 600 }}>{invoice.contract?.contractNumber || 'BLW-CONTRAT'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jour d'échéance :</span>
                  <span style={{ fontWeight: 600 }}>Le {invoice.contract?.paymentDay || 5} de chaque mois</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: ENREGISTRER UN RÈGLEMENT */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Enregistrer un Règlement</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rattacher un paiement à la facture {invoice.invoiceNumber}</span>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Montant */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MONTANT ENCAISSÉ (FCFA) *</label>
                <input
                  type="number"
                  className={`form-control ${paymentFieldErrors.amount ? 'is-invalid' : ''}`}
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value);
                    if (paymentFieldErrors.amount) setPaymentFieldErrors({});
                  }}
                  placeholder="Ex: 150000"
                  required
                />
                {paymentFieldErrors.amount && <div className="form-error">{paymentFieldErrors.amount}</div>}
              </div>

              {/* Mode de paiement */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MODE DE PAIEMENT *</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="wave">Wave Côte d’Ivoire</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_money">MTN Mobile Money</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="cash">Espèces / Remise directe</option>
                  <option value="card">Carte bancaire</option>
                </select>
              </div>

              {/* Date & Réf transaction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">N° DE TRANSACTION / REÇU</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: WVE-98214"
                    value={transactionNumber}
                    onChange={(e) => setTransactionNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Commentaire */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">OBSERVATIONS (OPTIONNEL)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Remise en mains propres, acompte, etc."
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
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
                  {actionLoading ? 'Enregistrement...' : 'Valider l’encaissement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ANNULATION */}
      {showCancelModal && (
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
                onClick={() => setShowCancelModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '16px' }}>
              Confirmez-vous l’annulation de la facture <strong>{invoice.invoiceNumber}</strong> d'un montant de <strong>{formatFcfa(totalAmount)}</strong> ?
            </p>

            <form onSubmit={handleCancelInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">MOTIF DE L'ANNULATION *</label>
                <textarea
                  className={`form-control ${cancelFieldError ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="Ex: Erreur de saisie, départ anticipé..."
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
                  onClick={() => setShowCancelModal(false)}
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
