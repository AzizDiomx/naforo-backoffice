'use client';

import { useEffect, useState } from 'react';
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
  PhoneCall,
  Sparkles,
  Zap,
  Filter,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function WhatsAppHubPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, sent: 0, delivered: 0, directLink: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
  const [quickTemplate, setQuickTemplate] = useState('custom');
  const [quickMessage, setQuickMessage] = useState('');

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
        api.get('/whatsapp/stats').catch(() => ({ total: 0, sent: 0, delivered: 0, directLink: 0 })),
      ]);

      const items = Array.isArray(logsRes) ? logsRes : (logsRes as any)?.data || [];
      const meta = (logsRes as any)?.meta || {};
      setLogs(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || items.length);
      setStats(statsRes || { total: 0, sent: 0, delivered: 0, directLink: 0 });
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des journaux WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, templateFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleTemplateChange = (tmpl: string) => {
    setQuickTemplate(tmpl);
    if (tmpl === 'invoice_due') {
      setQuickMessage(
        `🔔 *AVIS D'ÉCHÉANCE DE LOYER*\n\nBonjour ${quickName || 'Cher Locataire'},\nVotre gestionnaire vous rappelle que votre avis d'échéance de loyer est disponible. Merci d'effectuer votre règlement via Wave, Orange Money ou virement avant la date limite.\n\nBonne journée.`
      );
    } else if (tmpl === 'overdue_reminder') {
      setQuickMessage(
        `⚠️ *RAPPEL DE PAIEMENT - ÉCHÉANCE DÉPASSÉE*\n\nBonjour ${quickName || 'Cher Locataire'},\nSauf erreur de notre part, votre loyer reste en attente de règlement. Merci de régulariser la situation dans les plus brefs délais via Wave ou Orange Money.\n\nMerci de votre réactivité.`
      );
    } else if (tmpl === 'receipt_confirmation') {
      setQuickMessage(
        `✅ *CONFIRMATION DE RÈGLEMENT*\n\nBonjour ${quickName || 'Cher Locataire'},\nNous vous confirmons la bonne réception de votre paiement de loyer. Votre quittance est certifiée et disponible dans votre espace locataire.\n\nMerci pour votre ponctualité !`
      );
    } else {
      setQuickMessage('');
    }
  };

  const handleQuickSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPhone.trim()) {
      showFormSuccess('Veuillez saisir un numéro de téléphone.');
      return;
    }
    if (!quickMessage.trim()) {
      showFormSuccess('Veuillez saisir un message.');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/whatsapp/send', {
        recipientPhone: quickPhone.trim(),
        recipientName: quickName.trim() || undefined,
        message: quickMessage.trim(),
      });

      if (res.directWhatsAppUrl) {
        window.open(res.directWhatsAppUrl, '_blank');
      }

      showFormSuccess('Message WhatsApp initié avec succès ! Discussion ouverte.');
      setQuickPhone('');
      setQuickName('');
      setQuickMessage('');
      setQuickTemplate('custom');
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’envoi WhatsApp.');
    } finally {
      setSending(false);
    }
  };

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
            <CheckCircle2 size={12} /> {status === 'delivered' ? 'Délivré API' : 'Transmis Twilio'}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Relances & Notifications WhatsApp
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Module Forfait Expert : Relances automatisées, avis d’échéance et liens directs 1-clic pour vos locataires
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => loadData()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Rafraîchir les journaux"
            >
              <RefreshCw size={15} /> Rafraîchir
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Relances
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.total || 0}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Liens 1-Clic Directs
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.directLink || 0}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Automations Twilio
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {(stats.sent || 0) + (stats.delivered || 0)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mode de Diffusion
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Hybride API / 1-Clic
              </div>
            </div>
          </div>
        </div>

        {/* Quick Send Tool */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="#10b981" />
            Envoi Rapide ou Test de Message WhatsApp
          </h2>

          <form onSubmit={handleQuickSend} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">
                Numéro WhatsApp du destinataire *
              </label>
              <input
                type="text"
                placeholder="Ex: +225 07 00 00 00 00 ou 0700000000"
                value={quickPhone}
                onChange={(e) => setQuickPhone(e.target.value)}
                className="form-control"
                style={{ borderRadius: '8px' }}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Les numéros ivoiriens (01, 05, 07) sont automatiquement formatés en +225.
              </span>
            </div>

            <div>
              <label className="form-label">
                Nom du destinataire (facultatif)
              </label>
              <input
                type="text"
                placeholder="Ex: M. Kouassi Jean"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="form-control"
                style={{ borderRadius: '8px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Modèle prérempli
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn ${quickTemplate === 'invoice_due' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => handleTemplateChange('invoice_due')}
                >
                  Avis d’échéance
                </button>
                <button
                  type="button"
                  className={`btn ${quickTemplate === 'overdue_reminder' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => handleTemplateChange('overdue_reminder')}
                >
                  Rappel impayé / retard
                </button>
                <button
                  type="button"
                  className={`btn ${quickTemplate === 'receipt_confirmation' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => handleTemplateChange('receipt_confirmation')}
                >
                  Confirmation de quittance
                </button>
                <button
                  type="button"
                  className={`btn ${quickTemplate === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => handleTemplateChange('custom')}
                >
                  Message personnalisé
                </button>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Contenu du message WhatsApp *
              </label>
              <textarea
                rows={4}
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                className="form-control"
                placeholder="Rédigez votre message WhatsApp..."
                required
                style={{ fontFamily: 'inherit', resize: 'vertical', borderRadius: '8px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary"
                style={{ backgroundColor: '#10b981', borderColor: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: 600 }}
              >
                <MessageCircle size={16} />
                {sending ? 'Préparation...' : 'Envoyer / Ouvrir sur WhatsApp'}
              </button>
            </div>
          </form>
        </div>

        {/* Logs Table Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
              Historique des relances WhatsApp transmises ({totalItems})
            </h2>

            {/* Filters */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Rechercher nom, numéro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem', width: '220px', borderRadius: '8px' }}
                />
              </div>

              <select
                value={templateFilter}
                onChange={(e) => { setTemplateFilter(e.target.value); setPage(1); }}
                className="form-control"
                style={{ height: '38px', fontSize: '0.85rem', width: '170px', borderRadius: '8px' }}
              >
                <option value="">Tous types</option>
                <option value="invoice_due">Avis d’échéance</option>
                <option value="overdue_reminder">Rappels impayés</option>
                <option value="receipt_confirmation">Quittances</option>
                <option value="custom">Personnalisés</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="form-control"
                style={{ height: '38px', fontSize: '0.85rem', width: '160px', borderRadius: '8px' }}
              >
                <option value="">Tous statuts</option>
                <option value="sent">Transmis</option>
                <option value="delivered">Délivré</option>
                <option value="direct_link_opened">Lien 1-clic</option>
              </select>

              <button type="submit" className="btn btn-secondary" style={{ height: '38px', padding: '0 16px', borderRadius: '8px' }}>
                Filtrer
              </button>
            </form>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Destinataire</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Modèle / Contexte</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Message Transmis</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Statut</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date & Heure</th>
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
                      Aucune relance WhatsApp trouvée. Utilisez les boutons verts sur les factures pour tester !
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const waLink = `https://wa.me/${log.recipientPhone.replace(/[\s\+\-]/g, '')}?text=${encodeURIComponent(log.messageContent)}`;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {log.recipientName || 'Locataire'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Smartphone size={12} /> {log.recipientPhone}
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                            {log.templateType === 'invoice_due'
                              ? 'Avis d’échéance'
                              : log.templateType === 'overdue_reminder'
                              ? 'Rappel Impayé'
                              : log.templateType === 'receipt_confirmation'
                              ? 'Quittance'
                              : 'Message Direct'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', maxWidth: '320px' }}>
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

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          {renderStatusBadge(log.status)}
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {formatDate(log.createdAt)}
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
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
                            title="Réouvrir la conversation WhatsApp"
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

          {/* Pagination */}
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
