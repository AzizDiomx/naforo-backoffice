'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import {
  TrendingUp,
  Building,
  FileSignature,
  Wrench,
  ChevronRight,
  Gem,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger les statistiques consolidées du Dashboard Propriétaire
    api.get('/dashboard/owner')
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Impossible de charger le tableau de bord');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement de votre espace de gestion...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div style={{ backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius)', padding: '16px 20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Une erreur est survenue : {error}</span>
        </div>
      </Layout>
    );
  }

  // Utiliser les données réelles issues du serveur PostgreSQL (historique 6 mois)
  const chartData = data?.revenues?.monthlyHistory || [
    { name: 'M-5', revenus: 0 },
    { name: 'M-4', revenus: 0 },
    { name: 'M-3', revenus: 0 },
    { name: 'M-2', revenus: 0 },
    { name: 'M-1', revenus: 0 },
    { name: 'Mois', revenus: 0 },
  ];

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const occupancy = data?.properties || { total: 0, occupied: 0, available: 0, maintenance: 0 };
  const incidents = data?.recentIncidents || [];
  const payments = data?.recentPayments || [];
  const sub = data?.subscription || { alert: false, daysLeft: 60, info: { planName: 'Starter' } };

  // Calcul dynamique de la croissance du chiffre d'affaires
  const thisMonthRev = Number(data?.revenues?.thisMonth || 0);
  const lastMonthRev = Number(data?.revenues?.lastMonth || 0);
  const growthPercent = lastMonthRev > 0
    ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100)
    : (thisMonthRev > 0 ? 100 : 0);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Page Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Tableau de Bord</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Vue d'ensemble en temps réel de votre patrimoine immobilier</p>
        </div>

        {/* Stats Grid - Responsive Mobile First */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Revenues */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-muted)' }}>LOYERS VALIDES (CE MOIS)</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                {formatFcfa(thisMonthRev)}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: growthPercent >= 0 ? 'var(--success)' : 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <TrendingUp size={12} />
                {growthPercent >= 0 ? `+${growthPercent}%` : `${growthPercent}%`} par rapport au mois dernier
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>

          {/* Card 2: Occupancy */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-muted)' }}>TAUX D'OCCUPATION</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {data?.occupancyRate || 0}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {occupancy.occupied} occupé(s) / {occupancy.total} bien(s) au total
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(71, 85, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <Building size={20} />
            </div>
          </div>

          {/* Card 3: Active Contracts */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-muted)' }}>BAUX DE LOCATION ACTIFS</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                {data?.activeContractsCount || 0}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {data?.expiringContracts?.length || 0} bail(s) arrivant Ã  échéance
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <FileSignature size={20} />
            </div>
          </div>

          {/* Card 4: Maintenance pannes */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: 'var(--text-muted)' }}>INCIDENTS SIGNALES</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                {incidents.filter((i: any) => i.status !== 'resolved').length}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                pannes déclarées en attente de traitement
              </span>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <Wrench size={20} />
            </div>
          </div>
        </div>

        {/* Mid Section: Chart and Subscription limits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }} className="mid-grid">
          {/* Chart Card */}
          <div className="card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>Revenus Locatifs (XOF)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historique des loyers collectés ces 6 derniers mois</p>
            </div>
            <div style={{ flex: 1, width: '100%', minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => [formatFcfa(value), 'Revenus']} />
                  <Area type="monotone" dataKey="revenus" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenus)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quotas & Subscription Card */}
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            border: 'none',
            backgroundColor: '#f8fafc',
            borderRadius: '14px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
            padding: '24px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>Statut du SaaS & Limites</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Utilisation de vos quotas pour le forfait <strong>{sub.info?.planName || 'Starter'}</strong></p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quota Biens */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text)' }}>Biens Immobiliers créés</span>
                  <span style={{ color: 'var(--text-muted)' }}>{occupancy.total} / {sub.info?.planName === 'Starter' ? '2' : '25'}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((occupancy.total / (sub.info?.planName === 'Starter' ? 2 : 25)) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>

              {/* Quota Locataires */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: '500', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text)' }}>Locataires Actifs</span>
                  <span style={{ color: 'var(--text-muted)' }}>{occupancy.occupied} / {sub.info?.planName === 'Starter' ? '2' : '25'}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((occupancy.occupied / (sub.info?.planName === 'Starter' ? 2 : 25)) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: 'var(--success)',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>

              {/* Forfait info */}
              <div style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginTop: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Gem size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '600' }}>Forfait Actif : {sub.info?.planName || 'Starter'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {sub.daysLeft <= 0 ? 'Expiré. Lecture seule active.' : `Expire dans ${sub.daysLeft} jour(s)`}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.href = '/subscription'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--accent)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(1, 62, 55, 0.15)',
                    transition: 'transform 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Gem size={14} /> Passer à l'offre supérieure
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activities */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {/* Recent Payments */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Paiements de loyers récents</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', cursor: 'pointer' }}>Tout voir</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {payments.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Aucun paiement déclaré récent</div>
              ) : (
                payments.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>{p.tenantProfile.firstName} {p.tenantProfile.lastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Réf: {p.paymentReference}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{formatFcfa(Number(p.amount))}</span>
                      <span className={`badge ${p.status === 'validated' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {p.status === 'validated' ? 'Validé' : p.status === 'pending' ? 'En attente' : 'Rejeté'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Incidents & Pannes récents</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '500', cursor: 'pointer' }}>Tout voir</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incidents.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Aucune panne récente signalée</div>
              ) : (
                incidents.map((i: any) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: '500' }}>{i.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Propriété: {i.property.name}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`badge ${i.priority === 'urgent' || i.priority === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                        {i.priority.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{i.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          :global(.mid-grid) {
            grid-template-columns: 2fr 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}

