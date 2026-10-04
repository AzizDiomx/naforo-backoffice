'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Building2, 
  FileText, 
  MessageSquare, 
  ShieldAlert,
  MapPin,
  Users
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // 1. Charger la liste des biens pour le filtre déroulant
    api.get('/properties?limit=100')
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || res.items || [];
        setProperties(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 2. Charger les locataires avec pagination
    setLoading(true);
    api.get(`/tenant-profiles?page=${page}&limit=${pageSize}`)
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || res.items || [];
        setTenants(list);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalItems(res.meta.total || list.length);
        } else {
          setTotalPages(1);
          setTotalItems(list.length);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // 3. Charger le statut d'abonnement
    api.get('/subscriptions/me')
      .then(subData => {
        setSubscription(subData);
      })
      .catch(() => {});
  }, [page, pageSize]);

  const getReliabilityBadge = (score: number) => {
    if (score >= 90) return <span className="badge badge-success" style={{ fontWeight: '700' }}>{score}/100 Excellent</span>;
    if (score >= 70) return <span className="badge badge-warning" style={{ fontWeight: '700' }}>{score}/100 Correct</span>;
    return <span className="badge badge-danger" style={{ fontWeight: '700' }}>{score}/100 Risqué</span>;
  };

  const getReliabilityBarColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--warning)';
    return 'var(--danger)';
  };

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'L';
  };

  // Filtrage côté client
  const filteredTenants = tenants.filter(t => {
    const s = search.toLowerCase();
    const fullName = `${t.firstName || ''} ${t.lastName || ''}`.toLowerCase();
    const activeContract = t.contracts && t.contracts.length > 0 ? t.contracts[0] : null;
    const propertyName = activeContract?.property?.name?.toLowerCase() || '';

    const matchesSearch = 
      fullName.includes(s) || 
      (t.phone && t.phone.toLowerCase().includes(s)) ||
      (t.email && t.email.toLowerCase().includes(s)) ||
      (t.nationalId && t.nationalId.toLowerCase().includes(s)) ||
      propertyName.includes(s);

    const matchesStatus = 
      !statusFilter ? true :
      statusFilter === 'active_lease' ? !!activeContract :
      statusFilter === 'no_lease' ? !activeContract : true;

    const score = Number(t.reliabilityScore ?? 100);
    const matchesScore = 
      !scoreFilter ? true :
      scoreFilter === 'excellent' ? score >= 90 :
      scoreFilter === 'correct' ? (score >= 70 && score < 90) :
      scoreFilter === 'risky' ? score < 70 : true;

    const matchesProperty = 
      !propertyFilter ? true :
      activeContract?.property?.id === propertyFilter || activeContract?.property?.name === propertyFilter;

    return matchesSearch && matchesStatus && matchesScore && matchesProperty;
  });

  const quotaReached = subscription ? subscription.quotas?.tenants?.reached : false;
  const currentCount = subscription ? subscription.quotas?.tenants?.used : 0;
  const maxLimit = subscription ? subscription.quotas?.tenants?.max : 2;

  if (loading && tenants.length === 0) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement des fiches locataires...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 1. Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={28} style={{ color: 'var(--primary)' }} /> Locataires
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Gérez vos résidents, baux actifs, coordonnées et scores de solvabilité
            </p>
          </div>

          <Link
            href={quotaReached ? '/subscription' : '/tenants/create'}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Ajouter un locataire
          </Link>
        </div>

        {/* 2. Quota Alert Banner */}
        {quotaReached && (
          <div style={{
            backgroundColor: 'var(--warning-light)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: 'var(--text)'
          }}>
            <ShieldAlert size={24} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Limite de locataires atteinte ({currentCount} / {maxLimit})</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Votre forfait actuel ne vous permet pas d'ajouter de nouveaux locataires actifs. Veuillez passer à un forfait supérieur pour continuer.
              </span>
            </div>
            <Link href="/subscription" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
              Surclasser
            </Link>
          </div>
        )}

        {/* 3. Filters Panel - Style SaaS moderne */}
        <div className="card" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher nom, tél, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts de bail</option>
            <option value="active_lease">Sous contrat actif</option>
            <option value="no_lease">Sans bail actif</option>
          </select>

          <select
            className="form-control"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
          >
            <option value="">Tous les scores de fiabilité</option>
            <option value="excellent">Score Excellent (90 - 100)</option>
            <option value="correct">Score Correct (70 - 89)</option>
            <option value="risky">Score Risqué (&lt; 70)</option>
          </select>

          <select
            className="form-control"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
          >
            <option value="">Tous les biens loués</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Tenants List - Modern SaaS Table Layout */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: 'none', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LOCATAIRE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BIEN OCCUPÉ & VILLE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTACTS</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SITUATION PROFESSIONNELLE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SCORE DE FIABILITÉ</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Aucun dossier locataire ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(t => {
                  const activeContract = t.contracts && t.contracts.length > 0 ? t.contracts[0] : null;
                  const property = activeContract?.property;
                  const initials = getInitials(t.firstName, t.lastName);
                  const score = Number(t.reliabilityScore ?? 100);

                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Locataire */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(1, 62, 55, 0.08)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>
                              {t.firstName} {t.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              {t.nationalId ? (
                                <span>Pièce: <strong style={{ color: '#475569' }}>{t.nationalId}</strong></span>
                              ) : (
                                <span>Réf: #{t.id.slice(0, 8)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bien occupé & ville */}
                      <td style={{ padding: '16px 20px' }}>
                        {property ? (
                          <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Building2 size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <Link href={`/properties/${property.id}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                                {property.name}
                              </Link>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                {property.city || 'Abidjan'}
                              </span>
                              <span>•</span>
                              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                                {formatFcfa(Number(activeContract.rentAmount || 0))} / mois
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.725rem' }}>
                            Sans bail actif
                          </span>
                        )}
                      </td>

                      {/* Contacts */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontSize: '0.825rem', fontWeight: '500' }}>
                            <Phone size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            <a href={`tel:${t.phone}`} style={{ color: '#334155', textDecoration: 'none' }}>
                              {t.phone}
                            </a>
                          </span>
                          {t.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              <Mail size={13} style={{ flexShrink: 0 }} />
                              <a href={`mailto:${t.email}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                                {t.email}
                              </a>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Situation professionnelle */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#334155', fontWeight: '600', fontSize: '0.825rem' }}>
                            {t.profession || 'Non renseigné'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {t.employer ? `Chez ${t.employer}` : 'Sans employeur déclaré'}
                          </span>
                        </div>
                      </td>

                      {/* Score de fiabilité */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '140px' }}>
                          {getReliabilityBadge(score)}
                          <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(score, 100)}%`,
                              height: '100%',
                              backgroundColor: getReliabilityBarColor(score),
                              borderRadius: '3px'
                            }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/tenants/${t.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}
                          >
                            Détails
                          </Link>
                          <Link
                            href="/chat"
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--primary)', borderColor: '#bfdbfe', backgroundColor: '#eff6ff', fontWeight: '600' }}
                          >
                            <MessageSquare size={13} style={{ marginRight: 4 }} />
                            Chat
                          </Link>
                          <Link
                            href={`/tenants/${t.id}/edit`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}
                          >
                            Éditer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems || filteredTenants.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>

      </div>
    </Layout>
  );
}
