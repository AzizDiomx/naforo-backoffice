'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Plus, Search, Building2, MapPin, DollarSign, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // Charger les pays pour les filtres
    api.get('/locations/countries')
      .then(res => {
        if (Array.isArray(res)) setCountries(res);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Charger les propriétés
    api.get(`/properties?page=${page}&limit=${pageSize}`)
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || res.items || [];
        setProperties(list);
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

    // Charger les abonnements de manière non-bloquante
    api.get('/subscriptions/me')
      .then(subData => {
        setSubscription(subData);
      })
      .catch(() => {
        // Ignorer l'erreur d'abonnements pour le superadmin ou les comptes sans abonnements
      });
  }, [page, pageSize]);

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Disponible</span>;
      case 'occupied':
        return <span className="badge" style={{ backgroundColor: 'rgba(1, 62, 55, 0.1)', color: 'var(--primary)' }}>Occupé</span>;
      case 'maintenance':
        return <span className="badge badge-danger">Maintenance</span>;
      case 'reserved':
        return <span className="badge badge-warning">Réservé</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const filteredProperties = properties.filter(p => {
    const s = search.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(s) || 
      p.address.toLowerCase().includes(s) ||
      (p.city && p.city.toLowerCase().includes(s)) ||
      (p.country && p.country.toLowerCase().includes(s));
    const matchesType = typeFilter ? p.type === typeFilter : true;
    const matchesStatus = statusFilter ? p.status === statusFilter : true;
    const matchesCountry = countryFilter ? (p.country === countryFilter || (countryFilter === 'CI' && p.country === 'Côte d\'Ivoire')) : true;
    return matchesSearch && matchesType && matchesStatus && matchesCountry;
  });

  const quotaReached = subscription ? subscription.quotas.properties.reached : false;
  const currentCount = subscription ? subscription.quotas.properties.used : 0;
  const maxLimit = subscription ? subscription.quotas.properties.max : 2;

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement de votre parc immobilier...
        </div>
      </Layout>
    );
  }

  const getAccentColor = (p: any) => {
    switch (p.status) {
      case 'available': return '#10b981'; // Vert Emeraude pour disponible
      case 'occupied': return 'var(--primary)'; // Bleu pour occupé
      case 'maintenance': return '#ef4444'; // Rouge pour maintenance
      case 'reserved': return '#f59e0b'; // Ambre pour réservé
      default: return '#6366f1';
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Biens Immobiliers</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Gérez vos appartements, villas, bureaux et résidences</p>
          </div>

          <Link
            href={quotaReached ? '/subscription' : '/properties/create'}
            className="btn btn-primary"

          >
            <Plus size={16} />
            Créer un bien
          </Link>
        </div>

        {/* Quota Alert Banner */}
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
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Limite de biens atteinte ({currentCount} / {maxLimit})</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Votre forfait actuel ne vous permet pas de créer de nouveaux biens. Veuillez passer à un forfait supérieur pour étendre votre parc.
              </span>
            </div>
            <Link href="/subscription" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
              Surclasser
            </Link>
          </div>
        )}

        {/* Filters Panel */}
        <div className="card" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom, adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            className="form-control"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="apartment">Appartement</option>
            <option value="villa">Villa</option>
            <option value="building">Immeuble</option>
            <option value="residence">Résidence</option>
            <option value="shop">Boutique / Magasin</option>
            <option value="office">Bureau</option>
          </select>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="occupied">Occupé</option>
            <option value="maintenance">Maintenance</option>
            <option value="reserved">Réservé</option>
          </select>

          <select
            className="form-control"
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
          >
            <option value="">Tous les pays</option>
            {countries.map((c) => (
              <option key={c.id || c.code} value={c.name}>
                {c.flag ? `${c.flag} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Properties List - Modern SaaS Table Layout */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: 'none', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BIEN</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LOCALISATION & ADRESSE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUT</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right' }}>LOYER (MENSUEL)</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Aucun bien immobilier ne correspond à vos critères.
                  </td>
                </tr>
              ) : (
                filteredProperties.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontWeight: '500' }}>{p.address}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', marginLeft: '20px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                          {p.country || 'Côte d\'Ivoire'}
                        </span>
                        <span>•</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{p.city}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(p.status)}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        {p.rentAmount ? formatFcfa(Number(p.rentAmount)) : '-'}
                      </div>
                      {p.chargesAmount && Number(p.chargesAmount) > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          + {formatFcfa(Number(p.chargesAmount))} de charges
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link href={`/properties/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}>
                          Détails
                        </Link>
                        <Link href={`/properties/${p.id}/edit`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}>
                          Editer
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems || filteredProperties.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>

      </div>
    </Layout>
  );
}

