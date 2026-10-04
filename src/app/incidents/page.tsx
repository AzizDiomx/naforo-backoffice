'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import Pagination from '@/components/Pagination';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  Building,
  User,
  Phone,
  Flame,
  Droplet,
  Zap,
  Wind,
  ShieldAlert,
  HelpCircle,
  Check,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [propertyFilter, setPropertyFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, propRes, statsRes] = await Promise.all([
        api.get('/incidents?limit=100').catch(() => ({ data: [] })),
        api.get('/properties?limit=100').catch(() => ({ data: [] })),
        api.get('/incidents/stats').catch(() => null)
      ]);

      const items = Array.isArray(incRes) ? incRes : incRes.data || incRes.items || [];
      const propItems = Array.isArray(propRes) ? propRes : propRes.data || propRes.items || [];
      
      setIncidents(items);
      setProperties(propItems);
      setStats(statsRes);
    } catch (err) {
      console.error("Erreur de chargement des incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // 1. Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesNumber = inc.incidentNumber?.toLowerCase().includes(query);
        const matchesTitle = inc.title?.toLowerCase().includes(query);
        const matchesDesc = inc.description?.toLowerCase().includes(query);
        const matchesProp = inc.property?.name?.toLowerCase().includes(query);
        const matchesTenant = `${inc.tenantProfile?.firstName || ''} ${inc.tenantProfile?.lastName || ''}`.toLowerCase().includes(query);
        if (!matchesNumber && !matchesTitle && !matchesDesc && !matchesProp && !matchesTenant) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
        return false;
      }

      // 3. Priority filter
      if (priorityFilter !== 'ALL' && inc.priority !== priorityFilter) {
        return false;
      }

      // 4. Type filter
      if (typeFilter !== 'ALL' && inc.type !== typeFilter) {
        return false;
      }

      // 5. Property filter
      if (propertyFilter !== 'ALL' && inc.propertyId !== propertyFilter) {
        return false;
      }

      return true;
    });
  }, [incidents, search, statusFilter, priorityFilter, typeFilter, propertyFilter]);

  // Paginated incidents
  const paginatedIncidents = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredIncidents.slice(start, start + limit);
  }, [filteredIncidents, page, limit]);

  // Quick Stats calculated or from backend
  const calculatedStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.status === 'open').length;
    const inProgress = incidents.filter(i => i.status === 'in_progress').length;
    const resolved = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const urgent = incidents.filter(i => (i.priority === 'urgent' || i.priority === 'high') && i.status !== 'resolved' && i.status !== 'closed').length;
    return { total, open, inProgress, resolved, urgent };
  }, [incidents]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'leak':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <Droplet size={12} /> Fuite d'eau
          </span>
        );
      case 'plumbing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Wrench size={12} /> Plomberie
          </span>
        );
      case 'electricity':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fefce8', color: '#a16207' }}>
            <Zap size={12} /> Électricité
          </span>
        );
      case 'ac':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f0fdfa', color: '#0f766e' }}>
            <Wind size={12} /> Climatisation
          </span>
        );
      case 'breakdown':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fff7ed', color: '#c2410c' }}>
            <Flame size={12} /> Panne équipement
          </span>
        );
      case 'security':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#b91c1c' }}>
            <ShieldAlert size={12} /> Sécurité / Serrure
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>
            <HelpCircle size={12} /> Autre réclamation
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={12} /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, backgroundColor: '#ffedd5', color: '#c2410c' }}>
            Élevé
          </span>
        );
      case 'medium':
        return (
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            Moyen
          </span>
        );
      default:
        return (
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, backgroundColor: '#f1f5f9', color: '#64748b' }}>
            Faible
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Résolu
          </span>
        );
      case 'closed':
        return (
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} /> Clôturé
          </span>
        );
      case 'in_progress':
        return (
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(1, 62, 55, 0.1)', color: 'var(--primary)' }}>
            <Clock size={12} /> En intervention
          </span>
        );
      default:
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> Ouvert
          </span>
        );
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
              <Wrench size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                Incidents & Pannes
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Suivi des réclamations techniques, interventions des prestataires et maintenance du parc locatif
              </p>
            </div>
          </div>

          <Link href="/incidents/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            Déclarer un incident
          </Link>
        </div>

        {/* 2. KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Total */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Réclamations
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text)' }}>
                {calculatedStats.total}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>dossiers</span>
            </div>
          </div>

          {/* Card 2: Ouverts */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                En attente / Ouverts
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#d97706' }}>
                {calculatedStats.open}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>à qualifier</span>
            </div>
          </div>

          {/* Card 3: En cours */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                En Intervention
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                {calculatedStats.inProgress}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>techniciens actifs</span>
            </div>
          </div>

          {/* Card 4: Résolus */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Résolus / Clôturés
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a' }}>
                {calculatedStats.resolved}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>clôturés</span>
            </div>
          </div>

          {/* Card 5: Urgents non résolus */}
          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Urgents Prioritaires
              </span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>
                {calculatedStats.urgent}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>urgences</span>
            </div>
          </div>
        </div>

        {/* 3. Multi-criteria Filter Bar */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            alignItems: 'center'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par N°, titre, bien, locataire..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            {/* Statut */}
            <div>
              <select
                className="form-control"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les statuts</option>
                <option value="open">Ouvert / En attente</option>
                <option value="in_progress">En intervention</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>

            {/* Priorité */}
            <div>
              <select
                className="form-control"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Toutes les priorités</option>
                <option value="urgent">Urgent</option>
                <option value="high">Élevé</option>
                <option value="medium">Moyen</option>
                <option value="low">Faible</option>
              </select>
            </div>

            {/* Type */}
            <div>
              <select
                className="form-control"
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les types de panne</option>
                <option value="leak">Fuite d'eau</option>
                <option value="plumbing">Plomberie</option>
                <option value="electricity">Électricité</option>
                <option value="ac">Climatisation</option>
                <option value="breakdown">Panne équipement</option>
                <option value="security">Sécurité / Serrure</option>
                <option value="other">Autre réclamation</option>
              </select>
            </div>

            {/* Bien immobilier */}
            <div>
              <select
                className="form-control"
                value={propertyFilter}
                onChange={(e) => { setPropertyFilter(e.target.value); setPage(1); }}
              >
                <option value="ALL">Tous les biens immobiliers</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Table SaaS */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              Chargement des dossiers d'incidents...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'var(--background)', marginBottom: '12px' }}>
                <Wrench size={32} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                Aucun incident trouvé
              </h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 16px auto' }}>
                {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || typeFilter !== 'ALL' || propertyFilter !== 'ALL'
                  ? "Aucun résultat ne correspond à vos critères de filtrage."
                  : "Aucun incident n'a été déclaré pour le moment dans votre organisation."}
              </p>
              <Link href="/incidents/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} />
                Déclarer un incident
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      TICKET & PRIORITÉ
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      TYPE & INTITULÉ
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      BIEN LOUÉ & VILLE
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      DÉCLARANT
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      INTERVENANT
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      STATUT
                    </th>
                    <th style={{ padding: '14px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncidents.map((inc) => {
                    const tenantInitials = inc.tenantProfile
                      ? `${inc.tenantProfile.firstName?.[0] || ''}${inc.tenantProfile.lastName?.[0] || ''}`.toUpperCase()
                      : 'LOC';

                    return (
                      <tr key={inc.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s ease' }}>
                        {/* 1. Ticket & Priorité */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)' }}>
                              {inc.incidentNumber}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {getPriorityBadge(inc.priority)}
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(inc.createdAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Type & Intitulé */}
                        <td style={{ padding: '16px', maxWidth: '280px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>{getTypeBadge(inc.type)}</div>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.3 }}>
                              {inc.title}
                            </span>
                            {inc.description && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {inc.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Bien loué & Ville */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Link
                              href={`/properties/${inc.propertyId}`}
                              style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Building size={14} />
                              {inc.property?.name || 'Bien immobilier'}
                            </Link>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                {inc.property?.city || 'Abidjan'}
                              </span>
                              {inc.property?.address && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                  {inc.property.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. Déclarant */}
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(1, 62, 55, 0.08)',
                              color: 'var(--primary)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {tenantInitials}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                {inc.tenantProfile?.firstName} {inc.tenantProfile?.lastName}
                              </span>
                              {inc.tenantProfile?.phone && (
                                <a
                                  href={`tel:${inc.tenantProfile.phone}`}
                                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Phone size={11} /> {inc.tenantProfile.phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 5. Intervenant */}
                        <td style={{ padding: '16px' }}>
                          {inc.assignee ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={14} style={{ color: 'var(--primary)' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                  {inc.assignee.firstName} {inc.assignee.lastName}
                                </span>
                                {inc.assignee.phone && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {inc.assignee.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                              Non assigné
                            </span>
                          )}
                        </td>

                        {/* 6. Statut */}
                        <td style={{ padding: '16px' }}>
                          {getStatusBadge(inc.status)}
                        </td>

                        {/* 7. Actions */}
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <Link
                            href={`/incidents/${inc.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Eye size={14} />
                            Détails & Suivi
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredIncidents.length > 0 && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(filteredIncidents.length / limit) || 1}
                pageSize={limit}
                totalItems={filteredIncidents.length}
                onPageChange={(p: number) => setPage(p)}
                onPageSizeChange={(l: number) => { setLimit(l); setPage(1); }}
              />
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
