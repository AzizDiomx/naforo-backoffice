'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Plus,
  Edit3,
  Copy,
  Check,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Mail,
  Phone,
  Gem,
  BarChart3,
  Calendar,
  Sparkles,
  Home,
  CheckCheck,
  ShieldCheck,
  ExternalLink,
  MapPin
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

  const [createdCredentials, setCreatedCredentials] = useState<{
    orgName: string;
    email: string;
    tempPassword?: string;
    adminName: string;
    emailSent: boolean;
  } | null>(null);

  const initialCreateForm = {
    name: '',
    email: '',
    phone: '',
    city: 'Abidjan',
    country: 'CI',
    address: '',
    plan: 'starter',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    sendCredentialsEmail: true
  };

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
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
      const statsRes = await api.get(`/organizations/${org.id}/stats`);
      setStatsData(statsRes);

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
      const res = await api.post('/organizations', createForm);
      toast.success('Organisation créée avec succès !');
      setCreateModalOpen(false);

      if (res?.generatedCredentials) {
        setCreatedCredentials({
          orgName: createForm.name,
          ...res.generatedCredentials
        });
      }

      setCreateForm(initialCreateForm);
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

      if (statusFilter === 'active' && !org.isActive) return false;
      if (statusFilter === 'suspended' && org.isActive) return false;
      if (statusFilter === 'grace' && !org.settings?.deletionRequested) return false;

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
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '700',
            backgroundColor: '#faf5ff',
            color: '#7e22ce',
            border: '1px solid #e9d5ff'
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
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.72rem',
            fontWeight: '700',
            backgroundColor: '#fefce8',
            color: '#b45309',
            border: '1px solid #fef08a'
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
          padding: '4px 10px',
          borderRadius: '999px',
          fontSize: '0.72rem',
          fontWeight: '700',
          backgroundColor: '#f1f5f9',
          color: '#475569',
          border: '1px solid #e2e8f0'
        }}
      >
        <Building2 size={12} />
        Starter
      </span>
    );
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%', paddingBottom: '60px' }}>
        
        {/* TOP HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '4px 14px',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#15803d',
                marginBottom: '8px'
              }}
            >
              <ShieldCheck size={14} color="#16a34a" /> SUPER ADMIN • MULTI-TENANTS
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Gestion des Organisations
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: '4px' }}>
              Supervision des agences et bailleurs, attribution des formules, suivi d'activité et statistiques multi-comptes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchOrganizations(true)}
              disabled={refreshing || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
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
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
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
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(1, 62, 55, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Nouvelle Organisation
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Card 1: Total Orgs */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Organisations
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Building2 size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>
              {kpis.total}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', marginTop: '4px' }}>
              <span style={{ color: '#16a34a', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                {kpis.active} actives
              </span>
              {kpis.suspended > 0 && (
                <span style={{ color: '#dc2626', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                  {kpis.suspended} suspendues
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Biens Immobiliers */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Biens Immobiliers
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Home size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>
              {kpis.totalProperties}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Unités et logements gérés
            </span>
          </div>

          {/* Card 3: Baux Actifs */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Contrats de Bail
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                <FileText size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>
              {kpis.totalContracts}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Pour {kpis.totalTenants} locataires enregistrés
            </span>
          </div>

          {/* Card 4: Formules */}
          <div
            className="card"
            style={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Formules Actives
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fefce8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04' }}>
                <Gem size={18} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#b45309' }}>
                {kpis.proCount} Pro
              </span>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>/</span>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#7e22ce' }}>
                {kpis.expertCount} Exp
              </span>
              <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>/</span>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: '#475569' }}>
                {kpis.starterCount} St
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Répartition des abonnements
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }}
              />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, ville..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.84rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actives uniquement</option>
              <option value="suspended">Suspendues uniquement</option>
              <option value="grace">En délai de rétractation (30j)</option>
            </select>

            {/* Plan Filter */}
            <select
              value={planFilter}
              onChange={e => setPlanFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.84rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Toutes les formules</option>
              <option value="starter">Starter (Gratuit)</option>
              <option value="pro">Pro / Sérénité</option>
              <option value="expert">Expert / Agence</option>
            </select>

            {/* Country Filter */}
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: '0.84rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Tous les pays</option>
              <option value="CI">🇨🇮 Côte d'Ivoire</option>
              <option value="SN">🇸🇳 Sénégal</option>
              <option value="ML">🇲🇱 Mali</option>
              <option value="BF">🇧🇫 Burkina Faso</option>
              <option value="GN">🇬🇳 Guinée</option>
              <option value="BJ">🇧🇯 Bénin</option>
              <option value="TG">🇹🇬 Togo</option>
              <option value="CM">🇨🇲 Cameroun</option>
              <option value="FR">🇫🇷 France</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500' }}>
              {filteredOrganizations.length} organisation{filteredOrganizations.length > 1 ? 's' : ''}
            </span>
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid #e2e8f0'
              }}
            >
              <button
                onClick={() => setViewMode('table')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Tableau
              </button>
              <button
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: viewMode === 'cards' ? '#ffffff' : 'transparent',
                  color: viewMode === 'cards' ? '#0f172a' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
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
            className="card"
            style={{
              padding: '60px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0'
            }}
          >
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
              Chargement des organisations en cours...
            </p>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #e2e8f0'
            }}
          >
            <Building2 size={36} style={{ margin: '0 auto 16px', color: '#94a3b8' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Aucune organisation trouvée
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 20px' }}>
              {search || statusFilter !== 'all' || planFilter !== 'all' || countryFilter !== 'all'
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
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem' }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div
            className="card"
            style={{
              borderRadius: '16px',
              overflowX: 'auto',
              backgroundColor: '#ffffff',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
              padding: 0
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    ORGANISATION & PAYS
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    CONTACT
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    FORMULE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    STATUT
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    BIENS / BAUX
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    ÉQUIPE
                  </th>
                  <th style={{ padding: '16px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>
                    ACTIONS
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
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Name & Country */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(1, 62, 55, 0.08)',
                              color: 'var(--primary)',
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
                              <span style={{ fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>
                                {org.name}
                              </span>
                              <span title={org.country || 'CI'} style={{ fontSize: '1.05rem' }}>
                                {getCountryFlag(org.country)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {org.city || 'Abidjan'}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>•</span>
                              <button
                                onClick={() => copyToClipboard(org.id, org.id)}
                                title="Copier l'identifiant ID"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  background: 'none',
                                  border: 'none',
                                  color: copiedId === org.id ? '#16a34a' : '#94a3b8',
                                  fontSize: '0.72rem',
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
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {org.email ? (
                            <a
                              href={`mailto:${org.email}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                color: '#1e293b',
                                textDecoration: 'none'
                              }}
                            >
                              <Mail size={13} style={{ color: '#94a3b8' }} />
                              {org.email}
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
                                fontSize: '0.78rem',
                                color: '#64748b',
                                textDecoration: 'none'
                              }}
                            >
                              <Phone size={12} style={{ color: '#94a3b8' }} />
                              {org.phone}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '16px 20px' }}>
                        {renderPlanBadge(org.plan)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        {isDeletionPending ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              backgroundColor: '#fff7ed',
                              color: '#c2410c',
                              border: '1px solid #fed7aa'
                            }}
                          >
                            <AlertTriangle size={12} />
                            Rétractation (30j)
                          </span>
                        ) : org.isActive ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              backgroundColor: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #bbf7d0'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                            Actif
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              backgroundColor: '#fef2f2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca'
                            }}
                          >
                            <Lock size={12} />
                            Suspendu
                          </span>
                        )}
                      </td>

                      {/* Properties / Contracts Stats */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.78rem',
                              fontWeight: '700'
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
                              gap: '5px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#faf5ff',
                              color: '#7e22ce',
                              fontSize: '0.78rem',
                              fontWeight: '700'
                            }}
                            title="Baux en cours"
                          >
                            <FileText size={12} />
                            {org._count?.contracts ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Users / Team */}
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            color: '#334155',
                            fontWeight: '600'
                          }}
                        >
                          <Users size={14} style={{ color: '#94a3b8' }} />
                          {org._count?.users ?? 0} membre{(org._count?.users ?? 0) > 1 ? 's' : ''}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenStats(org)}
                            title="Consulter les statistiques complètes"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              backgroundColor: '#f0fdf4',
                              border: '1px solid #86efac',
                              color: '#166534',
                              fontSize: '0.78rem',
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
                              padding: '7px 9px',
                              borderRadius: '8px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Edit3 size={14} />
                          </button>

                          <button
                            onClick={e => handleToggleActive(org, e)}
                            title={org.isActive ? 'Suspendre cette organisation' : 'Réactiver cette organisation'}
                            style={{
                              padding: '7px 9px',
                              borderRadius: '8px',
                              backgroundColor: org.isActive ? '#fef2f2' : '#f0fdf4',
                              border: `1px solid ${org.isActive ? '#fecaca' : '#bbf7d0'}`,
                              color: org.isActive ? '#dc2626' : '#16a34a',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {org.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS VIEW */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredOrganizations.map(org => {
              const isDeletionPending = org.settings?.deletionRequested === true;
              return (
                <div
                  key={org.id}
                  className="card"
                  style={{
                    padding: '22px',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(1, 62, 55, 0.08)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '1.05rem'
                          }}
                        >
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                              {org.name}
                            </h3>
                            <span style={{ fontSize: '1.1rem' }}>{getCountryFlag(org.country)}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
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
                            backgroundColor: '#fff7ed',
                            color: '#c2410c'
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
                            backgroundColor: '#f0fdf4',
                            color: '#15803d'
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
                            backgroundColor: '#fef2f2',
                            color: '#b91c1c'
                          }}
                        >
                          Suspendu
                        </span>
                      )}
                    </div>

                    {/* Contact snippet */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
                      {org.email && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} style={{ color: '#94a3b8' }} />
                          {org.email}
                        </span>
                      )}
                      {org.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} style={{ color: '#94a3b8' }} />
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
                        borderRadius: '12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        marginTop: '16px',
                        textAlign: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7' }}>
                          {org._count?.properties ?? 0}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Biens</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#7e22ce' }}>
                          {org._count?.contracts ?? 0}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Baux</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#16a34a' }}>
                          {org._count?.users ?? 0}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Membres</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
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
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        color: '#166534',
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
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        color: '#334155',
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
                        backgroundColor: org.isActive ? '#fef2f2' : '#f0fdf4',
                        border: `1px solid ${org.isActive ? '#fecaca' : '#bbf7d0'}`,
                        color: org.isActive ? '#dc2626' : '#16a34a',
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

        {/* MODAL 1: STATS & DETAILS MODAL */}
        {selectedOrgForStats && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
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
                maxWidth: '860px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(1, 62, 55, 0.08)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '1.25rem'
                    }}
                  >
                    {selectedOrgForStats.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {selectedOrgForStats.name}
                      </h2>
                      <span style={{ fontSize: '1.2rem' }}>{getCountryFlag(selectedOrgForStats.country)}</span>
                      {renderPlanBadge(selectedOrgForStats.plan)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>{selectedOrgForStats.city || 'Abidjan'}, {selectedOrgForStats.country || 'CI'}</span>
                      <span>•</span>
                      <span>ID: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>{selectedOrgForStats.id}</code></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrgForStats(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {statsLoading ? (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Calcul des statistiques de l'organisation...</p>
                </div>
              ) : statsData ? (
                <>
                  {/* METRICS ROW 1 : PATRIMOINE */}
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      1. Parc Immobilier & Taux d'Occupation
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Total Biens</span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0f172a' }}>
                          {statsData.properties.total}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '600' }}>Biens Occupés</span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#15803d' }}>
                          {statsData.properties.occupied}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <span style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: '600' }}>Vacants / Dispos</span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0284c7' }}>
                          {statsData.properties.available}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#fefce8', border: '1px solid #fef08a' }}>
                        <span style={{ fontSize: '0.72rem', color: '#854d0e', fontWeight: '600' }}>Taux d'Occupation</span>
                        <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#b45309' }}>
                          {statsData.properties.occupancyRate}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* METRICS ROW 2 : FINANCES */}
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      2. Flux Financiers & Recouvrement
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700' }}>Total Loyers Validés & Encaissés</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#166534', marginTop: '4px' }}>
                          {formatFcfa(statsData.payments.totalCollectedAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {statsData.payments.validatedCount} paiement(s) validé(s)
                        </span>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                        <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: '700' }}>Factures en Retard / Impayées</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>
                          {formatFcfa(statsData.invoices.overdueAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {statsData.invoices.overdueCount} facture(s) en souffrance
                        </span>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a' }}>
                        <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '700' }}>Factures en Attente d'Échéance</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#d97706', marginTop: '4px' }}>
                          {formatFcfa(statsData.invoices.pendingAmount)}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {statsData.invoices.pendingCount} facture(s) en cours
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* METRICS ROW 3 : BAUX */}
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      3. Locataires & Baux
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Locataires Inscrits</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a' }}>
                          {statsData.tenants}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#faf5ff', border: '1px solid #f3e8ff' }}>
                        <span style={{ fontSize: '0.72rem', color: '#7e22ce', fontWeight: '600' }}>Contrats Actifs</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#6b21a8' }}>
                          {statsData.contracts.active}
                        </div>
                      </div>
                      <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '600' }}>Historique Baux</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#0f172a' }}>
                          {statsData.contracts.total}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* USERS / TEAM LIST */}
                  <div>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
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
                              padding: '12px 16px',
                              borderRadius: '10px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div
                                style={{
                                  width: '34px',
                                  height: '34px',
                                  borderRadius: '8px',
                                  backgroundColor: '#e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.78rem',
                                  fontWeight: '800',
                                  color: '#334155'
                                }}
                              >
                                {u.firstName.slice(0, 1)}
                                {u.lastName.slice(0, 1)}
                              </div>
                              <div>
                                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>
                                  {u.firstName} {u.lastName}
                                </span>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
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
                                  backgroundColor: '#f1f5f9',
                                  color: '#334155',
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
                                  backgroundColor: u.isActive ? '#16a34a' : '#dc2626'
                                }}
                                title={u.isActive ? 'Compte actif' : 'Compte inactif'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                        Aucun utilisateur spécifique listé.
                      </p>
                    )}
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '18px' }}>
                    <button
                      onClick={() => {
                        handleOpenEdit(selectedOrgForStats);
                        setSelectedOrgForStats(null);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8125rem' }}
                    >
                      Modifier l'organisation
                    </button>
                    <button
                      onClick={() => handleToggleActive(selectedOrgForStats)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        backgroundColor: selectedOrgForStats.isActive ? '#fef2f2' : '#f0fdf4',
                        border: `1.5px solid ${selectedOrgForStats.isActive ? '#fecaca' : '#bbf7d0'}`,
                        color: selectedOrgForStats.isActive ? '#dc2626' : '#16a34a',
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
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
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
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={22} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Créer une Organisation
                  </h3>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">
                    Nom de l'organisation / Agence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agence Immobilière Prestige, SCI Les Palmiers..."
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Formule / Abonnement
                    </label>
                    <select
                      value={createForm.plan}
                      onChange={e => setCreateForm({ ...createForm, plan: e.target.value })}
                      className="form-control"
                    >
                      <option value="starter">Starter (Gratuit)</option>
                      <option value="pro">Pro / Sérénité</option>
                      <option value="expert">Expert / Agence</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Pays
                    </label>
                    <select
                      value={createForm.country}
                      onChange={e => setCreateForm({ ...createForm, country: e.target.value })}
                      className="form-control"
                    >
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                      <option value="SN">🇸🇳 Sénégal</option>
                      <option value="ML">🇲🇱 Mali</option>
                      <option value="BF">🇧🇫 Burkina Faso</option>
                      <option value="GN">🇬🇳 Guinée</option>
                      <option value="BJ">🇧🇯 Bénin</option>
                      <option value="TG">🇹🇬 Togo</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="FR">🇫🇷 France</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Email officiel
                    </label>
                    <input
                      type="email"
                      placeholder="contact@agence.com"
                      value={createForm.email}
                      onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+225 0700000000"
                      value={createForm.phone}
                      onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Ville
                    </label>
                    <input
                      type="text"
                      placeholder="Abidjan, Dakar..."
                      value={createForm.city}
                      onChange={e => setCreateForm({ ...createForm, city: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Adresse physique
                    </label>
                    <input
                      type="text"
                      placeholder="Cocody, Plateau, Rue 12..."
                      value={createForm.address}
                      onChange={e => setCreateForm({ ...createForm, address: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                {/* SECTION: ADMINISTRATEUR & IDENTIFIANTS */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                        Administrateur & Accès de l'Organisation
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1'
                      }}
                    >
                      Provisionnement automatique
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    Un compte administrateur sera créé pour piloter cette organisation. Si vous ne définissez pas de mot de passe, un mot de passe temporaire sécurisé sera généré automatiquement.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">
                        Prénom de l'administrateur
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Amadou, Marc..."
                        value={createForm.adminFirstName}
                        onChange={e => setCreateForm({ ...createForm, adminFirstName: e.target.value })}
                        className="form-control"
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Nom de famille
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Koné, Diallo..."
                        value={createForm.adminLastName}
                        onChange={e => setCreateForm({ ...createForm, adminLastName: e.target.value })}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">
                        Email administrateur (connexion)
                      </label>
                      <input
                        type="email"
                        placeholder={createForm.email || "admin@agence.com"}
                        value={createForm.adminEmail}
                        onChange={e => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                        className="form-control"
                      />
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Si vide, l'email officiel ci-dessus sera utilisé
                      </span>
                    </div>

                    <div>
                      <label className="form-label">
                        Mot de passe temporaire
                      </label>
                      <input
                        type="text"
                        placeholder="Génération automatique (recommandé)"
                        value={createForm.adminPassword}
                        onChange={e => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                        className="form-control"
                      />
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Min. 6 caractères ou laisser vide
                      </span>
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      marginTop: '4px'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={createForm.sendCredentialsEmail}
                      onChange={e => setCreateForm({ ...createForm, sendCredentialsEmail: e.target.checked })}
                      style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                        Envoyer les identifiants par e-mail
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Transmet automatiquement le lien de connexion et le mot de passe via le service officiel Naforo
                      </span>
                    </div>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}
                  >
                    {createLoading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={16} />}
                    Créer l'organisation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATED CREDENTIALS SUCCESS POPUP */}
        {createdCredentials && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setCreatedCredentials(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Organisation & Accès créés !
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                      {createdCredentials.orgName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: createdCredentials.emailSent ? '#f0fdf4' : '#fffbeb',
                  border: `1.5px solid ${createdCredentials.emailSent ? '#bbf7d0' : '#fde68a'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {createdCredentials.emailSent ? (
                  <CheckCheck size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
                )}
                <div style={{ fontSize: '0.8rem', color: createdCredentials.emailSent ? '#166534' : '#92400e' }}>
                  {createdCredentials.emailSent ? (
                    <span>
                      <strong>E-mail officiel envoyé !</strong> Les identifiants et le lien de connexion ont été transmis à <strong>{createdCredentials.email}</strong>.
                    </span>
                  ) : (
                    <span>
                      <strong>Attention :</strong> L'envoi automatique d'email n'a pas été déclenché ou a échoué. Veuillez transmettre manuellement les identifiants ci-dessous.
                    </span>
                  )}
                </div>
              </div>

              {/* Credentials Box */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Administrateur
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                    {createdCredentials.adminName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Identifiant / E-mail de connexion
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
                      {createdCredentials.email}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdCredentials.email, 'cred-email')}
                      style={{ background: 'none', border: 'none', color: copiedId === 'cred-email' ? '#16a34a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                    >
                      {copiedId === 'cred-email' ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === 'cred-email' ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                </div>

                {createdCredentials.tempPassword && (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Mot de passe temporaire
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d97706', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                        {createdCredentials.tempPassword}
                      </span>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.tempPassword!, 'cred-pass')}
                        style={{ background: 'none', border: 'none', color: copiedId === 'cred-pass' ? '#16a34a' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      >
                        {copiedId === 'cred-pass' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === 'cred-pass' ? 'Copié' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => setCreatedCredentials(null)}
                  className="btn btn-primary"
                  style={{ backgroundColor: 'var(--primary)', color: '#ffffff', width: '100%' }}
                >
                  <Check size={16} /> J'ai bien noté les identifiants
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: EDIT ORGANIZATION MODAL */}
        {editModalOpen && editingOrg && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
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
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.2)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Edit3 size={20} style={{ color: 'var(--primary)' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Modifier l'Organisation
                  </h3>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">
                    Nom de l'organisation
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Formule / Abonnement
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                      className="form-control"
                    >
                      <option value="starter">Starter (Gratuit)</option>
                      <option value="pro">Pro / Sérénité</option>
                      <option value="expert">Expert / Agence</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">
                      Statut d'accès
                    </label>
                    <select
                      value={editForm.isActive ? 'active' : 'suspended'}
                      onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}
                      className="form-control"
                    >
                      <option value="active">🟢 Actif (Accès autorisé)</option>
                      <option value="suspended">🔴 Suspendu (Accès bloqué)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="form-control"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">
                      Ville
                    </label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Pays
                    </label>
                    <select
                      value={editForm.country}
                      onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                      className="form-control"
                    >
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                      <option value="SN">🇸🇳 Sénégal</option>
                      <option value="ML">🇲🇱 Mali</option>
                      <option value="BF">🇧🇫 Burkina Faso</option>
                      <option value="GN">🇬🇳 Guinée</option>
                      <option value="BJ">🇧🇯 Bénin</option>
                      <option value="TG">🇹🇬 Togo</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="FR">🇫🇷 France</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}
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
