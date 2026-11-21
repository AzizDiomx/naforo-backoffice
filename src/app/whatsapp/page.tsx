'use client';

import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import Pagination from '@/components/Pagination';
import {
  MessageCircle,
  Search,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  Smartphone,
  Zap,
  RefreshCw,
  Users,
  FileText,
  CheckSquare,
} from 'lucide-react';

interface TenantOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  propertyName?: string;
}

interface UnpaidInvoiceOption {
  id: string;
  invoiceNumber: string;
  tenantName: string;
  tenantPhone: string;
  propertyName: string;
  remainingXof: number;
  dueDateStr: string;
  isOverdue: boolean;
}

type TemplateKey =
  | 'invoice_due'
  | 'courteous_overdue'
  | 'overdue_reminder'
  | 'receipt_confirmation'
  | 'inspection_notice'
  | 'welcome_portal'
  | 'custom';

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  invoice_due: 'Avis d’échéance',
  courteous_overdue: 'Relance courtoise (J+1..5)',
  overdue_reminder: 'Rappel d’impayé',
  receipt_confirmation: 'Confirmation & Quittance',
  inspection_notice: 'Intervention / État des lieux',
  welcome_portal: 'Bienvenue Locataire',
  custom: 'Message libre',
};

function formatXof(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0))} FCFA`;
}

function buildTemplateText(
  key: TemplateKey,
  ctx: {
    name: string;
    property: string;
    amountXof?: number;
    dueDate?: string;
    invoiceNumber?: string;
  }
): string {
  const name = ctx.name.trim() || 'Cher Locataire';
  const prop = ctx.property.trim() || 'votre logement';
  const amount = ctx.amountXof ? formatXof(ctx.amountXof) : 'votre loyer mensuel';
  const due = ctx.dueDate || 'le 5 du mois';
  const ref = ctx.invoiceNumber ? ` (Réf. *${ctx.invoiceNumber}*)` : '';

  switch (key) {
    case 'invoice_due':
      return [
        "*AVIS D'ÉCHÉANCE DE LOYER*",
        '',
        `Bonjour *${name}*,`,
        '',
        `Votre avis d'échéance concernant *${prop}*${ref} est disponible.`,
        `• Montant à régler : *${amount}*`,
        `• Date d'échéance : *${due}*`,
        '',
        'Vous pouvez effectuer votre règlement via Wave, Orange Money, MTN MoMo ou virement. Votre quittance certifiée avec QR Code vous sera transmise dès validation.',
        '',
        'Cordialement,',
        '_Votre Gestionnaire Immobilier_',
      ].join('\n');

    case 'courteous_overdue':
      return [
        '*RAPPEL COURTOIS DE LOYER*',
        '',
        `Bonjour *${name}*,`,
        '',
        `Sauf erreur ou omission de notre part, le règlement de *${amount}* pour *${prop}*${ref} (échéance au *${due}*) n'apparaît pas encore sur nos relevés.`,
        '',
        'Si votre paiement a déjà été effectué via Wave ou Mobile Money, merci de nous transmettre la référence de transaction afin d’éditer votre quittance.',
        '',
        'Bonne journée,',
        '_Votre Gestionnaire Immobilier_',
      ].join('\n');

    case 'overdue_reminder':
      return [
        '*RELANCE DE PAIEMENT — ÉCHÉANCE DÉPASSÉE*',
        '',
        `Bonjour *${name}*,`,
        '',
        `Nous constatons que votre loyer relatif à *${prop}*${ref} d'un montant de *${amount}* (exigible le *${due}*) demeure impayé à ce jour.`,
        '',
        'Nous vous prions de bien vouloir régulariser votre situation dans les meilleurs délais via Wave, Orange Money ou virement bancaire.',
        '',
        'Cordialement,',
        '_Service Gestion Locative_',
      ].join('\n');

    case 'receipt_confirmation':
      return [
        '*CONFIRMATION DE PAIEMENT & QUITTANCE*',
        '',
        `Bonjour *${name}*,`,
        '',
        `Nous vous confirmons la bonne réception de votre règlement de *${amount}* pour *${prop}*${ref}.`,
        'Votre quittance officielle certifiée par QR Code est disponible dans votre Espace Locataire et vous a été envoyée par email.',
        '',
        'Merci pour votre ponctualité.',
        '_Votre Gestionnaire Immobilier_',
      ].join('\n');

    case 'inspection_notice':
      return [
        '*VISITE TECHNIQUE / ÉTAT DES LIEUX*',
        '',
        `Bonjour *${name}*,`,
        '',
        `Dans le cadre du suivi de *${prop}*, notre technicien souhaite convenir d'un créneau de passage avec vous.`,
        'Merci de nous confirmer vos disponibilités par retour de message.',
        '',
        'Cordialement,',
        '_Service Technique & Maintenance_',
      ].join('\n');

    case 'welcome_portal':
      return [
        '*BIENVENUE DANS VOTRE ESPACE LOCATAIRE*',
        '',
        `Bonjour *${name}*,`,
        '',
        `Bienvenue dans votre logement (*${prop}*). Votre accès numérique Naforo est actif : vous pouvez y consulter votre bail, télécharger vos quittances certifiées et signaler toute demande d'intervention.`,
        '',
        'Nous restons à votre disposition.',
        '_Votre Gestionnaire Immobilier_',
      ].join('\n');

    default:
      return '';
  }
}

/**
 * Formate le texte WhatsApp (*gras*, _italique_) pour l'aperçu bulle
 */
function renderWhatsAppFormattedLine(line: string, idx: number) {
  if (!line.trim()) {
    return <div key={idx} style={{ height: '8px' }} />;
  }
  const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g);
  return (
    <div key={idx} style={{ lineHeight: 1.45 }}>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return <strong key={i}>{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
          return (
            <em key={i} style={{ color: '#475569' }}>
              {part.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function WhatsAppHubPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    sent: 0,
    delivered: 0,
    directLink: 0,
    usedThisMonth: 0,
    maxWhatsappMonthly: 100,
    planName: 'Pro',
    providerMode: 'fallback_direct_link',
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Répertoire locataires & factures impayées pour pré-remplissage intelligent
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoiceOption[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Quick Send Form
  const [quickPhone, setQuickPhone] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickProperty, setQuickProperty] = useState('');
  const [quickAmountXof, setQuickAmountXof] = useState<number | undefined>(undefined);
  const [quickDueDate, setQuickDueDate] = useState<string | undefined>(undefined);
  const [quickInvoiceNum, setQuickInvoiceNum] = useState<string | undefined>(undefined);
  const [quickRelatedInvoiceId, setQuickRelatedInvoiceId] = useState<string | undefined>(undefined);
  const [quickTemplate, setQuickTemplate] = useState<TemplateKey>('invoice_due');
  const [quickMessage, setQuickMessage] = useState(() =>
    buildTemplateText('invoice_due', { name: '', property: '' })
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: search.trim(),
        templateType: templateFilter,
        status: statusFilter,
      }).toString();

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/whatsapp/logs?${query}`).catch(() => ({ data: [], meta: { total: 0, totalPages: 1 } })),
        api.get('/whatsapp/stats').catch(() => null),
      ]);

      const items = Array.isArray(logsRes) ? logsRes : (logsRes as any)?.data || [];
      const meta = (logsRes as any)?.meta || {};
      setLogs(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || items.length);
      if (statsRes) {
        const sData = (statsRes as any)?.data || statsRes;
        setStats((prev: any) => ({ ...prev, ...sData }));
      }
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des journaux WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les locataires et factures en attente au montage
  useEffect(() => {
    Promise.all([
      api.get('/tenants?limit=100').catch(() => null),
      api.get('/invoices?limit=100').catch(() => null),
    ]).then(([tenantsRes, invoicesRes]) => {
      const rawTenants = Array.isArray(tenantsRes)
        ? tenantsRes
        : (tenantsRes as any)?.data || [];
      const mappedTenants: TenantOption[] = rawTenants
        .filter((t: any) => t?.phone)
        .map((t: any) => ({
          id: t.id,
          firstName: t.firstName || '',
          lastName: t.lastName || '',
          phone: t.phone || '',
          propertyName: t.contracts?.[0]?.property?.name || t.property?.name || '',
        }));
      setTenants(mappedTenants);

      const rawInvoices = Array.isArray(invoicesRes)
        ? invoicesRes
        : (invoicesRes as any)?.data || [];
      const now = new Date();
      const mappedInvoices: UnpaidInvoiceOption[] = rawInvoices
        .filter((inv: any) => inv && (inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partial') && inv.tenantProfile?.phone)
        .map((inv: any) => {
          const total = Number(inv.totalAmount || 0);
          const paid = Number(inv.paidAmount || 0);
          const due = inv.dueDate ? new Date(inv.dueDate) : now;
          const dueStr = `${String(due.getDate()).padStart(2, '0')}/${String(
            due.getMonth() + 1
          ).padStart(2, '0')}/${due.getFullYear()}`;
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber || 'FACT',
            tenantName: `${inv.tenantProfile?.firstName || ''} ${inv.tenantProfile?.lastName || ''}`.trim() || 'Locataire',
            tenantPhone: inv.tenantProfile?.phone || '',
            propertyName: inv.property?.name || 'Bien loué',
            remainingXof: Math.max(0, total - paid),
            dueDateStr: dueStr,
            isOverdue: inv.status === 'overdue' || due < now,
          };
        });
      setUnpaidInvoices(mappedInvoices);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, templateFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const applyContextAndTemplate = (
    tmpl: TemplateKey,
    nextCtx: {
      name: string;
      property: string;
      amountXof?: number;
      dueDate?: string;
      invoiceNumber?: string;
    }
  ) => {
    setQuickTemplate(tmpl);
    if (tmpl !== 'custom') {
      setQuickMessage(buildTemplateText(tmpl, nextCtx));
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    const found = tenants.find((t) => t.id === tenantId);
    if (!found) return;
    const fullName = `${found.firstName} ${found.lastName}`.trim();
    const prop = found.propertyName || '';
    setQuickPhone(found.phone);
    setQuickName(fullName);
    setQuickProperty(prop);
    setQuickAmountXof(undefined);
    setQuickDueDate(undefined);
    setQuickInvoiceNum(undefined);
    setQuickRelatedInvoiceId(undefined);
    applyContextAndTemplate(quickTemplate, { name: fullName, property: prop });
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const inv = unpaidInvoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const autoTemplate: TemplateKey = inv.isOverdue ? 'courteous_overdue' : 'invoice_due';
    setQuickPhone(inv.tenantPhone);
    setQuickName(inv.tenantName);
    setQuickProperty(inv.propertyName);
    setQuickAmountXof(inv.remainingXof);
    setQuickDueDate(inv.dueDateStr);
    setQuickInvoiceNum(inv.invoiceNumber);
    setQuickRelatedInvoiceId(inv.id);
    applyContextAndTemplate(autoTemplate, {
      name: inv.tenantName,
      property: inv.propertyName,
      amountXof: inv.remainingXof,
      dueDate: inv.dueDateStr,
      invoiceNumber: inv.invoiceNumber,
    });
  };

  const handleTemplateChange = (tmpl: TemplateKey) => {
    applyContextAndTemplate(tmpl, {
      name: quickName,
      property: quickProperty,
      amountXof: quickAmountXof,
      dueDate: quickDueDate,
      invoiceNumber: quickInvoiceNum,
    });
  };

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) {
      handleFormError(new Error('Veuillez saisir ou sélectionner un numéro de téléphone.'));
      return;
    }
    if (!quickMessage.trim()) {
      handleFormError(new Error('Veuillez saisir un message.'));
      return;
    }

    setSending(true);
    try {
      const res: any = await api.post('/whatsapp/send', {
        recipientPhone: quickPhone.trim(),
        recipientName: quickName.trim() || undefined,
        message: quickMessage.trim(),
        templateType: quickTemplate,
        relatedEntity: quickRelatedInvoiceId ? 'invoice' : undefined,
        relatedId: quickRelatedInvoiceId,
      });

      const payload = res?.data || res;
      if (payload?.directWhatsAppUrl && payload?.provider === 'fallback_direct_link') {
        window.open(payload.directWhatsAppUrl, '_blank');
      }

      showFormSuccess(
        payload?.provider === 'fallback_direct_link'
          ? 'Discussion WhatsApp ouverte et journalisée.'
          : 'Message WhatsApp envoyé automatiquement via API.'
      );
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’envoi WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  const handleBulkRemind = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setBulkSending(true);
    try {
      const res: any = await api.post('/whatsapp/invoices/bulk-remind', {
        invoiceIds: selectedInvoiceIds,
      });
      const payload = res?.data || res;
      showFormSuccess(
        `${payload?.sentCount || selectedInvoiceIds.length} relance(s) WhatsApp préparée(s) et enregistrée(s).`
      );
      setSelectedInvoiceIds([]);
      setShowBulkPanel(false);
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de la relance groupée.');
    } finally {
      setBulkSending(false);
    }
  };

  const quotaInfo = useMemo(() => {
    const used = Number(stats.usedThisMonth || 0);
    const max = Number(stats.maxWhatsappMonthly ?? 100);
    const isUnlimited = max >= 9999;
    const pct = isUnlimited ? Math.min(100, Math.round((used / 1000) * 100)) : max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 100;
    return { used, max, isUnlimited, pct };
  }, [stats]);

  const providerLabel =
    stats.providerMode === 'meta_cloud'
      ? 'Meta Cloud API (Automatique)'
      : stats.providerMode === 'twilio'
      ? 'Twilio API (Automatique)'
      : 'Hybride 1-Clic wa.me';

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return (
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <CheckCircle2 size={12} /> {status === 'delivered' ? 'Délivré API' : 'Envoyé API'}
          </span>
        );
      case 'direct_link_opened':
        return (
          <span className="badge badge-primary" style={{ gap: '4px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <ExternalLink size={12} /> 1-Clic wa.me
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ gap: '4px' }}>
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#013E37',
                color: '#FFEFB3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Centre de Relances &amp; Notifications WhatsApp
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Modèles personnalisés avec aperçu en direct, relances d&apos;impayés et suivi du quota mensuel
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {unpaidInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkPanel((v) => !v)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckSquare size={15} />
                Relance groupée ({unpaidInvoices.length} factures en attente)
              </button>
            )}
            <button
              type="button"
              onClick={() => loadData()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={15} /> Rafraîchir
            </button>
          </div>
        </div>

        {/* Bandeau Quota Mensuel & Statistiques */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Quota Mensuel ({stats.planName || 'Forfait'})
              </span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#013E37' }}>
                {quotaInfo.used} / {quotaInfo.isUnlimited ? 'Illimité' : quotaInfo.max}
              </span>
            </div>
            <div style={{ height: '7px', borderRadius: '999px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${quotaInfo.pct}%`,
                  backgroundColor: quotaInfo.pct > 90 && !quotaInfo.isUnlimited ? '#ef4444' : '#059669',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Messages transmis ce mois-ci
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Historique
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.total || 0}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                1-Clic Direct / API
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.directLink || 0} / {(stats.sent || 0) + (stats.delivered || 0)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                Canal Actif
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {providerLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Panneau de Relance Groupée des Factures Impayées */}
        {showBulkPanel && (
          <div className="card" style={{ padding: '20px 24px', border: '1px solid #013E37' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#013E37' }}>
                  Relance groupée des factures en attente / en retard
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cochez les factures à relancer automatiquement avec leur montant exact et date d&apos;échéance.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => {
                    if (selectedInvoiceIds.length === unpaidInvoices.length) {
                      setSelectedInvoiceIds([]);
                    } else {
                      setSelectedInvoiceIds(unpaidInvoices.map((i) => i.id));
                    }
                  }}
                >
                  {selectedInvoiceIds.length === unpaidInvoices.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  type="button"
                  disabled={bulkSending || selectedInvoiceIds.length === 0}
                  onClick={handleBulkRemind}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {bulkSending
                    ? 'Traitement...'
                    : `Relancer la sélection (${selectedInvoiceIds.length})`}
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '8px 12px', width: '36px' }} />
                    <th style={{ padding: '8px 12px' }}>Facture</th>
                    <th style={{ padding: '8px 12px' }}>Locataire</th>
                    <th style={{ padding: '8px 12px' }}>Bien</th>
                    <th style={{ padding: '8px 12px' }}>Reste dû</th>
                    <th style={{ padding: '8px 12px' }}>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidInvoices.map((inv) => {
                    const checked = selectedInvoiceIds.includes(inv.id);
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoiceIds((prev) => [...prev, inv.id]);
                              } else {
                                setSelectedInvoiceIds((prev) => prev.filter((id) => id !== inv.id));
                              }
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {inv.tenantName} <span style={{ color: 'var(--text-secondary)' }}>({inv.tenantPhone})</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{inv.propertyName}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: inv.isOverdue ? '#dc2626' : '#013E37' }}>
                          {formatXof(inv.remainingXof)}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{inv.dueDateStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compositeur + Aperçu Bulle WhatsApp côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {/* Colonne Gauche : Compositeur intelligent */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#013E37' }}>
              <Send size={17} />
              Composer un message WhatsApp
            </h2>

            {/* Sélecteurs rapides Locataire / Facture */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={13} /> Pré-remplir depuis un locataire
                </label>
                <select
                  className="form-control"
                  defaultValue=""
                  onChange={(e) => handleSelectTenant(e.target.value)}
                  style={{ height: '38px', fontSize: '0.82rem' }}
                >
                  <option value="">— Choisir un locataire —</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FileText size={13} /> Ou depuis une facture impayée
                </label>
                <select
                  className="form-control"
                  defaultValue=""
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  style={{ height: '38px', fontSize: '0.82rem' }}
                >
                  <option value="">— Choisir une facture —</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} · {inv.tenantName} ({formatXof(inv.remainingXof)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleQuickSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">Numéro WhatsApp *</label>
                  <input
                    type="text"
                    placeholder="Ex: +225 07 77 09 94 50"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Nom du destinataire</label>
                  <input
                    type="text"
                    placeholder="Ex: M. Kouassi Jean"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Modèle de message</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(Object.keys(TEMPLATE_LABELS) as TemplateKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTemplateChange(key)}
                      className={`btn ${quickTemplate === key ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.76rem', padding: '5px 11px', borderRadius: '999px' }}
                    >
                      {TEMPLATE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Texte du message (*gras*, _italique_) *</label>
                <textarea
                  rows={7}
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  className="form-control"
                  placeholder="Rédigez votre message WhatsApp..."
                  required
                  style={{ fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.45 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700 }}
                >
                  <MessageCircle size={16} />
                  {sending ? 'Envoi en cours...' : 'Envoyer sur WhatsApp'}
                </button>
              </div>
            </form>
          </div>

          {/* Colonne Droite : Aperçu réaliste Bulle WhatsApp */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
            {/* Barre supérieure style WhatsApp */}
            <div style={{ backgroundColor: '#075e54', color: '#ffffff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                {(quickName || 'L').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {quickName || 'Aperçu Destinataire'}
                </div>
                <div style={{ fontSize: '0.74rem', opacity: 0.85 }}>
                  {quickPhone || '+225 ••• ••• •••'} &middot; Aperçu en direct
                </div>
              </div>
            </div>

            {/* Fond de discussion WhatsApp */}
            <div style={{ backgroundColor: '#efeae2', padding: '20px 16px', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div
                style={{
                  backgroundColor: '#d9fdd3',
                  color: '#111b21',
                  borderRadius: '12px 12px 2px 12px',
                  padding: '12px 14px',
                  maxWidth: '92%',
                  alignSelf: 'flex-end',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
                  fontSize: '0.84rem',
                  wordBreak: 'break-word',
                }}
              >
                {(quickMessage || 'Votre message apparaîtra ici en temps réel...').split('\n').map((line, idx) =>
                  renderWhatsAppFormattedLine(line, idx)
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.68rem', color: '#667781' }}>
                  <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{ color: '#53bdeb', fontWeight: 700 }}>✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des relances WhatsApp */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Historique des messages transmis ({totalItems})
            </h2>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Rechercher nom, numéro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.84rem', width: '210px' }}
                />
              </div>

              <select
                value={templateFilter}
                onChange={(e) => { setTemplateFilter(e.target.value); setPage(1); }}
                className="form-control"
                style={{ height: '38px', fontSize: '0.84rem', width: 'auto', minWidth: '165px' }}
              >
                <option value="">Tous modèles</option>
                <option value="invoice_due">Avis d’échéance</option>
                <option value="courteous_overdue">Relance courtoise</option>
                <option value="overdue_reminder">Rappels impayés</option>
                <option value="receipt_confirmation">Quittances</option>
                <option value="inspection_notice">Interventions</option>
                <option value="welcome_portal">Bienvenue</option>
                <option value="custom">Personnalisés</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="form-control"
                style={{ height: '38px', fontSize: '0.84rem', width: 'auto', minWidth: '150px' }}
              >
                <option value="">Tous statuts</option>
                <option value="sent">Envoyé API</option>
                <option value="delivered">Délivré</option>
                <option value="direct_link_opened">Lien 1-clic</option>
              </select>

              <button type="submit" className="btn btn-secondary" style={{ height: '38px', padding: '0 16px' }}>
                Filtrer
              </button>
            </form>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Destinataire</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Modèle</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Aperçu du message</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Canal</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Chargement de l’historique WhatsApp...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Aucun message WhatsApp enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const waLink = `https://wa.me/${(log.recipientPhone || '').replace(/[\s\+\-]/g, '')}?text=${encodeURIComponent(log.messageContent || '')}`;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.recipientName || 'Locataire'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Smartphone size={12} /> {log.recipientPhone}
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-neutral">
                            {TEMPLATE_LABELS[log.templateType as TemplateKey] || 'Message direct'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', maxWidth: '320px' }}>
                          <div
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'var(--text-secondary)',
                              fontSize: '0.8rem',
                            }}
                            title={log.messageContent}
                          >
                            {log.messageContent}
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px' }}>{renderStatusBadge(log.status)}</td>

                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {formatDate(log.createdAt)}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: '#ecfdf5',
                              color: '#059669',
                              borderColor: '#a7f3d0',
                            }}
                          >
                            <MessageCircle size={13} />
                            Ouvrir
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
