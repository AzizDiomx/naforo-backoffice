'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Filter,
  Plus,
  Edit3,
  Eye,
  Copy,
  Check,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin,
  Gem,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Clock,
  Sparkles,
  Home,
  CheckCheck,
  AlertCircle
} from 'lucide-react';

interface OrgCount {
  users: number;
  properties: number;
  contracts: number;
  tenantProfiles: number;
  payments: number;
  invoices: number;
}

interface SubscriptionInfo {
  id: string;
  status: string;
  startDate?: string;
  endDate?: string;
  plan?: {
    id: string;
    code: string;
    name: string;
    priceMonthlyXof: number;
  };
}

interface OrganizationItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  plan: string;
  isActive: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
  _count?: OrgCount;
  subscriptions?: SubscriptionInfo[];
  users?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
}

interface OrgStats {
  users: number;
  properties: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    occupancyRate: number;
  };
  tenants: number;
  contracts: {
    total: number;
    active: number;
  };
  payments: {
    validatedCount: number;
    totalCollectedAmount: number;
  };
  invoices: {
    pendingCount: number;
    pendingAmount: number;
    overdueCount: number;
    overdueAmount: number;
    paidCount: number;
    paidAmount: number;
  };
  subscription: {
    id: string;
    planName: string;
    planCode: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'grace'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals & Panels
  const [selectedOrgForStats, setSelectedOrgForStats] = useState<OrganizationItem | null>(null);
  const [statsData, setStatsData] = useState<OrgStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Abidjan',
    country: 'CI',
    address: '',
    plan: 'starter'
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    country: 'CI',
    address: '',
    plan: 'starter',
    isActive: true
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Backend returns { success: true, data: Organization[], meta: ... }
      const res = await api.get('/organizations?limit=100');
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      setOrganizations(list);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de charger la liste des organisations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Identifiant copié !', { duration: 1500 });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  // Open Stats Drawer / Modal
  const handleOpenStats = async (org: OrganizationItem) => {
    setSelectedOrgForStats(org);
    setStatsLoading(true);
    setStatsData(null);

    try {
      // 1. Fetch detailed stats
      const statsRes = await api.get(`/organizations/${org.id}/stats`);
      setStatsData(statsRes);

      // 2. Refresh org details including users
      const detailsRes = await api.get(`/organizations/${org.id}`);
      if (detailsRes) {
        setSelectedOrgForStats(detailsRes);
      }
    } catch (err: any) {
      toast.error('Erreur lors du chargement des statistiques détaillées.');
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle Toggle Active/Suspend
  const handleToggleActive = async (org: OrganizationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const actionName = org.isActive ? 'suspendre' : 'réactiver';
    if (!confirm(`Voulez-vous vraiment ${actionName} l'organisation "${org.name}" ?`)) {
      return;
    }

    try {
      await api.put(`/organizations/${org.id}`, { isActive: !org.isActive });
      toast.success(`Organisation ${org.isActive ? 'suspendue' : 'réactivée'} avec succès !`);
      setOrganizations(prev =>
        prev.map(item => (item.id === org.id ? { ...item, isActive: !item.isActive } : item))
      );
      if (selectedOrgForStats && selectedOrgForStats.id === org.id) {
        setSelectedOrgForStats(prev => (prev ? { ...prev, isActive: !prev.isActive } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Échec de la modification du statut.');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (org: OrganizationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingOrg(org);
    setEditForm({
      name: org.name || '',
      email: org.email || '',
      phone: org.phone || '',
      city: org.city || 'Abidjan',
      country: org.country || 'CI',
      address: org.address || '',
      plan: org.plan || 'starter',
      isActive: org.isActive
    });
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    setEditLoading(true);
    try {
      const updated = await api.put(`/organizations/${editingOrg.id}`, editForm);
      toast.success('Organisation mise à jour avec succès !');
      setOrganizations(prev =>
        prev.map(item => (item.id === editingOrg.id ? { ...item, ...updated, ...editForm } : item))
      );
      if (selectedOrgForStats && selectedOrgForStats.id === editingOrg.id) {
        setSelectedOrgForStats(prev => (prev ? { ...prev, ...updated, ...editForm } : null));
      }
      setEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Create Form
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Veuillez saisir un nom d'organisation.");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await api.post('/organizations', createForm);
      toast.success('Organisation créée avec succès !');
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        phone: '',
        city: 'Abidjan',
        country: 'CI',
        address: '',
        plan: 'starter'
      });
      fetchOrganizations(true);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création de l'organisation.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (organizations.length === 0) {
      toast.error('Aucune organisation à exporter.');
      return;
    }

    const headers = [
      'ID',
      'Nom',
      'Email',
      'Téléphone',
      'Ville',
      'Pays',
      'Formule',
      'Statut',
      'Biens',
      'Locataires',
      'Baux Actifs',
      'Utilisateurs',
      'Date Création'
    ];

    const rows = organizations.map(o => [
      o.id,
      `"${(o.name || '').replace(/"/g, '""')}"`,
      `"${o.email || ''}"`,
      `"${o.phone || ''}"`,
      `"${o.city || ''}"`,
      o.country || 'CI',
      o.plan || 'starter',
      o.isActive ? 'Actif' : 'Suspendu',
      o._count?.properties ?? 0,
      o._count?.tenantProfiles ?? 0,
      o._count?.contracts ?? 0,
      o._count?.users ?? 0,
      new Date(o.createdAt).toLocaleDateString('fr-FR')
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `naforo_organisations_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Fichier CSV exporté avec succès !');
  };

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter(o => o.isActive).length;
    const suspended = organizations.filter(o => !o.isActive).length;
    const pendingDeletion = organizations.filter(
      o => o.settings?.deletionRequested === true
    ).length;

    const totalProperties = organizations.reduce(
      (acc, o) => acc + (o._count?.properties || 0),
      0
    );
    const totalContracts = organizations.reduce(
      (acc, o) => acc + (o._count?.contracts || 0),
      0
    );
    const totalTenants = organizations.reduce(
      (acc, o) => acc + (o._count?.tenantProfiles || 0),
      0
    );

    const starterCount = organizations.filter(
      o => (o.plan || 'starter').toLowerCase() === 'starter'
    ).length;
    const proCount = organizations.filter(
      o => (o.plan || '').toLowerCase() === 'pro'
    ).length;
    const expertCount = organizations.filter(o => {
      const p = (o.plan || '').toLowerCase();
      return p.includes('expert') || p.includes('agency') || p.includes('enterprise');
    }).length;

    return {
      total,
      active,
      suspended,
      pendingDeletion,
      totalProperties,
      totalContracts,
      totalTenants,
      starterCount,
      proCount,
      expertCount
    };
  }, [organizations]);

  // Filtered List
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = org.name?.toLowerCase().includes(q);
        const matchesEmail = org.email?.toLowerCase().includes(q);
        const matchesPhone = org.phone?.toLowerCase().includes(q);
        const matchesCity = org.city?.toLowerCase().includes(q);
        const matchesId = org.id?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCity && !matchesId) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'active' && !org.isActive) return false;
      if (statusFilter === 'suspended' && org.isActive) return false;
      if (statusFilter === 'grace' && !org.settings?.deletionRequested) return false;

      // Plan
      if (planFilter !== 'all') {
        const p = (org.plan || 'starter').toLowerCase();
        if (planFilter === 'expert') {
          if (!p.includes('expert') && !p.includes('agency') && !p.includes('enterprise')) {
            return false;
          }
        } else if (p !== planFilter) {
          return false;
        }
      }

      // Country
      if (countryFilter !== 'all' && (org.country || 'CI') !== countryFilter) {
        return false;
      }

      return true;
    });
  }, [organizations, search, statusFilter, planFilter, countryFilter]);

  const getCountryFlag = (countryCode: string) => {
    const code = (countryCode || 'CI').toUpperCase();
    const flags: Record<string, string> = {
      CI: '🇨🇮',
      SN: '🇸🇳',
      ML: '🇲🇱',
      BF: '🇧🇫',
      GN: '🇬🇳',
      BJ: '🇧🇯',
      TG: '🇹🇬',
      CM: '🇨🇲',
      GA: '🇬🇦',
      CG: '🇨🇬',
      FR: '🇫🇷'
    };
    return flags[code] || '🌍';
  };

  const renderPlanBadge = (planCode: string) => {
    const p = (planCode || 'starter').toLowerCase();
    if (p.includes('expert') || p.includes('agency') || p.includes('enterprise')) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '700',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.3)'
          }}
        >
          <Gem size={12} />
          Expert / Agence
        </span>
      );
    }
    if (p === 'pro') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '700',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}
        >
          <Sparkles size={12} />
          Pro / Sérénité
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: '700',
          backgroundColor: 'rgba(148, 163, 184, 0.12)',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }}
      >
        <Building2 size={12} />
        Starter
      </span>
    );
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '60px' }}>
        
        {/* TOP HEADER */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 239, 179, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}
              >
                <Building2 size={20} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                Gestion des Organisations
              </h1>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}
              >
                Super Admin
              </span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.875rem', margin: 0 }}>
              Supervision multi-tenants, affectation des plans, analyse d'activité et statistiques en temps réel.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchOrganizations(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>

            <button
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 15px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Download size={15} />
              Exporter CSV
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--accent)',
                border: 'none',
                color: '#013e37',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 239, 179, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle Organisation
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {/* Total Orgs */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Organisations
              </span>
              <Building2 size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
              {kpis.total}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', marginTop: '4px' }}>
              <span style={{ color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                {kpis.active} actives
              </span>
              {kpis.suspended > 0 && (
                <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f87171' }}></span>
                  {kpis.suspended} suspendues
                </span>
              )}
            </div>
          </div>

          {/* Properties Count */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Biens Immobiliers
              </span>
              <Home size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
              {kpis.totalProperties}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              Logements & locaux gérés
            </span>
          </div>

          {/* Active Contracts */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contrats de Bail
              </span>
              <FileText size={18} style={{ color: '#a78bfa' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff' }}>
              {kpis.totalContracts}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              Pour {kpis.totalTenants} locataires enregistrés
            </span>
          </div>

          {/* Plan Breakdown */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Formules Actives
              </span>
              <Gem size={18} style={{ color: '#fbbf24' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fbbf24' }}>
                {kpis.proCount} Pro
              </span>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.4)' }}>/</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#c084fc' }}>
                {kpis.expertCount} Exp
              </span>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.4)' }}>/</span>
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#cbd5e1' }}>
                {kpis.starterCount} St
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.55)' }}>
              Répartition des abonnements
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 260px',
                minWidth: '220px'
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.8125rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0a2e29' }}>Tous les statuts</option>
              <option value="active" style={{ backgroundColor: '#0a2e29' }}>Actives uniquement</option>
              <option value="suspended" style={{ backgroundColor: '#0a2e29' }}>Suspendues uniquement</option>
              <option value="grace" style={{ backgroundColor: '#0a2e29' }}>En délai de rétractation (30j)</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0a2e29' }}>Toutes les formules</option>
              <option value="starter" style={{ backgroundColor: '#0a2e29' }}>Starter (Gratuit)</option>
              <option value="pro" style={{ backgroundColor: '#0a2e29' }}>Pro / Sérénité</option>
              <option value="expert" style={{ backgroundColor: '#0a2e29' }}>Expert / Agence</option>
            </select>

            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all" style={{ backgroundColor: '#0a2e29' }}>Tous les pays</option>
              <option value="CI" style={{ backgroundColor: '#0a2e29' }}>🇨🇮 Côte d'Ivoire</option>
              <option value="SN" style={{ backgroundColor: '#0a2e29' }}>🇸🇳 Sénégal</option>
              <option value="ML" style={{ backgroundColor: '#0a2e29' }}>🇲🇱 Mali</option>
              <option value="BF" style={{ backgroundColor: '#0a2e29' }}>🇧🇫 Burkina Faso</option>
              <option value="GN" style={{ backgroundColor: '#0a2e29' }}>🇬🇳 Guinée</option>
              <option value="FR" style={{ backgroundColor: '#0a2e29' }}>🇫🇷 France</option>
            </select>
          </div>

          {/* View Toggle & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              {filteredOrganizations.length} organisation{filteredOrganizations.length > 1 ? 's' : ''}
            </span>
            <div
              style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'table' ? '#013e37' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'cards' ? 'var(--accent)' : 'transparent',
                  color: viewMode === 'cards' ? '#013e37' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Cartes
              </button>
            </div>
          </div>
        </div>

        {/* ORGANIZATIONS LIST (TABLE OR CARDS) */}
        {loading ? (
          <div
            style={{
              padding: '60px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--accent)' }} />
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
              Chargement des organisations en cours...
            </p>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <Building2 size={36} style={{ margin: '0 auto 16px', color: 'rgba(255, 255, 255, 0.3)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
              Aucune organisation trouvée
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px' }}>
              {search || statusFilter !== 'all' || planFilter !== 'all'
                ? "Aucune organisation ne correspond aux filtres appliqués. Essayez d'élargir votre recherche."
                : 'Aucune organisation enregistrée sur la plateforme pour le moment.'}
            </p>
            {(search || statusFilter !== 'all' || planFilter !== 'all' || countryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPlanFilter('all');
                  setCountryFilter('all');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Organisation & Pays
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Contact
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Formule
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Statut
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Biens / Baux
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                      Équipe
                    </th>
                    <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.map(org => {
                    const isDeletionPending = org.settings?.deletionRequested === true;
                    return (
                      <tr
                        key={org.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {/* Name & Country */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(255, 239, 179, 0.12)',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '0.95rem'
                              }}
                            >
                              {org.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff' }}>
                                  {org.name}
                                </span>
                                <span title={org.country || 'CI'} style={{ fontSize: '1rem' }}>
                                  {getCountryFlag(org.country)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                                  {org.city || 'Abidjan'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.25)' }}>•</span>
                                <button
                                  onClick={() => copyToClipboard(org.id, org.id)}
                                  title="Copier l'identifiant ID"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    background: 'none',
                                    border: 'none',
                                    color: copiedId === org.id ? '#4ade80' : 'rgba(255, 255, 255, 0.4)',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {copiedId === org.id ? <Check size={11} /> : <Copy size={11} />}
                                  {org.id.slice(0, 8)}...
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {org.email ? (
                              <a
                                href={`mailto:${org.email}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.78rem',
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  textDecoration: 'none'
                                }}
                              >
                                <Mail size={12} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                                {org.email}
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.35)' }}>
                                Aucun email
                              </span>
                            )}

                            {org.phone && (
                              <a
                                href={`tel:${org.phone}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.55)',
                                  textDecoration: 'none'
                                }}
                              >
                                <Phone size={11} style={{ color: 'rgba(255, 255, 255, 0.35)' }} />
                                {org.phone}
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Plan */}
                        <td style={{ padding: '16px 18px' }}>
                          {renderPlanBadge(org.plan)}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px' }}>
                          {isDeletionPending ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                              }}
                            >
                              <AlertTriangle size={11} />
                              Rétractation (30j)
                            </span>
                          ) : org.isActive ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.25)'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
                              Actif
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                              }}
                            >
                              <Lock size={11} />
                              Suspendu
                            </span>
                          )}
                        </td>

                        {/* Properties / Contracts Stats */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 7px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                              title="Biens immobiliers"
                            >
                              <Home size={12} />
                              {org._count?.properties ?? 0}
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 7px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                                color: '#a78bfa',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}
                              title="Baux en cours"
                            >
                              <FileText size={12} />
                              {org._count?.contracts ?? 0}
                            </span>
                          </div>
                        </td>

                        {/* Users / Team */}
                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.78rem',
                              color: 'rgba(255, 255, 255, 0.75)',
                              fontWeight: '600'
                            }}
                          >
                            <Users size={13} style={{ color: 'rgba(255, 255, 255, 0.45)' }} />
                            {org._count?.users ?? 0} membre{(org._count?.users ?? 0) > 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenStats(org)}
                              title="Consulter les statistiques complètes de l'organisation"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 11px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 239, 179, 0.12)',
                                border: '1px solid rgba(255, 239, 179, 0.25)',
                                color: 'var(--accent)',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <BarChart3 size={13} />
                              Stats & Bilan
                            </button>

                            <button
                              onClick={e => handleOpenEdit(org, e)}
                              title="Modifier les informations"
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={e => handleToggleActive(org, e)}
                              title={org.isActive ? 'Suspendre cette organisation' : 'Réactiver cette organisation'}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '8px',
                                backgroundColor: org.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                border: `1px solid ${org.isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                                color: org.isActive ? '#f87171' : '#4ade80',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {org.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARDS VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {filteredOrganizations.map(org => {
              const isDeletionPending = org.settings?.deletionRequested === true;
              return (
                <div
                  key={org.id}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 239, 179, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 239, 179, 0.12)',
                            color: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '1rem'
                          }}
                        >
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                              {org.name}
                            </h3>
                            <span style={{ fontSize: '1rem' }}>{getCountryFlag(org.country)}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                            {org.city || 'Abidjan'} • Créée le {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                      {renderPlanBadge(org.plan)}
                      {isDeletionPending ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#fca5a5'
                          }}
                        >
                          Rétractation (30j)
                        </span>
                      ) : org.isActive ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            color: '#4ade80'
                          }}
                        >
                          Actif
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171'
                          }}
                        >
                          Suspendu
                        </span>
                      )}
                    </div>

                    {/* Contact snippet */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      {org.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                          {org.email}
                        </span>
                      )}
                      {org.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                          {org.phone}
                        </span>
                      )}
                    </div>

                    {/* Stats pills */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        marginTop: '14px',
                        textAlign: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#38bdf8' }}>
                          {org._count?.properties ?? 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>Biens</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#a78bfa' }}>
                          {org._count?.contracts ?? 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>Baux</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#4ade80' }}>
                          {org._count?.users ?? 0}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>Membres</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      onClick={() => handleOpenStats(org)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 239, 179, 0.12)',
                        border: '1px solid rgba(255, 239, 179, 0.25)',
                        color: 'var(--accent)',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      <BarChart3 size={14} />
                      Bilan & Stats
                    </button>
                    <button
                      onClick={e => handleOpenEdit(org, e)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={e => handleToggleActive(org, e)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: org.isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${org.isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                        color: org.isActive ? '#f87171' : '#4ade80',
                        cursor: 'pointer'
                      }}
                    >
                      {org.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: STATS & DETAILS DRAWER / MODAL */}
        {selectedOrgForStats && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedOrgForStats(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#05221e',
                borderRadius: '20px',
                border: '1px solid rgba(255, 239, 179, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(255, 239, 179, 0.15)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1.25rem'
                    }}
                  >
                    {selectedOrgForStats.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                        {selectedOrgForStats.name}
                      </h2>
                      <span style={{ fontSize: '1.2rem' }}>{getCountryFlag(selectedOrgForStats.country)}</span>
                      {renderPlanBadge(selectedOrgForStats.plan)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      <span>{selectedOrgForStats.city || 'Abidjan'}, {selectedOrgForStats.country || 'CI'}</span>
                      <span>•</span>
                      <span>ID: <code style={{ color: 'var(--accent)' }}>{selectedOrgForStats.id}</code></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrgForStats(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {statsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent)' }} />
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>Calcul des statistiques de l'organisation...</p>
                </div>
              ) : statsData ? (
                <>
                  {/* METRICS ROW 1 : PATRIMOINE & OCCUPATION */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      1. Parc Immobilier & Taux d'Occupation
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Total Biens</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff' }}>
                          {statsData.properties.total}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Biens Occupés</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#4ade80' }}>
                          {statsData.properties.occupied}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Vacants / Dispos</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38bdf8' }}>
                          {statsData.properties.available}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Taux d'Occupation</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent)' }}>
                          {statsData.properties.occupancyRate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* METRICS ROW 2 : FINANCES & LOYERS */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      2. Flux Financiers & Recouvrement
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      {/* Total Encaissé */}
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#86efac', fontWeight: '600' }}>Total Loyers Validés & Encaissés</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#4ade80', marginTop: '4px' }}>
                          {formatFcfa(statsData.payments.totalCollectedAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {statsData.payments.validatedCount} paiement(s) validé(s)
                        </span>
                      </div>

                      {/* Impayés / Retards */}
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: '600' }}>Factures en Retard / Impayées</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#f87171', marginTop: '4px' }}>
                          {formatFcfa(statsData.invoices.overdueAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {statsData.invoices.overdueCount} facture(s) en souffrance
                        </span>
                      </div>

                      {/* En attente */}
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: '600' }}>Factures en Attente d'Échéance</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>
                          {formatFcfa(statsData.invoices.pendingAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {statsData.invoices.pendingCount} facture(s) en cours
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* METRICS ROW 3 : BAUX & LOCATAIRES */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      3. Locataires & Baux
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Locataires Inscrits</span>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff' }}>
                          {statsData.tenants}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Contrats Actifs</span>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#a78bfa' }}>
                          {statsData.contracts.active}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.5)' }}>Historique Baux</span>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#cbd5e1' }}>
                          {statsData.contracts.total}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* USERS / TEAM LIST */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      4. Membres de l'Équipe ({selectedOrgForStats.users?.length ?? statsData.users})
                    </h4>
                    {selectedOrgForStats.users && selectedOrgForStats.users.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                        {selectedOrgForStats.users.map(u => (
                          <div
                            key={u.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  color: '#ffffff'
                                }}
                              >
                                {u.firstName.slice(0, 1)}
                                {u.lastName.slice(0, 1)}
                              </div>
                              <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>
                                  {u.firstName} {u.lastName}
                                </span>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                                  {u.email} {u.phone ? `• ${u.phone}` : ''}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.7rem',
                                  fontWeight: '700',
                                  backgroundColor: 'rgba(255, 239, 179, 0.1)',
                                  color: 'var(--accent)',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {u.role}
                              </span>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: u.isActive ? '#4ade80' : '#f87171'
                                }}
                                title={u.isActive ? 'Compte actif' : 'Compte inactif'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                        Aucun utilisateur spécifique listé.
                      </p>
                    )}
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px' }}>
                    <button
                      onClick={() => {
                        handleOpenEdit(selectedOrgForStats);
                        setSelectedOrgForStats(null);
                      }}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Modifier l'organisation
                    </button>
                    <button
                      onClick={() => handleToggleActive(selectedOrgForStats)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        backgroundColor: selectedOrgForStats.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        border: `1px solid ${selectedOrgForStats.isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`,
                        color: selectedOrgForStats.isActive ? '#fca5a5' : '#86efac',
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {selectedOrgForStats.isActive ? 'Suspendre cette organisation' : 'Réactiver cette organisation'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* MODAL 2: CREATE ORGANIZATION MODAL */}
        {createModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setCreateModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: '#05221e',
                borderRadius: '20px',
                border: '1px solid rgba(255, 239, 179, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={22} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                    Créer une Organisation
                  </h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                    Nom de l'organisation / Agence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agence Immobilière Prestige, SCI Les Palmiers..."
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Formule / Abonnement
                    </label>
                    <select
                      value={createForm.plan}
                      onChange={e => setCreateForm({ ...createForm, plan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="starter" style={{ backgroundColor: '#0a2e29' }}>Starter (Gratuit)</option>
                      <option value="pro" style={{ backgroundColor: '#0a2e29' }}>Pro / Sérénité</option>
                      <option value="expert" style={{ backgroundColor: '#0a2e29' }}>Expert / Agence</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Pays
                    </label>
                    <select
                      value={createForm.country}
                      onChange={e => setCreateForm({ ...createForm, country: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="CI" style={{ backgroundColor: '#0a2e29' }}>🇨🇮 Côte d'Ivoire</option>
                      <option value="SN" style={{ backgroundColor: '#0a2e29' }}>🇸🇳 Sénégal</option>
                      <option value="ML" style={{ backgroundColor: '#0a2e29' }}>🇲🇱 Mali</option>
                      <option value="BF" style={{ backgroundColor: '#0a2e29' }}>🇧🇫 Burkina Faso</option>
                      <option value="GN" style={{ backgroundColor: '#0a2e29' }}>🇬🇳 Guinée</option>
                      <option value="BJ" style={{ backgroundColor: '#0a2e29' }}>🇧🇯 Bénin</option>
                      <option value="TG" style={{ backgroundColor: '#0a2e29' }}>🇹🇬 Togo</option>
                      <option value="CM" style={{ backgroundColor: '#0a2e29' }}>🇨🇲 Cameroun</option>
                      <option value="FR" style={{ backgroundColor: '#0a2e29' }}>🇫🇷 France</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Email officiel
                    </label>
                    <input
                      type="email"
                      placeholder="contact@agence.com"
                      value={createForm.email}
                      onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+225 0700000000"
                      value={createForm.phone}
                      onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Ville
                    </label>
                    <input
                      type="text"
                      placeholder="Abidjan, Dakar..."
                      value={createForm.city}
                      onChange={e => setCreateForm({ ...createForm, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Adresse physique
                    </label>
                    <input
                      type="text"
                      placeholder="Cocody, Plateau, Rue 12..."
                      value={createForm.address}
                      onChange={e => setCreateForm({ ...createForm, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent)',
                      border: 'none',
                      color: '#013e37',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {createLoading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={16} />}
                    Créer l'organisation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT ORGANIZATION MODAL */}
        {editModalOpen && editingOrg && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setEditModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: '#05221e',
                borderRadius: '20px',
                border: '1px solid rgba(255, 239, 179, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit3 size={20} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                    Modifier l'Organisation
                  </h3>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                    Nom de l'organisation
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Formule / Abonnement
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="starter" style={{ backgroundColor: '#0a2e29' }}>Starter (Gratuit)</option>
                      <option value="pro" style={{ backgroundColor: '#0a2e29' }}>Pro / Sérénité</option>
                      <option value="expert" style={{ backgroundColor: '#0a2e29' }}>Expert / Agence</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Statut d'accès
                    </label>
                    <select
                      value={editForm.isActive ? 'active' : 'suspended'}
                      onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="active" style={{ backgroundColor: '#0a2e29' }}>🟢 Actif (Accès autorisé)</option>
                      <option value="suspended" style={{ backgroundColor: '#0a2e29' }}>🔴 Suspendu (Accès bloqué)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Ville
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
                      Pays
                    </label>
                    <select
                      value={editForm.country}
                      onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    >
                      <option value="CI" style={{ backgroundColor: '#0a2e29' }}>🇨🇮 Côte d'Ivoire</option>
                      <option value="SN" style={{ backgroundColor: '#0a2e29' }}>🇸🇳 Sénégal</option>
                      <option value="ML" style={{ backgroundColor: '#0a2e29' }}>🇲🇱 Mali</option>
                      <option value="BF" style={{ backgroundColor: '#0a2e29' }}>🇧🇫 Burkina Faso</option>
                      <option value="GN" style={{ backgroundColor: '#0a2e29' }}>🇬🇳 Guinée</option>
                      <option value="BJ" style={{ backgroundColor: '#0a2e29' }}>🇧🇯 Bénin</option>
                      <option value="TG" style={{ backgroundColor: '#0a2e29' }}>🇹🇬 Togo</option>
                      <option value="CM" style={{ backgroundColor: '#0a2e29' }}>🇨🇲 Cameroun</option>
                      <option value="FR" style={{ backgroundColor: '#0a2e29' }}>🇫🇷 France</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--accent)',
                      border: 'none',
                      color: '#013e37',
                      fontSize: '0.8125rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {editLoading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={16} />}
                    Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
