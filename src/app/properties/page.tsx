'use client';

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  BarChart3,
  User,
  UserCheck,
  Wrench,
  ExternalLink,
  Filter,
  Maximize2,
  AlertTriangle,
  DoorOpen,
  PieChart
} from 'lucide-react';
import Pagination from '@/components/Pagination';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [advancedStats, setAdvancedStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // View Mode: 'lots' (Regroupement par Lot), 'list' (Liste standard), 'stats' (Statistiques avancées par lot)
  const [viewMode, setViewMode] = useState<'lots' | 'list' | 'stats'>('lots');
  
  // Expanded lots in Lots view
  const [expandedLots, setExpandedLots] = useState<Record<string, boolean>>({});

  // Expanded lots in Table List view
  const [expandedTableLots, setExpandedTableLots] = useState<Record<string, boolean>>({});

  // Filter for advanced stats view
  const [selectedStatsLotId, setSelectedStatsLotId] = useState<string>('all');

  // Filters for standard list view
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
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

    // Charger les gestionnaires d'agence pour le filtre de portefeuille
    api.get('/users/managers')
      .then(res => {
        if (Array.isArray(res)) setManagers(res);
      })
      .catch(() => {});
  }, []);

  const loadProperties = () => {
    const mgrParam = managerFilter ? `&managerId=${managerFilter}` : '';
    api.get(`/properties?page=${page}&limit=${pageSize}${mgrParam}`)
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
      })
      .catch(() => {});
  };

  const loadLots = () => {
    setLotsLoading(true);
    api.get('/properties/lots')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setLots(list);
        // Expand the first lot by default
        if (list.length > 0) {
          setExpandedLots({ [list[0].id]: true });
        }
      })
      .catch(() => setLots([]))
      .finally(() => setLotsLoading(false));
  };

  const loadAdvancedStats = (lotId?: string) => {
    setStatsLoading(true);
    const endpoint = lotId && lotId !== 'all' 
      ? `/properties/statistics/advanced?lotId=${lotId}` 
      : '/properties/statistics/advanced';

    api.get(endpoint)
      .then(res => {
        setAdvancedStats(res);
      })
      .catch(() => setAdvancedStats(null))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    const mgrParam = managerFilter ? `&managerId=${managerFilter}` : '';
    Promise.all([
      api.get(`/properties?page=${page}&limit=${pageSize}${mgrParam}`),
      api.get('/properties/lots'),
      api.get('/subscriptions/me').catch(() => null),
    ])
      .then(([propRes, lotsRes, subData]) => {
        const list = Array.isArray(propRes) ? propRes : propRes?.data || propRes?.items || [];
        setProperties(list);
        if (propRes?.meta) {
          setTotalPages(propRes.meta.totalPages || 1);
          setTotalItems(propRes.meta.total || list.length);
        } else {
          setTotalPages(1);
          setTotalItems(list.length);
        }

        const lotList = Array.isArray(lotsRes) ? lotsRes : [];
        setLots(lotList);
        if (lotList.length > 0) {
          setExpandedLots({ [lotList[0].id]: true });
          const allLotsExpanded: Record<string, boolean> = {};
          lotList.forEach((l: any) => { allLotsExpanded[l.id] = true; });
          setExpandedTableLots(allLotsExpanded);
        }

        if (subData) setSubscription(subData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, pageSize, managerFilter]);

  useEffect(() => {
    if (viewMode === 'stats') {
      loadAdvancedStats(selectedStatsLotId);
    }
  }, [viewMode, selectedStatsLotId]);

  const toggleLotExpansion = (lotId: string) => {
    setExpandedLots(prev => ({
      ...prev,
      [lotId]: !prev[lotId]
    }));
  };

  const formatFcfa = (val: number | string | null | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(num)
      .replace('XOF', 'FCFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Disponible</span>;
      case 'occupied':
        return <span className="badge" style={{ backgroundColor: 'rgba(1, 62, 55, 0.1)', color: 'var(--primary)', fontWeight: '700' }}>Occupé</span>;
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

  const LOT_TYPES = ['building', 'residence', 'lot'];

  const toggleTableLot = (lotId: string) => {
    setExpandedTableLots(prev => ({
      ...prev,
      [lotId]: !prev[lotId]
    }));
  };

  const expandAllTableLots = () => {
    const allLotsMap: Record<string, boolean> = {};
    lots.forEach((l: any) => { allLotsMap[l.id] = true; });
    properties.forEach((p: any) => {
      if (LOT_TYPES.includes(p.type) || (p.children && p.children.length > 0)) {
        allLotsMap[p.id] = true;
      }
    });
    setExpandedTableLots(allLotsMap);
  };

  const collapseAllTableLots = () => {
    setExpandedTableLots({});
  };

  const getActiveTenantName = (prop: any) => {
    if (prop.currentTenant) {
      return `${prop.currentTenant.firstName || ''} ${prop.currentTenant.lastName || ''}`.trim();
    }
    const activeContract = prop.contracts?.find((c: any) => c.status === 'active');
    if (activeContract?.tenantProfile) {
      return `${activeContract.tenantProfile.firstName || ''} ${activeContract.tenantProfile.lastName || ''}`.trim();
    }
    return null;
  };

  const getStructuredTableData = () => {
    const lotMap = new Map<string, any>();

    // 1. Initialiser avec les lots enrichis depuis /properties/lots
    lots.forEach((l: any) => {
      lotMap.set(l.id, {
        ...l,
        isLot: true,
        units: Array.isArray(l.children) ? [...l.children] : [],
      });
    });

    // 2. Vérifier les propriétés chargées depuis /properties
    properties.forEach((p: any) => {
      const isLot = LOT_TYPES.includes(p.type) || (p.children && p.children.length > 0);
      if (isLot && !lotMap.has(p.id)) {
        lotMap.set(p.id, {
          ...p,
          isLot: true,
          units: Array.isArray(p.children) ? [...p.children] : [],
        });
      }
    });

    // 3. Rattacher les unités enfants présentes dans `properties` à leur lot parent
    properties.forEach((p: any) => {
      if (p.parentId && lotMap.has(p.parentId)) {
        const lot = lotMap.get(p.parentId);
        const idx = lot.units.findIndex((u: any) => u.id === p.id);
        if (idx >= 0) {
          lot.units[idx] = { ...lot.units[idx], ...p };
        } else {
          lot.units.push(p);
        }
      }
    });

    // 4. Identifier les biens indépendants (sans parent et pas des lots)
    const standalone: any[] = [];
    properties.forEach((p: any) => {
      const isChildOfLot = Boolean(p.parentId && lotMap.has(p.parentId));
      const isALot = lotMap.has(p.id);
      if (!isChildOfLot && !isALot) {
        standalone.push(p);
      }
    });

    // 5. Filtrage
    const searchLower = search.toLowerCase();

    const filteredLots = Array.from(lotMap.values()).map((lot: any) => {
      const lotMatchesSearch = !search ||
        lot.name?.toLowerCase().includes(searchLower) ||
        lot.address?.toLowerCase().includes(searchLower) ||
        lot.city?.toLowerCase().includes(searchLower);

      const lotMatchesCountry = !countryFilter ||
        lot.country === countryFilter ||
        (countryFilter === 'CI' && (lot.country === 'CI' || lot.country === "Côte d'Ivoire"));

      const lotMatchesManager = !managerFilter || lot.managerId === managerFilter;

      // Filtrer les sous-unités de ce lot
      const matchingUnits = lot.units.filter((u: any) => {
        const unitMatchesSearch = !search ||
          u.name?.toLowerCase().includes(searchLower) ||
          u.address?.toLowerCase().includes(searchLower);

        const unitMatchesType = !typeFilter || u.type === typeFilter;
        const unitMatchesStatus = !statusFilter || u.status === statusFilter;
        const unitMatchesManager = !managerFilter || u.managerId === managerFilter;

        return unitMatchesSearch && unitMatchesType && unitMatchesStatus && unitMatchesManager;
      });

      const hasMatchingUnits = matchingUnits.length > 0;
      const lotTypeMatches = !typeFilter || LOT_TYPES.includes(typeFilter) ? true : hasMatchingUnits;
      const lotStatusMatches = !statusFilter ? true : hasMatchingUnits;

      const isMatching = (lotMatchesSearch || hasMatchingUnits) && lotMatchesCountry && (lotMatchesManager || hasMatchingUnits) && lotTypeMatches && lotStatusMatches;

      return {
        ...lot,
        isMatching,
        displayUnits: (hasMatchingUnits || (lotMatchesSearch && !typeFilter && !statusFilter)) ? matchingUnits : lot.units,
      };
    }).filter((lot: any) => lot.isMatching);

    const filteredStandalone = standalone.filter((p: any) => {
      const matchesSearch = !search ||
        p.name?.toLowerCase().includes(searchLower) ||
        p.address?.toLowerCase().includes(searchLower) ||
        p.city?.toLowerCase().includes(searchLower);

      const matchesType = !typeFilter || p.type === typeFilter;
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesCountry = !countryFilter ||
        p.country === countryFilter ||
        (countryFilter === 'CI' && (p.country === 'CI' || p.country === "Côte d'Ivoire"));
      const matchesManager = !managerFilter || p.managerId === managerFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCountry && matchesManager;
    });

    return {
      lots: filteredLots,
      standalone: filteredStandalone,
    };
  };

  const propQuotaReached = subscription ? Boolean(subscription.quotas?.properties?.reached) : false;
  const lotQuotaReached = subscription ? Boolean(subscription.quotas?.lots?.reached) : false;
  const bothQuotasReached = propQuotaReached && lotQuotaReached;
  const currentPropCount = subscription ? (subscription.quotas?.properties?.used ?? 0) : 0;
  const maxPropLimit = subscription ? (subscription.quotas?.properties?.max ?? 2) : 2;
  const currentLotCount = subscription ? (subscription.quotas?.lots?.used ?? 0) : 0;
  const maxLotLimit = subscription ? (subscription.quotas?.lots?.max ?? 1) : 1;

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement de votre parc immobilier et des lots...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              Gestion des Appartements & Lots
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Structurez vos appartements par immeuble/lot et analysez vos performances consolidées
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {subscription?.quotas && (
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: lotQuotaReached ? '#fef2f2' : '#fef3c7',
                  color: lotQuotaReached ? '#dc2626' : '#92400e',
                  border: `1px solid ${lotQuotaReached ? '#fecaca' : '#fde68a'}`
                }}>
                  Lots : {currentLotCount}/{maxLotLimit >= 9999 ? '∞' : maxLotLimit}
                </span>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  backgroundColor: propQuotaReached ? '#fef2f2' : '#eff6ff',
                  color: propQuotaReached ? '#dc2626' : '#1e40af',
                  border: `1px solid ${propQuotaReached ? '#fecaca' : '#bfdbfe'}`
                }}>
                  Biens : {currentPropCount}/{maxPropLimit >= 9999 ? '∞' : maxPropLimit}
                </span>
              </div>
            )}
            <Link
              href={bothQuotasReached ? '/subscription' : '/properties/create'}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              Nouveau Bien / Lot
            </Link>
          </div>
        </div>

        {/* Quota Alert Banner */}
        {(propQuotaReached || lotQuotaReached) && (
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
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                {bothQuotasReached
                  ? `Quotas atteints : Lots (${currentLotCount}/${maxLotLimit}) & Biens (${currentPropCount}/${maxPropLimit})`
                  : lotQuotaReached
                  ? `Quota de Lots atteint (${currentLotCount}/${maxLotLimit}) — Biens restants : ${Math.max(0, maxPropLimit - currentPropCount)}`
                  : `Quota de Biens atteint (${currentPropCount}/${maxPropLimit}) — Lots restants : ${Math.max(0, maxLotLimit - currentLotCount)}`}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Lots (immeubles/résidences) et Biens (appartements/unités) disposent de quotas distincts dans votre forfait. Surclassez votre abonnement pour augmenter vos capacités.
              </span>
            </div>
            <Link href="/subscription" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
              Surclasser
            </Link>
          </div>
        )}

        {/* View Switcher Controls (Lots vs Liste vs Stats Avancées) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '2px solid var(--border)', paddingBottom: '2px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('lots')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: viewMode === 'lots' ? '800' : '500',
                color: viewMode === 'lots' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: viewMode === 'lots' ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <Building2 size={18} />
              Regroupement par Lot / Immeuble ({lots.length})
            </button>

            <button
              onClick={() => setViewMode('stats')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: viewMode === 'stats' ? '800' : '500',
                color: viewMode === 'stats' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: viewMode === 'stats' ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <BarChart3 size={18} />
              Statistiques Avancées par Lot & Appartement
            </button>

            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '10px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: viewMode === 'list' ? '800' : '500',
                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: viewMode === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <Layers size={18} />
              Vue Liste Standard ({totalItems || properties.length})
            </button>
          </div>
        </div>

        {/* =========================================================================
            MODE 1: VUE REGROUPÉE PAR LOT / IMMEUBLE
        ========================================================================= */}
        {viewMode === 'lots' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {lots.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <Building2 size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                  Aucun Lot ou Immeuble configuré
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 16px' }}>
                  Créez un bien de type <strong>Immeuble</strong>, <strong>Résidence</strong> ou <strong>Lot</strong> pour y regrouper vos appartements.
                </p>
                <Link href="/properties/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Créer un premier Lot / Immeuble
                </Link>
              </div>
            ) : (
              lots.map((lot: any) => {
                const isExpanded = Boolean(expandedLots[lot.id]);
                const units = lot.children || [];
                const occupiedCount = units.filter((u: any) => u.status === 'occupied').length;
                const occupancyRate = units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;
                const totalLotMonthly = units.reduce((acc: number, u: any) => acc + Number(u.rentAmount || 0) + Number(u.chargesAmount || 0), 0);
                const openIncidents = units.reduce((acc: number, u: any) => acc + (u.incidents?.length || 0), 0);

                return (
                  <div 
                    key={lot.id} 
                    className="card"
                    style={{
                      padding: 0,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Lot Header Banner */}
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(1, 62, 55, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)'
                        }}>
                          <Building2 size={26} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                              {lot.name}
                            </h2>
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#475569', textTransform: 'uppercase' }}>
                              {lot.type}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <MapPin size={13} color="var(--primary)" />
                            {lot.address}, {lot.city}
                          </div>

                          {lot.manager && (
                            <div style={{ fontSize: '0.75rem', color: '#013E37', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                              <UserCheck size={13} />
                              Gérant : {lot.manager.firstName} {lot.manager.lastName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lot Summary Metrics & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        
                        {/* Occupancy Indicator */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Occupation</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: occupancyRate >= 80 ? '#059669' : '#d97706' }}>
                            {occupiedCount} / {units.length} ({occupancyRate}%)
                          </div>
                        </div>

                        {/* Total Rent */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Revenus Lot</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--primary)' }}>
                            {formatFcfa(totalLotMonthly)}
                          </div>
                        </div>

                        {/* Open Incidents */}
                        {openIncidents > 0 && (
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Wrench size={12} />
                            {openIncidents} panne{openIncidents > 1 ? 's' : ''}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link 
                            href={`/properties/create?parentId=${lot.id}`}
                            className="btn btn-primary"
                            style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={14} /> Ajouter un appart
                          </Link>

                          <Link 
                            href={`/properties/${lot.id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                          >
                            Fiche du Lot
                          </Link>

                          <button
                            onClick={() => toggleLotExpansion(lot.id)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>

                      </div>
                    </div>

                    {/* Collapsible Units Sub-table */}
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', backgroundColor: '#ffffff' }}>
                        {units.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Aucun appartement n'est encore rattaché à ce lot. Cliquez sur "+ Ajouter un appart" pour en créer un.
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700' }}>APPARTEMENT / PORTE</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700' }}>NIVEAU / SURFACE</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700' }}>STATUT</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700' }}>LOCATAIRE ACTUEL</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700' }}>LOYER MENSUEL</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700' }}>PANNES</th>
                                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700' }}>HISTORIQUE</th>
                                </tr>
                              </thead>
                              <tbody>
                                {units.map((u: any) => {
                                  const activeContract = u.contracts?.[0];
                                  const tenant = activeContract?.tenantProfile;
                                  const activeIncidents = u.incidents?.length || 0;

                                  return (
                                    <tr 
                                      key={u.id}
                                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--primary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <DoorOpen size={16} color="var(--primary)" />
                                          {u.name}
                                        </div>
                                      </td>

                                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                                        {u.floor !== null && u.floor !== undefined ? (u.floor === 0 ? 'RDC' : `${u.floor}ème`) : '-'}
                                        {u.areaSqm ? ` · ${u.areaSqm} m²` : ''}
                                      </td>

                                      <td style={{ padding: '12px 14px' }}>
                                        {getStatusBadge(u.status)}
                                      </td>

                                      <td style={{ padding: '12px 14px' }}>
                                        {tenant ? (
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                              {tenant.firstName} {tenant.lastName}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                              {tenant.phone}
                                            </span>
                                          </div>
                                        ) : (
                                          <span style={{ color: '#10b981', fontWeight: '600', fontStyle: 'italic' }}>
                                            Logement vacant
                                          </span>
                                        )}
                                      </td>

                                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                                        {formatFcfa(Number(u.rentAmount || 0) + Number(u.chargesAmount || 0))}
                                      </td>

                                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                                        {activeIncidents > 0 ? (
                                          <span style={{ color: '#dc2626', fontWeight: '700', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem' }}>
                                            {activeIncidents} active{activeIncidents > 1 ? 's' : ''}
                                          </span>
                                        ) : (
                                          <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: '600' }}>
                                            Aucune ✓
                                          </span>
                                        )}
                                      </td>

                                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                        <Link 
                                          href={`/properties/${u.id}`}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            color: 'var(--primary)',
                                            fontWeight: '700',
                                            textDecoration: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(1, 62, 55, 0.05)'
                                          }}
                                        >
                                          Voir Historique <ExternalLink size={12} />
                                        </Link>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>
        )}

        {/* =========================================================================
            MODE 2: STATISTIQUES AVANCÉES PAR LOT ET PAR APPARTEMENT
        ========================================================================= */}
        {viewMode === 'stats' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Filter Bar for Lot Selection */}
            <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Filtrer les statistiques par Lot / Immeuble :
                </span>
              </div>

              <select
                className="form-control"
                style={{ maxWidth: '320px', fontWeight: '700', color: 'var(--primary)' }}
                value={selectedStatsLotId}
                onChange={(e) => setSelectedStatsLotId(e.target.value)}
              >
                <option value="all">🏢 Tous les Lots consolidés (Vue Globale)</option>
                {lots.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type}) · {l.city}
                  </option>
                ))}
              </select>
            </div>

            {statsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Calcul des statistiques avancées par lot et appartement...
              </div>
            ) : !advancedStats ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Aucune donnée statistique disponible pour ce filtre.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Global or Selected Lot KPI Cards */}
                {(() => {
                  const targetLot = selectedStatsLotId === 'all' 
                    ? null 
                    : advancedStats.lots?.find((l: any) => l.id === selectedStatsLotId);

                  const statsData = targetLot || advancedStats.global;
                  if (!statsData) return null;

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                      
                      {/* KPI 1: Occupancy Rate */}
                      <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          Taux d'Occupation
                        </span>
                        <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                          {statsData.occupancyRate}%
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {statsData.occupiedUnits} occupés sur {statsData.totalUnits} logements
                        </span>
                      </div>

                      {/* KPI 2: Theoretical Monthly Rent */}
                      <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          Potentiel Locatif Mensuel
                        </span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                          {formatFcfa(statsData.totalTheoreticalRent || statsData.theoreticalMonthlyRent)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Somme des loyers et charges
                        </span>
                      </div>

                      {/* KPI 3: Real Collection Rate */}
                      <div className="card" style={{ padding: '18px', borderLeft: '4px solid #0284c7' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          Taux de Recouvrement (Ce Mois)
                        </span>
                        <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0284c7', marginTop: '4px' }}>
                          {statsData.collectionRate}%
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatFcfa(statsData.totalCollectedThisMonth || statsData.collectedThisMonth)} encaissés
                        </span>
                      </div>

                      {/* KPI 4: Overdue / Pending */}
                      <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ea580c' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          Loyers en Retard / Attente
                        </span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ea580c', marginTop: '4px' }}>
                          {formatFcfa(statsData.totalOverdueThisMonth || statsData.overdueThisMonth)}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Règlements à relancer
                        </span>
                      </div>

                      {/* KPI 5: Active Incidents */}
                      <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                          Pannes Actives
                        </span>
                        <div style={{ fontSize: '1.65rem', fontWeight: '800', color: (statsData.totalActiveIncidents || statsData.activeIncidentsCount) > 0 ? '#ef4444' : '#10b981', marginTop: '4px' }}>
                          {statsData.totalActiveIncidents || statsData.activeIncidentsCount}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Interventions techniques en cours
                        </span>
                      </div>

                    </div>
                  );
                })()}

                {/* Analytical Table for Each Lot & Its Apartments */}
                {advancedStats.lots?.map((lot: any) => {
                  if (selectedStatsLotId !== 'all' && lot.id !== selectedStatsLotId) {
                    return null;
                  }

                  const units = lot.units || [];

                  return (
                    <div key={lot.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
                            {lot.name} · Détail analytique des {units.length} appartements
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lot.address}, {lot.city} · Taux d'occupation : <strong>{lot.occupancyRate}%</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Encaissé : <strong style={{ color: '#059669' }}>{formatFcfa(lot.totalCollectedThisMonth)}</strong>
                          </span>
                          <span>•</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            Attente : <strong style={{ color: '#d97706' }}>{formatFcfa(lot.totalOverdueThisMonth)}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700' }}>APPARTEMENT</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700' }}>ÉTAGE & SURFACE</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700' }}>STATUT</th>
                              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700' }}>LOCATAIRE EN PLACE</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>LOYER TOTAL</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700' }}>PAIEMENT DU MOIS</th>
                              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700' }}>PANNES</th>
                              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>HISTORIQUE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {units.length === 0 ? (
                              <tr>
                                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  Aucun appartement dans ce lot.
                                </td>
                              </tr>
                            ) : (
                              units.map((u: any) => (
                                <tr 
                                  key={u.id}
                                  style={{ borderBottom: '1px solid #f1f5f9' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--primary)' }}>
                                    {u.name}
                                  </td>

                                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                    {u.floor !== null && u.floor !== undefined ? (u.floor === 0 ? 'RDC' : `${u.floor}ème`) : '-'}
                                    {u.areaSqm ? ` · ${u.areaSqm} m²` : ''}
                                  </td>

                                  <td style={{ padding: '12px 16px' }}>
                                    {getStatusBadge(u.status)}
                                  </td>

                                  <td style={{ padding: '12px 16px' }}>
                                    {u.currentTenant ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                                          {u.currentTenant.firstName?.[0]}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                            {u.currentTenant.firstName} {u.currentTenant.lastName}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            Fiabilité : {u.currentTenant.reliabilityScore || 100}/100
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span style={{ color: '#10b981', fontWeight: '600', fontStyle: 'italic' }}>
                                        Vacant
                                      </span>
                                    )}
                                  </td>

                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                                    {formatFcfa(u.totalMonthly)}
                                  </td>

                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {u.status === 'occupied' ? (
                                      u.isCurrentMonthPaid ? (
                                        <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                          Réglé ✓
                                        </span>
                                      ) : (
                                        <span style={{ backgroundColor: '#fffbeb', color: '#d97706', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                          En attente ⏳
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>-</span>
                                    )}
                                  </td>

                                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    {u.openIncidentsCount > 0 ? (
                                      <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                                        {u.openIncidentsCount} en cours
                                      </span>
                                    ) : (
                                      <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: '600' }}>0 ✓</span>
                                    )}
                                  </td>

                                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <Link 
                                      href={`/properties/${u.id}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--primary)',
                                        fontWeight: '700',
                                        textDecoration: 'none',
                                        fontSize: '0.78rem'
                                      }}
                                    >
                                      Fiche Historique →
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            MODE 3: VUE LISTE STANDARD
        ========================================================================= */}
        {viewMode === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
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
                <option value="lot">Lot / Ensemble</option>
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

              <select
                className="form-control"
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
              >
                <option value="">Tous les gestionnaires</option>
                {managers.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Toolbar Hiérarchie Lots & Appartements */}
            {(() => {
              const structured = getStructuredTableData();
              const totalLotsCount = structured.lots.length;
              const totalUnitsInLots = structured.lots.reduce((acc: number, l: any) => acc + (l.displayUnits?.length || 0), 0);
              const totalStandaloneCount = structured.standalone.length;

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '0 4px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} color="var(--primary)" />
                    <span>
                      Vue Hiérarchique : <strong>{totalLotsCount} lot(s)</strong> ({totalUnitsInLots} appartement{totalUnitsInLots > 1 ? 's' : ''} regroupé{totalUnitsInLots > 1 ? 's' : ''})
                      {totalStandaloneCount > 0 && ` et ${totalStandaloneCount} bien(s) indépendant(s)`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={expandAllTableLots}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ChevronDown size={14} /> Tout déplier
                    </button>
                    <button
                      type="button"
                      onClick={collapseAllTableLots}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ChevronUp size={14} /> Tout replier
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Properties List - Hierarchical SaaS Table Layout */}
            <div className="card" style={{ padding: 0, overflowX: 'auto', border: 'none', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)' }}>
              {(() => {
                const structured = getStructuredTableData();
                const hasResults = structured.lots.length > 0 || structured.standalone.length > 0;

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                        <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', width: '38%' }}>
                          LOTS (IMMEUBLES) & APPARTEMENTS
                        </th>
                        <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', width: '22%' }}>
                          LOCALISATION & ADRESSE
                        </th>
                        <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', width: '16%' }}>
                          STATUT / OCCUPATION
                        </th>
                        <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right', width: '12%' }}>
                          LOYER (MENSUEL)
                        </th>
                        <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'right', width: '12%' }}>
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {!hasResults ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <Building2 size={36} color="var(--primary)" style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                              Aucun lot ou bien ne correspond à vos filtres de recherche.
                            </div>
                            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                              Modifiez vos critères ou réinitialisez les filtres.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* 1. SECTION DES LOTS ET DE LEURS APPARTEMENTS */}
                          {structured.lots.map((lot: any) => {
                            const isExpanded = Boolean(expandedTableLots[lot.id]);
                            const units = lot.displayUnits || lot.units || [];
                            const occupiedCount = units.filter((u: any) => u.status === 'occupied').length;
                            const occupancyRate = units.length > 0 ? Math.round((occupiedCount / units.length) * 100) : 0;
                            const totalRent = units.reduce((sum: number, u: any) => sum + Number(u.rentAmount || 0), 0);
                            const totalCharges = units.reduce((sum: number, u: any) => sum + Number(u.chargesAmount || 0), 0);

                            return (
                              <React.Fragment key={`lot-group-${lot.id}`}>
                                {/* Ligne Principale : Lot / Immeuble Parent */}
                                <tr 
                                  style={{ 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid #e2e8f0', 
                                    borderLeft: '4px solid #013E37',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                >
                                  {/* Colonne Bien/Lot */}
                                  <td style={{ padding: '14px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <button
                                        type="button"
                                        onClick={() => toggleTableLot(lot.id)}
                                        style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '6px',
                                          border: '1px solid #cbd5e1',
                                          backgroundColor: '#ffffff',
                                          color: '#013E37',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: 0,
                                          flexShrink: 0
                                        }}
                                        title={isExpanded ? 'Replier les appartements' : 'Déplier les appartements'}
                                      >
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                      </button>

                                      <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(1, 62, 55, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#013E37',
                                        flexShrink: 0
                                      }}>
                                        <Building2 size={20} />
                                      </div>

                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                                            {lot.name}
                                          </span>
                                          <span style={{
                                            fontSize: '0.675rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: '#013E37',
                                            color: '#FFFFFF',
                                            textTransform: 'uppercase'
                                          }}>
                                            {lot.type || 'LOT'}
                                          </span>
                                          <span style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: '#E2E8F0',
                                            color: '#334155'
                                          }}>
                                            {units.length} unité{units.length > 1 ? 's' : ''}
                                          </span>
                                        </div>

                                        {lot.manager && (
                                          <div style={{ fontSize: '0.72rem', color: '#013E37', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <UserCheck size={12} />
                                            Gestionnaire : {lot.manager.firstName} {lot.manager.lastName}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Colonne Localisation */}
                                  <td style={{ padding: '14px 20px' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <MapPin size={14} style={{ color: '#013E37', flexShrink: 0 }} />
                                      <span style={{ fontWeight: 500 }}>{lot.address}</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '20px', marginTop: '2px' }}>
                                      {lot.city} • {lot.country || 'Côte d\'Ivoire'}
                                    </div>
                                  </td>

                                  {/* Colonne Statut Consolidé */}
                                  <td style={{ padding: '14px 20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: occupancyRate === 100 ? '#166534' : '#013E37' }}>
                                        {occupiedCount}/{units.length} Occupé{occupiedCount > 1 ? 's' : ''} ({occupancyRate}%)
                                      </span>
                                      <div style={{ width: '90px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${occupancyRate}%`, height: '100%', backgroundColor: occupancyRate === 100 ? '#16A34A' : '#013E37', borderRadius: '3px' }} />
                                      </div>
                                    </div>
                                  </td>

                                  {/* Colonne Loyer Consolidé */}
                                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#013E37' }}>
                                      {formatFcfa(totalRent)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                      Loyer consolidé
                                    </div>
                                    {totalCharges > 0 && (
                                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                        + {formatFcfa(totalCharges)} ch.
                                      </div>
                                    )}
                                  </td>

                                  {/* Colonne Actions Lot */}
                                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                      <Link 
                                        href={`/properties/create?lotId=${lot.id}`} 
                                        className="btn btn-secondary" 
                                        style={{ padding: '5px 10px', fontSize: '0.75rem', backgroundColor: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: '#013E37', color: '#013E37', fontWeight: 600 }}
                                      >
                                        <Plus size={12} /> Unité
                                      </Link>
                                      <Link 
                                        href={`/properties/${lot.id}`} 
                                        className="btn btn-secondary" 
                                        style={{ padding: '5px 10px', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                                      >
                                        Détails Lot
                                      </Link>
                                      <Link 
                                        href={`/properties/${lot.id}/edit`} 
                                        className="btn btn-secondary" 
                                        style={{ padding: '5px 10px', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                                      >
                                        Éditer
                                      </Link>
                                    </div>
                                  </td>
                                </tr>

                                {/* Sous-lignes : Appartements et Unités du Lot */}
                                {isExpanded && (
                                  units.length === 0 ? (
                                    <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                                      <td colSpan={5} style={{ padding: '12px 20px 12px 58px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                        Aucun appartement ou unité n'est encore rattaché à cet immeuble. Cliquez sur « + Unité » pour en ajouter.
                                      </td>
                                    </tr>
                                  ) : (
                                    units.map((u: any) => {
                                      const tenantName = getActiveTenantName(u);

                                      return (
                                        <tr 
                                          key={`unit-${u.id}`}
                                          style={{ 
                                            backgroundColor: '#ffffff', 
                                            borderBottom: '1px solid #f1f5f9',
                                            borderLeft: '4px solid rgba(1, 62, 55, 0.25)',
                                            transition: 'background-color 0.12s ease'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                        >
                                          {/* Appartement / Unité Indentée */}
                                          <td style={{ padding: '12px 20px 12px 48px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                              <span style={{ color: '#013E37', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>└─</span>
                                              <div style={{ 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '6px', 
                                                backgroundColor: '#F1F5F9', 
                                                color: '#013E37', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                flexShrink: 0
                                              }}>
                                                <DoorOpen size={16} />
                                              </div>
                                              <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                    {u.name}
                                                  </span>
                                                  <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 600, 
                                                    padding: '1px 6px', 
                                                    borderRadius: '4px', 
                                                    backgroundColor: '#F1F5F9', 
                                                    color: '#475569', 
                                                    textTransform: 'uppercase' 
                                                  }}>
                                                    {u.type}
                                                  </span>
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                                  {u.floor !== null && u.floor !== undefined ? (u.floor === 0 ? 'RDC' : `${u.floor}ème étage`) : ''}
                                                  {u.areaSqm ? ` · ${u.areaSqm} m²` : ''}
                                                  {u.rooms ? ` · ${u.rooms} pièce${u.rooms > 1 ? 's' : ''}` : ''}
                                                </div>
                                              </div>
                                            </div>
                                          </td>

                                          {/* Localisation / Rattachement */}
                                          <td style={{ padding: '12px 20px' }}>
                                            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                                              Rattaché à : <strong style={{ color: '#334155' }}>{lot.name}</strong>
                                            </div>
                                          </td>

                                          {/* Statut de l'Appartement */}
                                          <td style={{ padding: '12px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                              {getStatusBadge(u.status)}
                                              {tenantName && (
                                                <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
                                                  ({tenantName})
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Loyer de l'Appartement */}
                                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                                              {u.rentAmount ? formatFcfa(Number(u.rentAmount)) : '-'}
                                            </div>
                                            {u.chargesAmount && Number(u.chargesAmount) > 0 && (
                                              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                                                + {formatFcfa(Number(u.chargesAmount))} ch.
                                              </div>
                                            )}
                                          </td>

                                          {/* Actions Unité */}
                                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                              {u.status === 'available' && (
                                                <Link 
                                                  href={`/contracts/create?propertyId=${u.id}`} 
                                                  className="btn btn-secondary" 
                                                  style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0', fontWeight: 700 }}
                                                >
                                                  Louer
                                                </Link>
                                              )}
                                              <Link 
                                                href={`/properties/${u.id}`} 
                                                className="btn btn-secondary" 
                                                style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                                              >
                                                Fiche
                                              </Link>
                                              <Link 
                                                href={`/properties/${u.id}/edit`} 
                                                className="btn btn-secondary" 
                                                style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#ffffff' }}
                                              >
                                                Éditer
                                              </Link>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )
                                )}
                              </React.Fragment>
                            );
                          })}

                          {/* 2. SECTION DES BIENS INDÉPENDANTS (SANS IMMEUBLE PARENT) */}
                          {structured.standalone.map((p: any) => (
                            <tr 
                              key={`standalone-${p.id}`} 
                              style={{ 
                                borderBottom: '1px solid var(--border)', 
                                backgroundColor: '#ffffff',
                                transition: 'background-color 0.15s ease' 
                              }} 
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} 
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                            >
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <Building2 size={20} />
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</span>
                                      <span style={{ fontSize: '0.675rem', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', textTransform: 'uppercase' }}>
                                        {p.type} (Indépendant)
                                      </span>
                                    </div>
                                    {p.manager && (
                                      <div style={{ fontSize: '0.72rem', color: '#013E37', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <UserCheck size={12} />
                                        {p.manager.firstName} {p.manager.lastName}
                                      </div>
                                    )}
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
                                    + {formatFcfa(Number(p.chargesAmount))} charges
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <Link href={`/properties/${p.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}>
                                    Historique & Détails
                                  </Link>
                                  <Link href={`/properties/${p.id}/edit`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ffffff' }}>
                                    Éditer
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                );
              })()}
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
        )}

      </div>
    </Layout>
  );
}
