'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  UserCheck, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Lock, 
  Eye, 
  EyeOff, 
  Crown, 
  Sparkles,
  KeyRound,
  FileText,
  UserX,
  RefreshCw,
  Home
} from 'lucide-react';

interface AssignedProperty {
  id: string;
  name: string;
  type: string;
  address?: string;
  city?: string;
  unitsCount?: number;
}

interface ManagerItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: 'manager' | 'accountant' | 'admin';
  isActive: boolean;
  createdAt: string;
  propertiesCount: number;
  totalUnitsCount: number;
  activeContractsCount: number;
  monthlyRent: number;
  occupancyRate: number;
  activeIncidentsCount: number;
  assignedProperties: AssignedProperty[];
}

export default function ManagersPage() {
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [activeManager, setActiveManager] = useState<ManagerItem | null>(null);

  // Create form state
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState<'manager' | 'accountant' | 'admin'>('manager');
  const [createPassword, setCreatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createSelectedProps, setCreateSelectedProps] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  // Portfolio form state
  const [portfolioSelectedProps, setPortfolioSelectedProps] = useState<string[]>([]);
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const res = await api.get<ManagerItem[]>('/users/managers');
      setManagers(Array.isArray(res) ? res : []);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de charger la liste des gestionnaires.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get<any[]>('/properties/lots');
      setAvailableProperties(Array.isArray(res) ? res : []);
    } catch {
      // Fallback standard list
      api.get<any>('/properties?limit=100').then((res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setAvailableProperties(list);
      }).catch(() => {});
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await api.get<any>('/subscriptions/me');
      setSubscription(res);
    } catch {}
  };

  useEffect(() => {
    fetchManagers();
    fetchProperties();
    fetchSubscription();
  }, []);

  // Formatters
  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(val).replace('XOF', 'FCFA');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return `${f}${l}` || 'G';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager':
        return { text: 'Gérant de Portefeuille', color: '#013E37', bg: 'rgba(1, 62, 55, 0.1)', border: '#013E37' };
      case 'accountant':
        return { text: 'Comptable / Trésorier', color: '#1E40AF', bg: 'rgba(30, 64, 175, 0.1)', border: '#3B82F6' };
      case 'admin':
        return { text: 'Administrateur d\'Agence', color: '#B45309', bg: 'rgba(180, 83, 9, 0.1)', border: '#F59E0B' };
      default:
        return { text: role, color: '#374151', bg: '#F3F4F6', border: '#D1D5DB' };
    }
  };

  // Quota calculation
  const planCode = (subscription?.planCode || '').toLowerCase();
  const isExpertPlan = planCode.includes('expert') || planCode.includes('agency');
  const maxStaff = planCode.includes('pro') ? 2 : (isExpertPlan ? 999 : 1);
  const staffCount = managers.length;
  const isQuotaReached = !isExpertPlan && staffCount >= maxStaff;

  // Filtered Managers
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
      const matchSearch = !search || 
        fullName.includes(search.toLowerCase()) || 
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.phone && m.phone.includes(search)) ||
        m.assignedProperties.some((p) => p.name.toLowerCase().includes(search.toLowerCase()));

      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? m.isActive : !m.isActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [managers, search, roleFilter, statusFilter]);

  // Aggregate stats
  const totalMonthlyRent = managers.reduce((sum, m) => sum + (m.monthlyRent || 0), 0);
  const totalAssignedProps = managers.reduce((sum, m) => sum + (m.propertiesCount || 0), 0);
  const activeCount = managers.filter((m) => m.isActive).length;

  // Actions
  const handleToggleStatus = async (manager: ManagerItem) => {
    const nextStatus = !manager.isActive;
    const confirmMsg = nextStatus 
      ? `Souhaitez-vous réactiver l'accès de ${manager.firstName} ${manager.lastName} ?`
      : `Souhaitez-vous suspendre temporairement l'accès de ${manager.firstName} ${manager.lastName} ?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/users/managers/${manager.id}/status`, { isActive: nextStatus });
      toast.success(nextStatus ? 'Accès gestionnaire réactivé avec succès.' : 'Accès gestionnaire suspendu.');
      setManagers((prev) => prev.map((m) => m.id === manager.id ? { ...m, isActive: nextStatus } : m));
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification du statut.');
    }
  };

  const openPortfolioModal = (manager: ManagerItem) => {
    setActiveManager(manager);
    setPortfolioSelectedProps(manager.assignedProperties.map((p) => p.id));
    setPortfolioSearch('');
    setIsPortfolioOpen(true);
  };

  const handleSavePortfolio = async () => {
    if (!activeManager) return;
    try {
      setPortfolioLoading(true);
      const updated = await api.put<ManagerItem>(`/users/managers/${activeManager.id}/portfolio`, {
        propertyIds: portfolioSelectedProps,
      });
      toast.success(`Portefeuille de ${activeManager.firstName} ${activeManager.lastName} mis à jour.`);
      setIsPortfolioOpen(false);
      fetchManagers();
    } catch (err: any) {
      toast.error(err.message || 'Impossible de mettre à jour le portefeuille.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFirstName.trim() || !createLastName.trim() || !createEmail.trim()) {
      toast.error('Veuillez renseigner le prénom, le nom et l\'adresse email.');
      return;
    }

    try {
      setCreateLoading(true);
      await api.post('/users/managers', {
        firstName: createFirstName.trim(),
        lastName: createLastName.trim(),
        email: createEmail.trim(),
        phone: createPhone.trim() || null,
        role: createRole,
        password: createPassword.trim() || undefined,
        propertyIds: createSelectedProps,
      });

      toast.success('Nouveau collaborateur créé avec succès. Identifiants envoyés par email.');
      setIsCreateOpen(false);
      // Reset form
      setCreateFirstName('');
      setCreateLastName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreateRole('manager');
      setCreatePassword('');
      setCreateSelectedProps([]);
      fetchManagers();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du collaborateur.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(1, 62, 55, 0.1)',
                color: '#013E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(1, 62, 55, 0.08)'
              }}>
                <UserCheck size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  Gérants & Équipe Immobilière
                </h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Cloisonnez et déléguez vos lots, immeubles et résidences par collaborateur dédié
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (isQuotaReached) {
                toast.error('Limite de collaborateurs atteinte. Passez à la formule Expert pour des gestionnaires illimités.');
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#013E37',
              borderColor: '#013E37',
              padding: '10px 20px',
              fontWeight: '600',
              borderRadius: '10px',
              boxShadow: '0 4px 14px rgba(1, 62, 55, 0.25)'
            }}
          >
            <Plus size={18} />
            Nouveau Collaborateur
          </button>
        </div>

        {/* Quota Banner if applicable */}
        {isQuotaReached && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(1, 62, 55, 0.05) 100%)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'rgba(217, 119, 6, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                <Crown size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Limite de gestionnaires atteinte ({staffCount} / {maxStaff} accès inclus)
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  La formule <strong>Expert / Entreprise</strong> vous permet de créer un nombre illimité de gérants avec portefeuilles cloisonnés et comptes-rendus de gestion automatiques.
                </p>
              </div>
            </div>
            <Link
              href="/subscription"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#013E37',
                color: '#FACC15',
                fontSize: '0.825rem',
                fontWeight: '700',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(1, 62, 55, 0.2)'
              }}
            >
              <Sparkles size={16} />
              Débloquer la Formule Expert
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(1, 62, 55, 0.1)', color: '#013E37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Gestionnaires & Staff
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                {managers.length} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>({activeCount} actifs)</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(30, 64, 175, 0.1)', color: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Biens sous Gestion
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                {totalAssignedProps} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)' }}>lots / biens</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Loyers Mensuels Gérés
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#013E37', marginTop: '2px' }}>
                {formatFcfa(totalMonthlyRent)}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '14px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cloisonnement Actif
              </span>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                100% Isolé
              </div>
            </div>
          </div>

        </div>

        {/* Filters Toolbar */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou immeuble..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: '38px', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field"
              style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '160px' }}
            >
              <option value="all">Tous les rôles</option>
              <option value="manager">Gérants de portefeuille</option>
              <option value="accountant">Comptables</option>
              <option value="admin">Administrateurs</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
              style={{ padding: '8px 12px', borderRadius: '8px', minWidth: '140px' }}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="suspended">Suspendus</option>
            </select>

            <button
              onClick={fetchManagers}
              className="btn btn-secondary"
              title="Rafraîchir"
              style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={16} />
            </button>
          </div>

        </div>

        {/* Managers Grid */}
        {loading ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px auto', color: '#013E37' }} />
            Chargement des collaborateurs et de leurs portefeuilles...
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className="card" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '14px' }}>
            <UserCheck size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              Aucun collaborateur trouvé
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              {search || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucun résultat ne correspond à vos filtres actuels.'
                : 'Vous n\'avez pas encore ajouté de gestionnaires de portefeuille pour votre organisation.'}
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              Ajouter le premier collaborateur
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredManagers.map((manager) => {
              const roleMeta = getRoleLabel(manager.role);
              const initials = getInitials(manager.firstName, manager.lastName);

              return (
                <div
                  key={manager.id}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: '#013E37',
                        color: '#FACC15',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.15rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 8px rgba(1, 62, 55, 0.25)'
                      }}>
                        {initials}
                      </div>

                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                          {manager.firstName} {manager.lastName}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: roleMeta.bg,
                            color: roleMeta.color,
                            border: `1px solid ${roleMeta.border}40`
                          }}>
                            {roleMeta.text}
                          </span>

                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: manager.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: manager.isActive ? '#10B981' : '#EF4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: manager.isActive ? '#10B981' : '#EF4444' }} />
                            {manager.isActive ? 'Actif' : 'Suspendu'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={15} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{manager.email}</span>
                    </div>
                    {manager.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={15} style={{ color: 'var(--text-muted)' }} />
                        <span>{manager.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Portfolio KPI Box */}
                  <div style={{
                    backgroundColor: 'var(--bg-subtle, #F9FAFB)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Biens supervisés
                      </span>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                        {manager.propertiesCount} {manager.propertiesCount > 1 ? 'biens' : 'bien'}
                        {manager.totalUnitsCount > manager.propertiesCount && (
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            ({manager.totalUnitsCount} lots)
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Baux actifs
                      </span>
                      <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                        {manager.activeContractsCount} {manager.activeContractsCount > 1 ? 'contrats' : 'contrat'}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Loyers mensuels
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#013E37', marginTop: '2px' }}>
                        {formatFcfa(manager.monthlyRent)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Taux d'occupation
                      </span>
                      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: manager.occupancyRate >= 80 ? '#10B981' : (manager.occupancyRate >= 50 ? '#D97706' : '#EF4444'), marginTop: '2px' }}>
                        {manager.occupancyRate}%
                      </div>
                    </div>
                  </div>

                  {/* Assigned Properties Chips */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Portefeuille affecté ({manager.assignedProperties.length})
                      </span>
                      <button
                        onClick={() => openPortfolioModal(manager)}
                        style={{ background: 'transparent', border: 'none', color: '#013E37', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                      >
                        Modifier
                      </button>
                    </div>

                    {manager.assignedProperties.length === 0 ? (
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(217, 119, 6, 0.05)',
                        border: '1px dashed rgba(217, 119, 6, 0.3)',
                        fontSize: '0.775rem',
                        color: '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>Aucun bien rattaché</span>
                        <button
                          onClick={() => openPortfolioModal(manager)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#013E37',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Affecter des lots
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {manager.assignedProperties.slice(0, 4).map((p) => (
                          <span
                            key={p.id}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(1, 62, 55, 0.08)',
                              color: '#013E37',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Building2 size={13} />
                            {p.name}
                            {p.unitsCount && p.unitsCount > 0 ? ` (${p.unitsCount})` : ''}
                          </span>
                        ))}
                        {manager.assignedProperties.length > 4 && (
                          <span
                            onClick={() => openPortfolioModal(manager)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              backgroundColor: '#F3F4F6',
                              color: 'var(--text-muted)',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            +{manager.assignedProperties.length - 4} autres
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => openPortfolioModal(manager)}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '8px'
                      }}
                    >
                      <Layers size={15} />
                      Gérer Portefeuille
                    </button>

                    <button
                      onClick={() => handleToggleStatus(manager)}
                      className="btn"
                      title={manager.isActive ? 'Suspendre temporairement l\'accès' : 'Réactiver l\'accès'}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: '600',
                        backgroundColor: manager.isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        color: manager.isActive ? '#DC2626' : '#16A34A',
                        border: '1px solid transparent'
                      }}
                    >
                      {manager.isActive ? <UserX size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* MODAL 1: Nouveau Collaborateur */}
        {isCreateOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(1, 62, 55, 0.1)', color: '#013E37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                      Nouveau Collaborateur d'Agence
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Créez un accès et assignez un périmètre de gestion dédié
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCreateOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateManager} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Prénom <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ibrahim"
                      value={createFirstName}
                      onChange={(e) => setCreateFirstName(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Nom de famille <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Kouamé"
                      value={createLastName}
                      onChange={(e) => setCreateLastName(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Adresse Email professionnelle <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ibrahim@agence.ci"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+225 07 00 00 00"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Rôle et habilitations
                    </label>
                    <select
                      value={createRole}
                      onChange={(e: any) => setCreateRole(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', borderRadius: '8px' }}
                    >
                      <option value="manager">Gérant de Portefeuille (Cloisonné)</option>
                      <option value="accountant">Comptable / Trésorier</option>
                      <option value="admin">Administrateur d'Agence</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
                      Mot de passe temporaire
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Généré automatiquement si vide"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', borderRadius: '8px', paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Portfolio Selection in Creation Form */}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-main)' }}>
                      Attribution initiale du portefeuille ({createSelectedProps.length} sélectionné{createSelectedProps.length > 1 ? 's' : ''})
                    </label>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setCreateSelectedProps(availableProperties.map((p) => p.id))}
                        style={{ background: 'none', border: 'none', color: '#013E37', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Tout cocher
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setCreateSelectedProps([])}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        Effacer
                      </button>
                    </div>
                  </div>

                  <div style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    backgroundColor: 'var(--bg-subtle, #FAFAFA)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {availableProperties.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Aucun bien ou lot enregistré dans l'agence.
                      </div>
                    ) : (
                      availableProperties.map((prop) => {
                        const isChecked = createSelectedProps.includes(prop.id);
                        return (
                          <label
                            key={prop.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              backgroundColor: isChecked ? 'rgba(1, 62, 55, 0.08)' : 'transparent',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              color: 'var(--text-main)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setCreateSelectedProps(createSelectedProps.filter((id) => id !== prop.id));
                                } else {
                                  setCreateSelectedProps([...createSelectedProps, prop.id]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#013E37' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                              <Building2 size={14} style={{ color: '#013E37' }} />
                              <span style={{ fontWeight: '600' }}>{prop.name}</span>
                              {prop.city && <span style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>({prop.city})</span>}
                              {prop.children && prop.children.length > 0 && (
                                <span style={{ fontSize: '0.7rem', backgroundColor: '#E2E8F0', padding: '1px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                                  {prop.children.length} lots
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Form Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="btn btn-secondary"
                    style={{ borderRadius: '8px', padding: '10px 18px', fontSize: '0.875rem' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn btn-primary"
                    style={{
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontSize: '0.875rem',
                      backgroundColor: '#013E37',
                      borderColor: '#013E37',
                      fontWeight: '700',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {createLoading ? 'Création en cours...' : 'Créer et envoyer l\'accès'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Gérer le Portefeuille Cloisonné */}
        {isPortfolioOpen && activeManager && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '650px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '28px',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                backgroundColor: 'var(--bg-surface, #FFFFFF)',
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(1, 62, 55, 0.1)', color: '#013E37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                      Portefeuille de {activeManager.firstName} {activeManager.lastName}
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Cochez les immeubles et lots sous la responsabilité de ce collaborateur
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPortfolioOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search & Bulk Selection Toolbar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filtrer les biens du patrimoine..."
                    value={portfolioSearch}
                    onChange={(e) => setPortfolioSearch(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '34px', fontSize: '0.825rem', borderRadius: '8px' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPortfolioSelectedProps(availableProperties.map((p) => p.id))}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.775rem', padding: '8px 12px', borderRadius: '8px' }}
                >
                  Tout cocher
                </button>

                <button
                  type="button"
                  onClick={() => setPortfolioSelectedProps([])}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.775rem', padding: '8px 12px', borderRadius: '8px' }}
                >
                  Tout décocher
                </button>
              </div>

              {/* Properties List */}
              <div style={{
                maxHeight: '380px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '10px',
                backgroundColor: 'var(--bg-subtle, #FAFAFA)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {availableProperties
                  .filter((p) => !portfolioSearch || p.name.toLowerCase().includes(portfolioSearch.toLowerCase()) || (p.city && p.city.toLowerCase().includes(portfolioSearch.toLowerCase())))
                  .map((prop) => {
                    const isChecked = portfolioSelectedProps.includes(prop.id);
                    return (
                      <label
                        key={prop.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: isChecked ? 'rgba(1, 62, 55, 0.08)' : '#FFFFFF',
                          border: isChecked ? '1px solid #013E37' : '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setPortfolioSelectedProps(portfolioSelectedProps.filter((id) => id !== prop.id));
                            } else {
                              setPortfolioSelectedProps([...portfolioSelectedProps, prop.id]);
                            }
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#013E37' }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} style={{ color: '#013E37' }} />
                            <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                              {prop.name}
                            </span>
                            {prop.type && (
                              <span style={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#E2E8F0',
                                color: '#475569',
                                fontWeight: '600'
                              }}>
                                {prop.type}
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                            {prop.address && <span>{prop.address}</span>}
                            {prop.city && <span>{prop.city}</span>}
                            {prop.children && prop.children.length > 0 && (
                              <span style={{ fontWeight: '600', color: '#013E37' }}>
                                {prop.children.length} lot(s) rattaché(s)
                              </span>
                            )}
                          </div>
                        </div>

                      </label>
                    );
                  })}
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                  <strong>{portfolioSelectedProps.length}</strong> bien(s) sous la gestion de ce collaborateur
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsPortfolioOpen(false)}
                    className="btn btn-secondary"
                    style={{ borderRadius: '8px', padding: '9px 16px', fontSize: '0.85rem' }}
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    disabled={portfolioLoading}
                    onClick={handleSavePortfolio}
                    className="btn btn-primary"
                    style={{
                      borderRadius: '8px',
                      padding: '9px 20px',
                      fontSize: '0.85rem',
                      backgroundColor: '#013E37',
                      borderColor: '#013E37',
                      fontWeight: '700'
                    }}
                  >
                    {portfolioLoading ? 'Enregistrement...' : 'Enregistrer le portefeuille'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
