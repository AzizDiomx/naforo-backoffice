'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  FileCheck
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 1. Charger la liste des biens et des locataires pour les filtres déroulants
  useEffect(() => {
    Promise.all([
      api.get('/properties?limit=100').catch(() => []),
      api.get('/tenant-profiles?limit=100').catch(() => [])
    ]).then(([propsRes, tenantsRes]) => {
      const pList = Array.isArray(propsRes) ? propsRes : propsRes.data || propsRes.items || [];
      const tList = Array.isArray(tenantsRes) ? tenantsRes : tenantsRes.data || tenantsRes.items || [];
      setProperties(pList);
      setTenants(tList);
    });
  }, []);

  // 2. Charger les contrats de bail
  useEffect(() => {
    setLoading(true);
    api.get(`/contracts?page=${page}&limit=${pageSize}`)
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || res.items || [];
        setContracts(list);
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
  }, [page, pageSize]);

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="badge badge-success" style={{ fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Bail Actif
          </span>
        );
      case 'terminated':
        return (
          <span className="badge badge-danger" style={{ fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={12} /> Résilié
          </span>
        );
      case 'expired':
        return (
          <span className="badge badge-warning" style={{ fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Expiré
          </span>
        );
      case 'draft':
        return (
          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600' }}>
            Brouillon
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'L';
  };

  // Filtrage côté client
  const filteredContracts = contracts.filter(c => {
    const s = search.toLowerCase();
    const ref = (c.contractNumber || '').toLowerCase();
    const tenantName = `${c.tenantProfile?.firstName || ''} ${c.tenantProfile?.lastName || ''}`.toLowerCase();
    const tenantPhone = (c.tenantProfile?.phone || '').toLowerCase();
    const propertyName = (c.property?.name || '').toLowerCase();
    const propertyCity = (c.property?.city || '').toLowerCase();

    const matchesSearch = 
      ref.includes(s) || 
      tenantName.includes(s) || 
      tenantPhone.includes(s) || 
      propertyName.includes(s) || 
      propertyCity.includes(s);

    const matchesStatus = !statusFilter ? true : c.status === statusFilter;
    const matchesProperty = !propertyFilter ? true : c.propertyId === propertyFilter || c.property?.id === propertyFilter;
    const matchesTenant = !tenantFilter ? true : c.tenantProfileId === tenantFilter || c.tenantProfile?.id === tenantFilter;

    return matchesSearch && matchesStatus && matchesProperty && matchesTenant;
  });

  if (loading && contracts.length === 0) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement des baux locatifs...
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
              <FileText size={28} style={{ color: 'var(--primary)' }} /> Contrats de Bail
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Gérez vos baux en cours, échéances d'encaissement, dépôts de garantie et conformité légale
            </p>
          </div>

          <Link
            href="/contracts/create"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Nouveau contrat de bail
          </Link>
        </div>

        {/* 2. Filters Panel - Style SaaS moderne */}
        <div className="card" style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Réf bail, locataire, bien..."
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
            <option value="active">Baux Actifs</option>
            <option value="draft">Brouillons</option>
            <option value="expired">Baux Expirés</option>
            <option value="terminated">Baux Résiliés</option>
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

          <select
            className="form-control"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="">Tous les locataires</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Contracts List - Modern SaaS Table */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', border: 'none', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONTRAT & PÉRIODE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>BIEN LOUÉ & VILLE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>LOCATAIRE</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONDITIONS FINANCIÈRES</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STATUT</th>
                <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Aucun contrat de bail ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredContracts.map(c => {
                  const property = c.property;
                  const tenant = c.tenantProfile;
                  const initials = getInitials(tenant?.firstName, tenant?.lastName);
                  const totalRent = Number(c.rentAmount || 0) + Number(c.chargesAmount || 0);
                  const deposit = Number(c.depositAmount || c.cautionAmount || 0);

                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Contrat & Période */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em' }}>
                            {c.contractNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            Du {new Date(c.startDate).toLocaleDateString('fr-FR')} 
                            {c.endDate ? ` au ${new Date(c.endDate).toLocaleDateString('fr-FR')}` : ' (Indéterminé)'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Échéance : le {c.paymentDay || 5} de chaque mois
                          </span>
                        </div>
                      </td>

                      {/* Bien Loué & Ville */}
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
                              <span style={{ textTransform: 'capitalize' }}>
                                {property.type || 'Bien'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Bien non renseigné</span>
                        )}
                      </td>

                      {/* Locataire */}
                      <td style={{ padding: '16px 20px' }}>
                        {tenant ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(1, 62, 55, 0.08)',
                              color: 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem',
                              flexShrink: 0
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                <Link href={`/tenants/${tenant.id || ''}`} style={{ color: '#0f172a', textDecoration: 'none' }}>
                                  {tenant.firstName} {tenant.lastName}
                                </Link>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Phone size={12} style={{ color: 'var(--primary)' }} />
                                <span>{tenant.phone}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Locataire non renseigné</span>
                        )}
                      </td>

                      {/* Conditions Financières */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                            {formatFcfa(totalRent)} <span style={{ fontSize: '0.725rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ mois</span>
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
                            Caution : <strong style={{ color: '#334155' }}>{deposit > 0 ? formatFcfa(deposit) : '0 FCFA'}</strong>
                          </span>
                          {deposit > 0 && (
                            <span style={{ fontSize: '0.675rem', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ShieldCheck size={11} /> Conforme Loi 2019-576
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td style={{ padding: '16px 20px' }}>
                        {getStatusBadge(c.status)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/contracts/${c.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                          >
                            <Eye size={13} />
                            Détails & Caution
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

        {/* 4. Pagination Bar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems || filteredContracts.length}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>

      </div>
    </Layout>
  );
}
