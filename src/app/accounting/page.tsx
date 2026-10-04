'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { useSubscriptionFeature } from '@/lib/useSubscriptionFeature';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Building,
  PiggyBank,
  FileSpreadsheet,
  Lock,
  Search,
  Filter,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Wallet,
  Coins,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Receipt,
  X,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export type CurrencyType = 'XOF' | 'EUR' | 'USD' | 'CAD';

interface ExchangeRates {
  EUR: number;
  USD: number;
  CAD: number;
}

export default function AccountingPage() {
  const { hasFeature, planName } = useSubscriptionFeature();
  const canExportExcel = hasFeature('excel_export');

  // --- Données principales ---
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [rates, setRates] = useState<ExchangeRates>({ EUR: 0.00152449, USD: 0.00165, CAD: 0.00225 });
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string>('');

  // --- Filtres de période ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(currentMonth);

  // --- Onglet actif ---
  const [activeTab, setActiveTab] = useState<'ledger' | 'analytics' | 'pnl_properties' | 'converter'>('ledger');

  // --- Devise d'affichage active ---
  const [currency, setCurrency] = useState<CurrencyType>('XOF');

  // --- Filtres du grand livre ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'REVENUE' | 'EXPENSE'>('ALL');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // --- États UI & Chargement ---
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Modals ---
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [deleteTargetTxn, setDeleteTargetTxn] = useState<any | null>(null);

  // --- Formulaire Dépense ---
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formCategory, setFormCategory] = useState('charges');
  const [formLabel, setFormLabel] = useState('');
  const [formAmountXof, setFormAmountXof] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Simulateur de devises interactif ---
  const [simAmount, setSimAmount] = useState<number>(500000);
  const [simSourceCurrency, setSimSourceCurrency] = useState<CurrencyType>('XOF');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Rôle utilisateur ---
  const [userRole, setUserRole] = useState('');

  // ---------------------------------------------------------------------------
  // Chargement des données
  // ---------------------------------------------------------------------------
  const loadData = () => {
    setLoading(true);
    setError(null);

    const monthParam = selectedMonth === 'all' ? '' : `&periodMonth=${selectedMonth}`;
    const dashMonthParam = selectedMonth === 'all' ? currentMonth : selectedMonth;

    Promise.all([
      api.get(`/accounting/transactions?periodYear=${selectedYear}${monthParam}&limit=200`),
      api.get(`/accounting/dashboard?year=${selectedYear}&month=${dashMonthParam}`),
      api.get('/properties'),
      api.get('/accounting/rates').catch(() => ({ rates: { EUR: 0.00152449, USD: 0.00165, CAD: 0.00225 }, updatedAt: '' })),
    ])
      .then(([txnData, dashData, propsData, ratesData]) => {
        setTransactions(txnData?.items || txnData?.data || (Array.isArray(txnData) ? txnData : []));
        setDashboard(dashData);
        setProperties(Array.isArray(propsData) ? propsData : propsData?.items || propsData?.data || []);
        if (ratesData?.rates) {
          setRates(ratesData.rates);
          if (ratesData.updatedAt) setRatesUpdatedAt(ratesData.updatedAt);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Impossible de charger les écritures comptables.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUserRole(JSON.parse(userStr).role);
      } catch {}
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Conversion et formatage des montants
  // ---------------------------------------------------------------------------
  const convertFromXof = (amountXof: number, target: CurrencyType): number => {
    if (target === 'XOF') return amountXof;
    const rate = rates[target] || (target === 'EUR' ? 0.00152449 : target === 'USD' ? 0.00165 : 0.00225);
    return amountXof * rate;
  };

  const formatAmount = (valXof: number, targetCurrency: CurrencyType = currency): string => {
    const converted = convertFromXof(valXof, targetCurrency);
    if (targetCurrency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(converted) + ' FCFA';
    }
    const symbol = targetCurrency === 'EUR' ? '€' : targetCurrency === 'USD' ? '$' : 'C$';
    return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)} ${symbol}`;
  };

  // Taux de change unitaire (1 EUR = X FCFA, etc.)
  const getUnitRateDisplay = (target: 'EUR' | 'USD' | 'CAD'): string => {
    const rate = rates[target] || (target === 'EUR' ? 0.00152449 : target === 'USD' ? 0.00165 : 0.00225);
    if (!rate || rate === 0) return 'N/A';
    const xofPerUnit = 1 / rate;
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(xofPerUnit) + ' FCFA';
  };

  // ---------------------------------------------------------------------------
  // Création d'une dépense
  // ---------------------------------------------------------------------------
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmountXof || Number(formAmountXof) <= 0) {
      setError('Veuillez saisir un montant valide.');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const expenseDate = new Date(formDate);

    try {
      await api.post('/accounting/expenses', {
        propertyId: formPropertyId || undefined,
        category: formCategory,
        label: formLabel,
        amountXof: Number(formAmountXof),
        transactionDate: expenseDate.toISOString(),
        periodMonth: expenseDate.getMonth() + 1,
        periodYear: expenseDate.getFullYear(),
        notes: formNotes || undefined,
      });

      setSuccess('Dépense enregistrée avec succès et imputée au compte de résultat.');
      setShowExpenseModal(false);
      // Reset form
      setFormPropertyId('');
      setFormLabel('');
      setFormAmountXof('');
      setFormNotes('');
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erreur lors de la création de la dépense.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Suppression d'une transaction manuelle
  // ---------------------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteTargetTxn) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/accounting/transactions/${deleteTargetTxn.id}`);
      setSuccess('Écriture comptable supprimée avec succès.');
      setDeleteTargetTxn(null);
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erreur de suppression.');
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Filtrage des transactions pour le tableau
  // ---------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Type
      if (filterType !== 'ALL' && txn.type !== filterType) return false;
      // Property
      if (filterPropertyId !== 'ALL' && txn.propertyId !== filterPropertyId) return false;
      // Category
      if (filterCategory !== 'ALL' && txn.category !== filterCategory) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const labelMatch = txn.label?.toLowerCase().includes(q);
        const refMatch = txn.referenceNumber?.toLowerCase().includes(q);
        const propMatch = txn.property?.name?.toLowerCase().includes(q);
        if (!labelMatch && !refMatch && !propMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, filterPropertyId, filterCategory, searchQuery]);

  // ---------------------------------------------------------------------------
  // Métriques financières calculées
  // ---------------------------------------------------------------------------
  const totalRevenueXof = useMemo(() => {
    if (selectedMonth === 'all') {
      return transactions
        .filter((t) => t.type === 'REVENUE' || t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amountXof || 0), 0);
    }
    return dashboard?.totalRevenueXof || 0;
  }, [selectedMonth, transactions, dashboard]);

  const totalExpenseXof = useMemo(() => {
    if (selectedMonth === 'all') {
      return transactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amountXof || 0), 0);
    }
    return dashboard?.totalExpenseXof || 0;
  }, [selectedMonth, transactions, dashboard]);

  const netCashFlowXof = totalRevenueXof - totalExpenseXof;
  const netMarginPercent = totalRevenueXof > 0 ? ((netCashFlowXof / totalRevenueXof) * 100).toFixed(1) : '0';
  const expenseRatioPercent = totalRevenueXof > 0 ? ((totalExpenseXof / totalRevenueXof) * 100).toFixed(1) : '0';

  // ---------------------------------------------------------------------------
  // Données de répartition pour le Donut Chart
  // ---------------------------------------------------------------------------
  const pieData = useMemo(() => {
    const expenseTxns = transactions.filter((t) => t.type === 'EXPENSE');
    const grouped: Record<string, number> = {};
    for (const t of expenseTxns) {
      const cat = (t.category || 'charges').toLowerCase();
      grouped[cat] = (grouped[cat] || 0) + Number(t.amountXof || 0);
    }

    const labelsMap: Record<string, string> = {
      charges: 'Charges Copropriété',
      reparation: 'Réparations & Travaux',
      impots: 'Impôts & Taxes (DGI)',
      assurance: 'Assurances PNO',
      gestion: 'Frais de Gestion',
      divers: 'Dépenses Diverses',
    };

    return Object.entries(grouped).map(([cat, amount]) => ({
      name: labelsMap[cat] || cat.toUpperCase(),
      categoryKey: cat,
      value: amount,
    }));
  }, [transactions]);

  const CHART_COLORS = ['#013E37', '#059669', '#D97706', '#3B82F6', '#8B5CF6', '#EC4899'];

  // ---------------------------------------------------------------------------
  // P&L par Propriété (Performance consolidée)
  // ---------------------------------------------------------------------------
  const propertiesPnl = useMemo(() => {
    return properties.map((prop) => {
      const propTxns = transactions.filter((t) => t.propertyId === prop.id);
      const rev = propTxns
        .filter((t) => t.type === 'REVENUE' || t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amountXof || 0), 0);
      const exp = propTxns
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amountXof || 0), 0);
      const net = rev - exp;
      const margin = rev > 0 ? ((net / rev) * 100).toFixed(1) : '0';

      return {
        property: prop,
        revenueXof: rev,
        expenseXof: exp,
        netXof: net,
        marginPercent: margin,
      };
    });
  }, [properties, transactions]);

  // ---------------------------------------------------------------------------
  // Simulateur de devises (calculs instantanés)
  // ---------------------------------------------------------------------------
  const simulatedValues = useMemo(() => {
    let amountInXof = simAmount;
    if (simSourceCurrency !== 'XOF') {
      const rate = rates[simSourceCurrency] || 1;
      amountInXof = simAmount / rate;
    }

    return {
      XOF: Math.round(amountInXof),
      EUR: amountInXof * (rates.EUR || 0.00152449),
      USD: amountInXof * (rates.USD || 0.00165),
      CAD: amountInXof * (rates.CAD || 0.00225),
    };
  }, [simAmount, simSourceCurrency, rates]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const monthNames = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

        {/* ----------------------------------------------------------------- */}
        {/* TOP EXECUTIVE HEADER */}
        {/* ----------------------------------------------------------------- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(1, 62, 55, 0.08)',
                color: '#013E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={22} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Comptabilité & Devises
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
              Grand livre automatisé conforme OHADA, balance analytique des flux locatifs et convertisseur de devises en temps réel.
            </p>
          </div>

          {/* Action buttons & Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Currency switcher pill */}
            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '3px'
            }}>
              {(['XOF', 'EUR', 'USD', 'CAD'] as const).map((curr) => {
                const isActive = currency === curr;
                return (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#013E37' : 'transparent',
                      color: isActive ? '#FFFFFF' : '#64748B',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 4px rgba(1, 62, 55, 0.2)' : 'none'
                    }}
                  >
                    {curr === 'XOF' ? 'FCFA' : curr}
                  </button>
                );
              })}
            </div>

            {/* Excel Export Button */}
            {canExportExcel ? (
              <button
                onClick={() => {
                  const token = localStorage.getItem('accessToken');
                  window.open(`http://localhost:3000/api/v1/accounting/export/excel?year=${selectedYear}&token=${token}`, '_blank');
                }}
                className="btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                <FileSpreadsheet size={16} />
                Exporter Bilan Excel ({selectedYear})
              </button>
            ) : (
              <button
                disabled
                title="Fonctionnalité disponible à partir du forfait Pro / Expert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#F8FAFC',
                  color: '#94A3B8',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '9px 16px',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'not-allowed'
                }}
              >
                <Lock size={14} />
                Export Excel ({planName || 'Starter'})
              </button>
            )}

            {/* Saisie dépense button */}
            {['admin', 'manager', 'owner'].includes(userRole) && (
              <button
                onClick={() => setShowExpenseModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#013E37',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
                }}
              >
                <Plus size={16} />
                Saisir une dépense
              </button>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* BANNIÈRE DE COURS DES DEVISES EN DIRECT (TICKER BAR) */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
                Parités & Taux de Change Interbancaires
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Source : Banque Centrale (BCEAO) & Flux BCE • Base XOF (Franc CFA)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            {/* Ticker XOF */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: '600' }}>Franc CFA (UEMOA / CEMAC)</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#013E37', marginTop: '4px' }}>1 XOF = 1 FCFA</div>
              <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>Monnaie de référence légale</div>
            </div>

            {/* Ticker EUR */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: '600' }}>Euro (€) &bull; Parité fixe</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>1 EUR = 655,96 FCFA</div>
              <div style={{ fontSize: '0.6875rem', color: '#059669', fontWeight: '600', marginTop: '2px' }}>Taux officiel garanti</div>
            </div>

            {/* Ticker USD */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: '600' }}>US Dollar ($) &bull; Marché</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>1 USD ≈ {getUnitRateDisplay('USD')}</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Taux interbancaire temps réel</div>
            </div>

            {/* Ticker CAD */}
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: '600' }}>Dollar Canadien (C$) &bull; Marché</div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginTop: '4px' }}>1 CAD ≈ {getUnitRateDisplay('CAD')}</div>
              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>Taux interbancaire temps réel</div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* SELECTEUR DE PÉRIODE (ANNÉE & MOIS) */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '12px 18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: '700', fontSize: '0.875rem' }}>
            <Calendar size={18} style={{ color: '#013E37' }} />
            <span>Période comptable sous revue :</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Year selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>Exercice {y}</option>
              ))}
            </select>

            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: '0.8125rem',
                fontWeight: '700',
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <option value="all">Consolidé Annuel (12 Mois)</option>
              {monthNames.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              title="Rafraîchir les écritures"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#15803D',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* 4 EXECUTIVE KPI SUMMARY CARDS */}
        {/* ----------------------------------------------------------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

          {/* Card 1: Revenus Bruts Encaissés */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Revenus Bruts Encaissés
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#059669', letterSpacing: '-0.02em' }}>
                {formatAmount(totalRevenueXof)}
              </div>
              {currency !== 'XOF' && (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  Équivalent : {new Intl.NumberFormat('fr-FR').format(totalRevenueXof)} FCFA
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
              Loyers recouvrés & régularisations
            </div>
          </div>

          {/* Card 2: Charges & Dépenses Totales */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Charges & Décaissements
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={16} />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#DC2626', letterSpacing: '-0.02em' }}>
                -{formatAmount(totalExpenseXof)}
              </div>
              {currency !== 'XOF' && (
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                  Équivalent : -{new Intl.NumberFormat('fr-FR').format(totalExpenseXof)} FCFA
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
              Taux d'effort de charges : <strong style={{ color: '#0F172A' }}>{expenseRatioPercent}%</strong>
            </div>
          </div>

          {/* Card 3: Résultat Net Comptable (Cash Flow Net) */}
          <div style={{
            backgroundColor: netCashFlowXof >= 0 ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${netCashFlowXof >= 0 ? '#BBF7D0' : '#FECACA'}`,
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: netCashFlowXof >= 0 ? '#166534' : '#991B1B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Résultat Net Comptable
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: netCashFlowXof >= 0 ? '#DCFCE7' : '#FEE2E2',
                color: netCashFlowXof >= 0 ? '#15803D' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PiggyBank size={16} />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: netCashFlowXof >= 0 ? '#013E37' : '#DC2626', letterSpacing: '-0.02em' }}>
                {formatAmount(netCashFlowXof)}
              </div>
              {currency !== 'XOF' && (
                <div style={{ fontSize: '0.75rem', color: netCashFlowXof >= 0 ? '#166534' : '#991B1B', marginTop: '2px' }}>
                  Équivalent : {new Intl.NumberFormat('fr-FR').format(netCashFlowXof)} FCFA
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: netCashFlowXof >= 0 ? '#166534' : '#991B1B', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${netCashFlowXof >= 0 ? 'rgba(22, 101, 52, 0.15)' : 'rgba(153, 27, 27, 0.15)'}` }}>
              Marge nette d'exploitation : <strong style={{ color: '#0F172A' }}>{netMarginPercent}%</strong>
            </div>
          </div>

          {/* Card 4: Parc Immobilier & Trésorerie */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Parc & Unités Actives
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={16} />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '1.65rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>
                {properties.length} <span style={{ fontSize: '1rem', fontWeight: '500', color: '#64748B' }}>biens gérés</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                {transactions.length} écritures passées sur la période
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
              Statut : <span style={{ color: '#059669', fontWeight: '700' }}>Équilibré & Conforme OHADA</span>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TABS NAVIGATION */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          gap: '24px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {[
            { id: 'ledger', label: 'Grand Livre & Écritures', count: filteredTransactions.length, icon: Layers },
            { id: 'analytics', label: 'Répartition Analytique des Charges', count: pieData.length, icon: PieChartIcon },
            { id: 'pnl_properties', label: 'Performance & P&L par Bien', count: properties.length, icon: Building },
            { id: 'converter', label: 'Convertisseur & Simulateur Devises', icon: ArrowRightLeft },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 6px',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #013E37' : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: isActive ? '#013E37' : '#64748B',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#013E37' : '#94A3B8' }} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? '#013E37' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : '#64748B'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* TAB 1: GRAND LIVRE & ECRITURES */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Barre de filtres et recherche */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '8px 14px',
                minWidth: '260px',
                flex: '1 1 260px'
              }}>
                <Search size={16} style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Rechercher par libellé, référence, bien..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '0.8125rem',
                    color: '#0F172A',
                    width: '100%'
                  }}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Selectors */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>

                {/* Filter Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Tous les flux (Recettes & Charges)</option>
                  <option value="REVENUE">Recettes uniquement (+)</option>
                  <option value="EXPENSE">Charges uniquement (-)</option>
                </select>

                {/* Filter Property */}
                <select
                  value={filterPropertyId}
                  onChange={(e) => setFilterPropertyId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#0F172A',
                    cursor: 'pointer',
                    maxWidth: '200px'
                  }}
                >
                  <option value="ALL">Tous les biens</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {/* Filter Category */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#F8FAFC',
                    fontSize: '0.8125rem',
                    fontWeight: '600',
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">Toutes catégories</option>
                  <option value="loyer">Loyers perçus</option>
                  <option value="charges">Charges de copropriété</option>
                  <option value="reparation">Réparations & Travaux</option>
                  <option value="impots">Impôts fonciers (DGI)</option>
                  <option value="assurance">Assurances PNO</option>
                  <option value="gestion">Frais de gestion</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
            </div>

            {/* Table des écritures */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                  Livre-Journal des Écritures Comptables
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Devise active : <strong style={{ color: '#013E37' }}>{currency}</strong> ({filteredTransactions.length} écriture(s))
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Date & Réf</th>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Bien Concerné</th>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Catégorie</th>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Libellé de l'Écriture</th>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Montant Net</th>
                      <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Statut / Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={32} style={{ color: '#CBD5E1' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Aucune écriture trouvée pour cette sélection.</span>
                            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Modifiez vos filtres ou enregistrez une nouvelle dépense.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => {
                        const isRevenue = txn.type === 'REVENUE' || txn.type === 'INCOME';
                        return (
                          <tr
                            key={txn.id}
                            style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {/* Date & Ref */}
                            <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: '#0F172A' }}>
                              <div style={{ fontWeight: '600' }}>
                                {new Date(txn.transactionDate).toLocaleDateString('fr-FR')}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                                {txn.referenceNumber ? `Réf : ${txn.referenceNumber}` : 'Auto-Généré'}
                              </div>
                            </td>

                            {/* Property */}
                            <td style={{ padding: '14px 18px', fontSize: '0.8125rem' }}>
                              {txn.property ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A', fontWeight: '600' }}>
                                  <Building size={14} style={{ color: '#64748B' }} />
                                  <span>{txn.property.name}</span>
                                </div>
                              ) : (
                                <span style={{ color: '#64748B', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  Général / Non affecté
                                </span>
                              )}
                            </td>

                            {/* Category Badge */}
                            <td style={{ padding: '14px 18px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.6875rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                backgroundColor: isRevenue ? '#ECFDF5' : '#FEF2F2',
                                color: isRevenue ? '#059669' : '#DC2626',
                                border: `1px solid ${isRevenue ? '#A7F3D0' : '#FECACA'}`
                              }}>
                                {isRevenue ? '+' : '-'} {txn.category || 'Général'}
                              </span>
                            </td>

                            {/* Label */}
                            <td style={{ padding: '14px 18px', fontSize: '0.8125rem', color: '#0F172A' }}>
                              <div style={{ fontWeight: '600' }}>{txn.label}</div>
                              {txn.notes && (
                                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                                  {txn.notes}
                                </div>
                              )}
                            </td>

                            {/* Amount in active currency */}
                            <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '800' }}>
                              <span style={{ color: isRevenue ? '#059669' : '#DC2626' }}>
                                {isRevenue ? '+' : '-'}{formatAmount(Number(txn.amountXof))}
                              </span>
                              {currency !== 'XOF' && (
                                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: '500' }}>
                                  {new Intl.NumberFormat('fr-FR').format(Number(txn.amountXof))} FCFA
                                </div>
                              )}
                            </td>

                            {/* Actions / Status */}
                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              {txn.isAutomatic ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.6875rem',
                                  color: '#64748B',
                                  backgroundColor: '#F1F5F9',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}>
                                  <Lock size={12} /> Auto
                                </span>
                              ) : (
                                ['admin', 'manager', 'owner'].includes(userRole) && (
                                  <button
                                    onClick={() => setDeleteTargetTxn(txn)}
                                    title="Supprimer cette écriture"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#94A3B8',
                                      cursor: 'pointer',
                                      padding: '6px',
                                      borderRadius: '6px',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#DC2626';
                                      e.currentTarget.style.backgroundColor = '#FEF2F2';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#94A3B8';
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 2: RÉPARTITION ANALYTIQUE DES CHARGES */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

            {/* Donut Chart */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                Répartition des Charges par Poste
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '20px' }}>
                Distribution des décaissements sur l'exercice sous revue
              </p>

              {pieData.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#94A3B8', fontSize: '0.875rem' }}>
                  Aucune dépense constatée sur cette période.
                </div>
              ) : (
                <div style={{ height: '240px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatAmount(Number(val)), 'Montant']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Breakdown Details */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                Ventilation Détaillée des Coûts
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '18px' }}>
                Montants cumulés et part relative sur le total des charges ({formatAmount(totalExpenseXof)})
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pieData.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>Aucune charge déclarée.</div>
                ) : (
                  pieData.map((item, idx) => {
                    const pct = totalExpenseXof > 0 ? ((item.value / totalExpenseXof) * 100).toFixed(1) : '0';
                    const color = CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <div key={item.name} style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A' }}>{item.name}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#013E37' }}>
                              {formatAmount(item.value)}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B', marginLeft: '8px' }}>
                              ({pct}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: '9999px' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 3: PERFORMANCE & P&L PAR BIEN */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'pnl_properties' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F172A', margin: 0 }}>
                  Compte de Résultat Simplifié par Propriété (P&L Unitaire)
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Rentabilité nette comparée sur l'exercice sous revue
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {propertiesPnl.length} bien(s) répertorié(s)
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Propriété</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Type / Ville</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Recettes</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Charges</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Résultat Net</th>
                    <th style={{ padding: '12px 18px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Rentabilité</th>
                  </tr>
                </thead>
                <tbody>
                  {propertiesPnl.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748B', fontSize: '0.8125rem' }}>
                        Aucun bien immobilier enregistré.
                      </td>
                    </tr>
                  ) : (
                    propertiesPnl.map((pnl) => {
                      const isPositive = pnl.netXof >= 0;
                      return (
                        <tr
                          key={pnl.property.id}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '14px 18px', fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Building size={16} style={{ color: '#013E37' }} />
                              <span>{pnl.property.name}</span>
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', fontSize: '0.75rem', color: '#64748B' }}>
                            {pnl.property.type} &bull; {pnl.property.city || 'Abidjan'}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: '700', color: '#059669' }}>
                            {formatAmount(pnl.revenueXof)}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.8125rem', fontWeight: '700', color: '#DC2626' }}>
                            -{formatAmount(pnl.expenseXof)}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '800', color: isPositive ? '#013E37' : '#DC2626' }}>
                            {formatAmount(pnl.netXof)}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.6875rem',
                              fontWeight: '700',
                              backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2',
                              color: isPositive ? '#059669' : '#DC2626',
                              border: `1px solid ${isPositive ? '#A7F3D0' : '#FECACA'}`
                            }}>
                              {pnl.marginPercent}% marge
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* TAB 4: CONVERTISSEUR & SIMULATEUR MULTI-DEVISES */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'converter' && (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} style={{ color: '#013E37' }} />
                Simulateur & Calculateur Multi-Devises Instantané
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', marginTop: '4px' }}>
                Saisissez un montant dans n'importe quelle devise pour visualiser instantanément sa contre-valeur dans toutes les monnaies supportées.
              </p>
            </div>

            {/* Input form */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'flex-end',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '18px 20px',
              marginBottom: '24px'
            }}>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Montant à Convertir
                </label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <div style={{ width: '180px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Devise Source
                </label>
                <select
                  value={simSourceCurrency}
                  onChange={(e) => setSimSourceCurrency(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  <option value="XOF">Franc CFA (XOF)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="CAD">Dollar Canadien (C$)</option>
                </select>
              </div>
            </div>

            {/* 4 Cards Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

              {/* XOF Result */}
              <div style={{
                backgroundColor: simSourceCurrency === 'XOF' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${simSourceCurrency === 'XOF' ? '#A7F3D0' : '#E2E8F0'}`,
                borderRadius: '10px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>FRANC CFA (XOF)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#013E37', marginTop: '6px' }}>
                  {new Intl.NumberFormat('fr-FR').format(simulatedValues.XOF)} FCFA
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '4px' }}>Parité pivot UEMOA</div>
                <button
                  onClick={() => copyToClipboard(`${simulatedValues.XOF} FCFA`, 'xof')}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedKey === 'xof' ? '#059669' : '#94A3B8'
                  }}
                  title="Copier le montant"
                >
                  {copiedKey === 'xof' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* EUR Result */}
              <div style={{
                backgroundColor: simSourceCurrency === 'EUR' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${simSourceCurrency === 'EUR' ? '#A7F3D0' : '#E2E8F0'}`,
                borderRadius: '10px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>EURO (€)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                  {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulatedValues.EUR)} €
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#059669', marginTop: '4px' }}>Taux garanti : 655,957</div>
                <button
                  onClick={() => copyToClipboard(`${simulatedValues.EUR.toFixed(2)} €`, 'eur')}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedKey === 'eur' ? '#059669' : '#94A3B8'
                  }}
                  title="Copier le montant"
                >
                  {copiedKey === 'eur' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* USD Result */}
              <div style={{
                backgroundColor: simSourceCurrency === 'USD' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${simSourceCurrency === 'USD' ? '#A7F3D0' : '#E2E8F0'}`,
                borderRadius: '10px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>US DOLLAR ($)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                  {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulatedValues.USD)} $
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>Taux interbancaire marché</div>
                <button
                  onClick={() => copyToClipboard(`${simulatedValues.USD.toFixed(2)} $`, 'usd')}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedKey === 'usd' ? '#059669' : '#94A3B8'
                  }}
                  title="Copier le montant"
                >
                  {copiedKey === 'usd' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              {/* CAD Result */}
              <div style={{
                backgroundColor: simSourceCurrency === 'CAD' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${simSourceCurrency === 'CAD' ? '#A7F3D0' : '#E2E8F0'}`,
                borderRadius: '10px',
                padding: '18px',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B' }}>DOLLAR CANADIEN (C$)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', marginTop: '6px' }}>
                  {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(simulatedValues.CAD)} C$
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '4px' }}>Taux interbancaire marché</div>
                <button
                  onClick={() => copyToClipboard(`${simulatedValues.CAD.toFixed(2)} C$`, 'cad')}
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copiedKey === 'cad' ? '#059669' : '#94A3B8'
                  }}
                  title="Copier le montant"
                >
                  {copiedKey === 'cad' ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: SAISIE D'UNE DÉPENSE PROPRIÉTAIRE */}
      {/* ----------------------------------------------------------------- */}
      {showExpenseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Saisie d'une Dépense & Charge
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Enregistrement d'une écriture de décaissement au compte de résultat
                </p>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateExpense} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Property select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Bien Immobilier Concerné
                </label>
                <select
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="">Tous les biens / Charges Générales</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              {/* Category & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Catégorie de Charge
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="charges">Charges de Copropriété</option>
                    <option value="reparation">Travaux & Réparations</option>
                    <option value="impots">Impôts & Taxes Foncières (DGI)</option>
                    <option value="assurance">Assurances PNO</option>
                    <option value="gestion">Frais de Gestion / Honoraires</option>
                    <option value="divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Date de Règlement
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.875rem',
                      color: '#0F172A',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              {/* Montant FCFA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Montant Décaissé (FCFA / XOF) *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 85000"
                  value={formAmountXof}
                  onChange={(e) => setFormAmountXof(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                />
                {Number(formAmountXof) > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px', fontWeight: '600' }}>
                    Contre-valeur indicative : {(Number(formAmountXof) * (rates.EUR || 0.00152449)).toFixed(2)} € &bull; {(Number(formAmountXof) * (rates.USD || 0.00165)).toFixed(2)} $
                  </div>
                )}
              </div>

              {/* Libellé */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Libellé Explicite de la Dépense *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Remplacement chauffe-eau appartement B2"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* Notes / Référence facture */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Justificatif / N° Facture Artisan (Facultatif)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Facture plombier n° 2026-089"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#013E37',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(1, 62, 55, 0.2)'
                  }}
                >
                  {actionLoading ? 'Enregistrement...' : 'Enregistrer la Dépense'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CONFIRMATION DE SUPPRESSION D'ÉCRITURE */}
      {/* ----------------------------------------------------------------- */}
      {deleteTargetTxn && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Supprimer cette écriture ?
              </h3>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
              Êtes-vous certain de vouloir annuler la dépense <strong>"{deleteTargetTxn.label}"</strong> d'un montant de <strong>{formatAmount(Number(deleteTargetTxn.amountXof))}</strong> ? Cette action est irréversible et recalculera la balance comptable.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteTargetTxn(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Conserver l'écriture
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
