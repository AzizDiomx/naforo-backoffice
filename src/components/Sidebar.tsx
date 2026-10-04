'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Users2, 
  FileText, 
  CreditCard, 
  Receipt, 
  AlertTriangle, 
  BarChart3, 
  FolderKanban, 
  Gem,
  Bell,
  Radio,
  BarChart,
  LogOut,
  X,
  MessageSquare,
  History
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState('Mon Espace');
  const [planName, setPlanName] = useState('Starter');
  const [planCode, setPlanCode] = useState('starter');
  const [features, setFeatures] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('');

  const fetchSub = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.organization?.name) setOrgName(user.organization.name);
        if (user.role) setUserRole(user.role);
      } catch {}
    }

    const user = userStr ? JSON.parse(userStr) : null;
    if (user && user.role !== 'super_admin') {
      api.get('/subscriptions/me')
        .then(res => {
          if (res.planName) setPlanName(res.planName);
          if (res.planCode) setPlanCode(res.planCode);

          let fList: string[] = [];
          try {
            fList = typeof res.features === 'string' ? JSON.parse(res.features) : (Array.isArray(res.features) ? res.features : []);
          } catch {
            fList = [];
          }
          setFeatures(fList);
        })
        .catch(() => {});
    } else if (user && user.role === 'super_admin') {
      setOrgName('ADMINISTRATION SAAS');
      setPlanName('Superadmin');
      setPlanCode('superadmin');
    }
  };

  useEffect(() => {
    fetchSub();

    window.addEventListener('subscription-updated', fetchSub);
    window.addEventListener('focus', fetchSub);

    return () => {
      window.removeEventListener('subscription-updated', fetchSub);
      window.removeEventListener('focus', fetchSub);
    };
  }, []);

  const handleLogout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isFeatureAvailable = (featureCode: string): boolean => {
    if (userRole === 'super_admin') return true;
    const pCode = (planCode || '').toLowerCase();
    if (pCode.includes('expert') || pCode.includes('agency')) return true;
    return features.includes(featureCode);
  };

  const allOwnerMenuItems = [
    { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard, feature: 'base', group: 'PRINCIPAL' },
    { name: 'Notifications', href: '/notifications', icon: Bell, feature: 'base', group: 'PRINCIPAL' },

    { name: 'Biens Immobiliers', href: '/properties', icon: Building2, feature: 'base', group: 'GESTION LOCATIVE' },
    { name: 'Locataires', href: '/tenants', icon: Users2, feature: 'base', group: 'GESTION LOCATIVE' },
    { name: 'Contrats de Bail', href: '/contracts', icon: FileText, feature: 'base', group: 'GESTION LOCATIVE' },
    { name: 'Incidents & Pannes', href: '/incidents', icon: AlertTriangle, feature: 'base', group: 'GESTION LOCATIVE' },

    { name: 'Factures de Loyer', href: '/invoices', icon: Receipt, feature: 'base', group: 'FINANCES' },
    { name: 'Paiements Reçus', href: '/payments', icon: CreditCard, feature: 'base', group: 'FINANCES' },
    { name: 'Comptabilité & Bilans', href: '/accounting', icon: BarChart3, feature: 'excel_export', group: 'FINANCES' },

    { name: 'Messagerie Locataires', href: '/chat', icon: MessageSquare, feature: 'chat_encrypted', group: 'SERVICES PRO' },
    { name: 'Coffre-fort (GED)', href: '/documents', icon: FolderKanban, feature: 'ged_vault', group: 'SERVICES PRO' },
    { name: 'Mon Abonnement', href: '/subscription', icon: Gem, feature: 'base', group: 'SERVICES PRO' },
  ];

  const menuItems = userRole === 'super_admin'
    ? [
        { name: 'Dashboard & Stats', href: '/admin/dashboard', icon: LayoutDashboard, group: 'ADMINISTRATION' },
        { name: 'Piste d\'Audit', href: '/admin/audit-logs', icon: History, group: 'ADMINISTRATION' },
        { name: 'Diffusion Notifications', href: '/admin/broadcast', icon: Radio, group: 'ADMINISTRATION' },
        { name: 'Gestion des Forfaits', href: '/admin/plans', icon: Gem, group: 'SAAS' },
        { name: 'Validation Abonnements', href: '/admin/subscriptions', icon: CreditCard, group: 'SAAS' },
      ]
    : allOwnerMenuItems.filter(item => item.feature === 'base' || isFeatureAvailable(item.feature));

  // Extraire les groupes uniques
  const groups = Array.from(new Set(menuItems.map(i => i.group)));

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ boxShadow: '4px 0 24px rgba(1, 62, 55, 0.4)' }}>
      {/* Brand Header */}
      <div style={{ height: '72px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255, 239, 179, 0.3)' }}>
            <img 
              src="/images/logo.png" 
              alt="Naforo Logo" 
              style={{ width: '22px', height: '22px', objectFit: 'contain' }} 
            />
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>NAFORO</span>
        </div>
        <button 
          onClick={onClose} 
          className="menu-toggle"
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        {groups.map(group => (
          <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: '700', 
              color: 'rgba(255, 255, 255, 0.4)', 
              letterSpacing: '0.06em', 
              paddingLeft: '12px',
              marginBottom: '6px',
              textTransform: 'uppercase'
            }}>
              {group}
            </span>
            {menuItems.filter(i => i.group === group).map(item => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    color: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.75)',
                    backgroundColor: isActive ? 'rgba(255, 239, 179, 0.12)' : 'transparent',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '500',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--accent)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.5)', transition: 'color 0.2s ease' }} />
                  {item.name}
                  {isActive && (
                    <div style={{ position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '20px', backgroundColor: 'var(--accent)', borderTopRightRadius: '4px', borderBottomRightRadius: '4px' }}></div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Organization Footer Profile */}
      <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {orgName}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}></span>
            Plan {planName}
          </span>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
          }}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
