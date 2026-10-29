'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import ConfirmModal from '@/components/ConfirmModal';
import {
  Users,
  Building,
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw,
  Landmark,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ChevronRight,
  Send,
  Check,
  X,
  FileCheck,
  TrendingUp,
  Percent,
  Receipt
} from 'lucide-react';

interface Landlord {
  id: string;
  type: 'individual' | 'company';
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  bankName?: string;
  ibanOrRib?: string;
  mobileMoneyNumber?: string;
  managementFeeRate: number;
  feeTaxRate: number;
  isActive: boolean;
  notes?: string;
  properties?: any[];
  managementReports?: any[];
  _count?: {
    properties: number;
    managementReports: number;
  };
}

interface ManagementReport {
  id: string;
  reportNumber: string;
  landlordId: string;
  landlord?: Landlord;
  periodMonth: number;
  periodYear: number;
  grossRentCollected: number;
  managementFeeRate: number;
  managementFees: number;
  feeTaxRate: number;
  feeTaxAmount: number;
  maintenanceExpenses: number;
  otherDeductions: number;
  netPayableToLandlord: number;
  status: 'draft' | 'generated' | 'sent' | 'paid';
  paidAt?: string;
  paymentRef?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function LandlordsPage() {
  const [activeTab, setActiveTab] = useState<'landlords' | 'crg'>('landlords');
  const [loading, setLoading] = useState(true);

  // Landlords state
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [searchLandlord, setSearchLandlord] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showLandlordModal, setShowLandlordModal] = useState(false);
  const [editingLandlord, setEditingLandlord] = useState<Landlord | null>(null);

  // Property assignment modal
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedLandlordForPortfolio, setSelectedLandlordForPortfolio] = useState<Landlord | null>(null);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioSearch, setPortfolioSearch] = useState('');

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [landlordToDelete, setLandlordToDelete] = useState<Landlord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // CRG State
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [reports, setReports] = useState<ManagementReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Mark CRG paid modal
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [reportToPay, setReportToPay] = useState<ManagementReport | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');

  // Form state for landlord
  const [formData, setFormData] = useState({
    type: 'individual' as 'individual' | 'company',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Abidjan',
    bankName: '',
    ibanOrRib: '',
    mobileMoneyNumber: '',
    managementFeeRate: 10,
    feeTaxRate: 18,
    notes: '',
  });

  const loadLandlords = async () => {
    try {
      const res = await api.get('/landlords');
      setLandlords(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des bailleurs.');
    }
  };

  const loadReports = async (m = selectedMonth, y = selectedYear) => {
    setReportsLoading(true);
    try {
      const res = await api.get(`/management-reports?month=${m}&year=${y}`);
      setReports(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des CRG.');
    } finally {
      setReportsLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      const res = await api.get('/properties?limit=300');
      const list = Array.isArray(res) ? res : res.data || [];
      setAllProperties(list);
    } catch (err) {
      // silently fail
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLandlords(), loadReports(), loadProperties()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const formatFcfa = (val: number = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(val).replace('XOF', 'FCFA');
  };

  // Open create modal
  const handleOpenCreateLandlord = () => {
    setEditingLandlord(null);
    setFormData({
      type: 'individual',
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      address: '',
      city: 'Abidjan',
      bankName: '',
      ibanOrRib: '',
      mobileMoneyNumber: '',
      managementFeeRate: 10,
      feeTaxRate: 18,
      notes: '',
    });
    setShowLandlordModal(true);
  };

  // Open edit modal
  const handleOpenEditLandlord = (l: Landlord) => {
    setEditingLandlord(l);
    setFormData({
      type: l.type,
      firstName: l.firstName || '',
      lastName: l.lastName || '',
      companyName: l.companyName || '',
      email: l.email || '',
      phone: l.phone,
      address: l.address || '',
      city: l.city || 'Abidjan',
      bankName: l.bankName || '',
      ibanOrRib: l.ibanOrRib || '',
      mobileMoneyNumber: l.mobileMoneyNumber || '',
      managementFeeRate: Number(l.managementFeeRate) || 10,
      feeTaxRate: Number(l.feeTaxRate) || 18,
      notes: l.notes || '',
    });
    setShowLandlordModal(true);
  };

  // Submit landlord form
  const handleSubmitLandlord = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingLandlord) {
        await api.put(`/landlords/${editingLandlord.id}`, formData);
        showFormSuccess('Fiche bailleur mise à jour avec succès.');
      } else {
        await api.post('/landlords', formData);
        showFormSuccess('Nouveau bailleur mandant enregistré avec succès.');
      }
      setShowLandlordModal(false);
      await loadLandlords();
    } catch (err) {
      handleFormError(err, "Erreur lors de l'enregistrement du bailleur.");
    } finally {
      setActionLoading(false);
    }
  };

  // Open portfolio modal
  const handleOpenPortfolio = (landlord: Landlord) => {
    setSelectedLandlordForPortfolio(landlord);
    const assignedIds = (landlord.properties || []).map((p: any) => p.id);
    setSelectedPropertyIds(assignedIds);
    setPortfolioSearch('');
    setShowPortfolioModal(true);
  };

  const handleTogglePropertyAssignment = (propertyId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const handleSavePortfolio = async () => {
    if (!selectedLandlordForPortfolio) return;
    setPortfolioLoading(true);
    try {
      await api.post(`/landlords/${selectedLandlordForPortfolio.id}/properties`, {
        propertyIds: selectedPropertyIds,
      });
      showFormSuccess('Patrimoine du bailleur synchronisé avec succès.');
      setShowPortfolioModal(false);
      await Promise.all([loadLandlords(), loadProperties()]);
    } catch (err) {
      handleFormError(err, 'Erreur lors de la mise à jour du portefeuille.');
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Delete landlord
  const handleConfirmDelete = async () => {
    if (!landlordToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`/landlords/${landlordToDelete.id}`);
      showFormSuccess('Bailleur supprimé.');
      setShowDeleteModal(false);
      await loadLandlords();
    } catch (err) {
      handleFormError(err, 'Impossible de supprimer ce bailleur.');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate All CRG for month/year
  const handleGenerateAllCRG = async () => {
    if (
      !confirm(
        `Voulez-vous générer automatiquement les comptes-rendus de gestion (CRG) pour tous les mandants pour ${MONTHS[selectedMonth - 1]} ${selectedYear} ?`
      )
    )
      return;

    setGeneratingBatch(true);
    try {
      const res = await api.post('/management-reports/generate-all', {
        month: selectedMonth,
        year: selectedYear,
      });
      showFormSuccess(
        `${res.totalGenerated || res.data?.totalGenerated || 'Tous les'} rapports CRG ont été générés avec succès.`
      );
      await loadReports(selectedMonth, selectedYear);
    } catch (err) {
      handleFormError(err, 'Erreur lors de la génération groupée des CRG.');
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Single CRG generation for one landlord
  const handleGenerateSingleCRG = async (landlordId: string) => {
    try {
      await api.post('/management-reports/generate', {
        landlordId,
        month: selectedMonth,
        year: selectedYear,
      });
      showFormSuccess('CRG généré avec succès.');
      setActiveTab('crg');
      await loadReports(selectedMonth, selectedYear);
    } catch (err) {
      handleFormError(err, 'Erreur lors de la génération du CRG.');
    }
  };

  // Mark CRG paid
  const handleMarkReportPaid = async () => {
    if (!reportToPay) return;
    setActionLoading(true);
    try {
      await api.patch(`/management-reports/${reportToPay.id}/status`, {
        status: 'paid',
        paymentRef: paymentRefInput || `VIR-${selectedYear}${String(selectedMonth).padStart(2, '0')}`,
        paidAt: new Date().toISOString(),
      });
      showFormSuccess('Reversement marqué comme payé au bailleur.');
      setShowMarkPaidModal(false);
      await loadReports(selectedMonth, selectedYear);
    } catch (err) {
      handleFormError(err, 'Erreur lors de la mise à jour du statut.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered landlords
  const filteredLandlords = useMemo(() => {
    return landlords.filter((l) => {
      const matchesType = filterType === 'all' || l.type === filterType;
      const searchLower = searchLandlord.toLowerCase();
      const displayName =
        l.type === 'company'
          ? (l.companyName || '').toLowerCase()
          : `${l.firstName || ''} ${l.lastName || ''}`.toLowerCase();
      const matchesSearch =
        !searchLandlord ||
        displayName.includes(searchLower) ||
        (l.email && l.email.toLowerCase().includes(searchLower)) ||
        l.phone.includes(searchLower);
      return matchesType && matchesSearch;
    });
  }, [landlords, filterType, searchLandlord]);

  // CRG Summary Totals for selected month
  const crgTotals = useMemo(() => {
    let gross = 0;
    let fees = 0;
    let tax = 0;
    let maintenance = 0;
    let net = 0;

    reports.forEach((r) => {
      gross += Number(r.grossRentCollected || 0);
      fees += Number(r.managementFees || 0);
      tax += Number(r.feeTaxAmount || 0);
      maintenance += Number(r.maintenanceExpenses || 0);
      net += Number(r.netPayableToLandlord || 0);
    });

    return { gross, fees, tax, maintenance, net, count: reports.length };
  }, [reports]);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(1, 62, 55, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Landmark size={24} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Bailleurs Mandants & CRG
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Gestion des propriétaires, mandats d&apos;agence, commissions et génération de Comptes-Rendus de Gestion certifiés.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeTab === 'landlords' ? (
              <button
                onClick={handleOpenCreateLandlord}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={16} />
                Nouveau Bailleur
              </button>
            ) : (
              <button
                onClick={handleGenerateAllCRG}
                className="btn btn-primary"
                disabled={generatingBatch}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f766e' }}
              >
                <RefreshCw size={16} className={generatingBatch ? 'animate-spin' : ''} />
                {generatingBatch ? 'Calcul en cours...' : `Générer CRG (${MONTHS[selectedMonth - 1]} ${selectedYear})`}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '24px' }}>
          <button
            onClick={() => setActiveTab('landlords')}
            style={{
              padding: '12px 6px',
              fontSize: '0.95rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'landlords' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'landlords' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Users size={18} />
            Propriétaires Mandants
            <span
              style={{
                backgroundColor: activeTab === 'landlords' ? 'rgba(1, 62, 55, 0.12)' : 'var(--border)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {landlords.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('crg');
              loadReports(selectedMonth, selectedYear);
            }}
            style={{
              padding: '12px 6px',
              fontSize: '0.95rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'crg' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'crg' ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Receipt size={18} />
            Comptes-Rendus de Gestion (CRG)
            <span
              style={{
                backgroundColor: activeTab === 'crg' ? '#dcfce7' : 'var(--border)',
                color: activeTab === 'crg' ? '#166534' : 'inherit',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {reports.length}
            </span>
          </button>
        </div>

        {/* TAB 1: LANDLORDS LIST */}
        {activeTab === 'landlords' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter and Search Bar */}
            <div
              className="card"
              style={{
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search
                    size={16}
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, téléphone, entreprise..."
                    value={searchLandlord}
                    onChange={(e) => setSearchLandlord(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '36px', height: '40px' }}
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-control"
                  style={{ width: '180px', height: '40px' }}
                >
                  <option value="all">Tous les types</option>
                  <option value="individual">Particuliers</option>
                  <option value="company">Sociétés / SCI</option>
                </select>
              </div>

              <button
                onClick={loadLandlords}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px' }}
              >
                <RefreshCw size={14} />
                Actualiser
              </button>
            </div>

            {/* Landlord Cards Grid */}
            {filteredLandlords.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Landmark size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text)' }}>
                  Aucun bailleur mandant enregistré
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem' }}>
                  Enregistrez vos propriétaires pour affecter leurs immeubles et automatiser la génération des CRG.
                </p>
                <button onClick={handleOpenCreateLandlord} className="btn btn-primary" style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                  <Plus size={16} /> Ajouter un bailleur
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredLandlords.map((landlord) => {
                  const propertyCount = landlord.properties?.length || landlord._count?.properties || 0;
                  const displayName =
                    landlord.type === 'company'
                      ? landlord.companyName
                      : `${landlord.firstName} ${landlord.lastName}`;

                  return (
                    <div
                      key={landlord.id}
                      className="card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        padding: '20px',
                        gap: '16px',
                      }}
                    >
                      {/* Top identity & badges */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '10px',
                                backgroundColor: landlord.type === 'company' ? '#eff6ff' : '#f0fdf4',
                                color: landlord.type === 'company' ? '#1d4ed8' : '#15803d',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                              }}
                            >
                              {landlord.type === 'company' ? <Building size={20} /> : <Users size={20} />}
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{displayName}</h3>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {landlord.type === 'company' ? 'Société / Mandat Pro' : 'Bailleur Particulier'}
                              </span>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: landlord.isActive ? '#dcfce7' : '#fee2e2',
                              color: landlord.isActive ? '#166534' : '#991b1b',
                            }}
                          >
                            {landlord.isActive ? 'Mandat Actif' : 'Suspendu'}
                          </span>
                        </div>

                        {/* Contacts */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '14px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={14} style={{ color: 'var(--primary)' }} />
                            <span style={{ color: 'var(--text)', fontWeight: 500 }}>{landlord.phone}</span>
                          </div>
                          {landlord.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Mail size={14} style={{ color: 'var(--primary)' }} />
                              <span>{landlord.email}</span>
                            </div>
                          )}
                          {(landlord.address || landlord.city) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={14} style={{ color: 'var(--primary)' }} />
                              <span>{[landlord.address, landlord.city].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Mandate & Fees Details */}
                        <div
                          style={{
                            marginTop: '14px',
                            padding: '12px',
                            backgroundColor: 'var(--background)',
                            borderRadius: '8px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            fontSize: '0.75rem',
                          }}
                        >
                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Honoraires Agence</span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                              {landlord.managementFeeRate}%
                            </strong>{' '}
                            <span style={{ color: 'var(--text-muted)' }}>+ TVA {landlord.feeTaxRate}%</span>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Patrimoine géré</span>
                            <strong style={{ fontSize: '0.9rem' }}>{propertyCount} bien(s)</strong>
                          </div>

                          {(landlord.bankName || landlord.ibanOrRib) && (
                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                              <span style={{ color: 'var(--text-muted)', display: 'block' }}>RIB / Virement :</span>
                              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                {landlord.bankName} - {landlord.ibanOrRib}
                              </span>
                            </div>
                          )}
                          {landlord.mobileMoneyNumber && (
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mobile Money :</span>
                              <span style={{ fontWeight: 600 }}>{landlord.mobileMoneyNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border)',
                          paddingTop: '14px',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => handleOpenPortfolio(landlord)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <Building size={14} />
                          Gérer biens ({propertyCount})
                        </button>

                        <button
                          onClick={() => handleGenerateSingleCRG(landlord.id)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f766e' }}
                          title={`Générer CRG pour ${MONTHS[selectedMonth - 1]}`}
                        >
                          <Receipt size={14} />
                          Générer CRG
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditLandlord(landlord)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 8px' }}
                            title="Modifier la fiche bailleur"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setLandlordToDelete(landlord);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-danger"
                            style={{ padding: '6px 8px' }}
                            title="Supprimer ce bailleur"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRG (MANAGEMENT REPORTS) */}
        {activeTab === 'crg' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Filter Bar: Month & Year Selector */}
            <div
              className="card"
              style={{
                padding: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                background: 'linear-gradient(135deg, rgba(1, 62, 55, 0.03) 0%, rgba(255, 239, 179, 0.05) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)' }}>
                  Période du Compte-Rendu :
                </span>

                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    const m = Number(e.target.value);
                    setSelectedMonth(m);
                    loadReports(m, selectedYear);
                  }}
                  className="form-control"
                  style={{ width: '150px', height: '40px', fontWeight: 600 }}
                >
                  {MONTHS.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const y = Number(e.target.value);
                    setSelectedYear(y);
                    loadReports(selectedMonth, y);
                  }}
                  className="form-control"
                  style={{ width: '100px', height: '40px', fontWeight: 600 }}
                >
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => loadReports(selectedMonth, selectedYear)}
                  className="btn btn-secondary"
                  style={{ height: '40px', padding: '0 12px' }}
                  title="Actualiser la liste"
                >
                  <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              <button
                onClick={handleGenerateAllCRG}
                className="btn btn-primary"
                disabled={generatingBatch}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f766e' }}
              >
                <RefreshCw size={16} className={generatingBatch ? 'animate-spin' : ''} />
                Générer tous les CRG ({MONTHS[selectedMonth - 1]})
              </button>
            </div>

            {/* CRG KPI Aggregation Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  LOYERS BRUTS ENCAISSÉS
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                  {formatFcfa(crgTotals.gross)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{crgTotals.count} bailleur(s) concerné(s)</span>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  HONORAIRES AGENCE PERÇUS
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {formatFcfa(crgTotals.fees + crgTotals.tax)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dont TVA : {formatFcfa(crgTotals.tax)}</span>
              </div>

              <div className="card" style={{ padding: '16px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  DÉPENSES & TRAVAUX DÉDUITS
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                  -{formatFcfa(crgTotals.maintenance)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Interventions validées</span>
              </div>

              <div className="card" style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                  SOLDE NET TOTAL À REVERSER
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                  {formatFcfa(crgTotals.net)}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#166534' }}>Aux propriétaires mandants</span>
              </div>
            </div>

            {/* Reports Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                  Rapports de Gestion Édités ({reports.length})
                </h3>
              </div>

              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <FileText size={42} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.9rem' }}>
                    Aucun compte-rendu de gestion n&apos;a encore été généré pour {MONTHS[selectedMonth - 1]} {selectedYear}.
                  </p>
                  <button
                    onClick={handleGenerateAllCRG}
                    className="btn btn-primary"
                    disabled={generatingBatch}
                    style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                  >
                    <RefreshCw size={14} /> Générer maintenant
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '12px 16px' }}>N° RAPPORT</th>
                        <th style={{ padding: '12px 16px' }}>BAILLEUR MANDANT</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>LOYERS ENCAISSÉS</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>HONORAIRES</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>DÉPENSES DÉDUITES</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>NET À REVERSER</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center' }}>STATUT</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => {
                        const landlordName = report.landlord
                          ? report.landlord.type === 'company'
                            ? report.landlord.companyName
                            : `${report.landlord.firstName} ${report.landlord.lastName}`
                          : 'Bailleur';

                        return (
                          <tr key={report.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>
                              {report.reportNumber}
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600 }}>{landlordName}</div>
                              {report.landlord?.phone && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {report.landlord.phone}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                              {formatFcfa(Number(report.grossRentCollected))}
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--primary)', fontWeight: 600 }}>
                              {formatFcfa(Number(report.managementFees) + Number(report.feeTaxAmount))}
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {report.managementFeeRate}%
                              </div>
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'right', color: '#b91c1c' }}>
                              {report.maintenanceExpenses > 0 ? `-${formatFcfa(Number(report.maintenanceExpenses))}` : '0 FCFA'}
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#15803d' }}>
                                {formatFcfa(Number(report.netPayableToLandlord))}
                              </strong>
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              {report.status === 'paid' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                  }}
                                >
                                  <Check size={12} /> Payé
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                  }}
                                >
                                  À reverser
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                {report.pdfUrl && (
                                  <a
                                    href={api.getFileUrl(report.pdfUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '5px 9px',
                                      fontSize: '0.75rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: '#b91c1c',
                                      borderColor: '#fca5a5',
                                    }}
                                    title="Télécharger le PDF certifié du CRG"
                                  >
                                    <Download size={13} /> PDF
                                  </a>
                                )}

                                {report.status !== 'paid' && (
                                  <button
                                    onClick={() => {
                                      setReportToPay(report);
                                      setPaymentRefInput(`VIR-${selectedYear}${String(selectedMonth).padStart(2, '0')}`);
                                      setShowMarkPaidModal(true);
                                    }}
                                    className="btn btn-primary"
                                    style={{
                                      padding: '5px 9px',
                                      fontSize: '0.75rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      backgroundColor: '#16a34a',
                                    }}
                                  >
                                    <Check size={13} /> Payer
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CREATE / EDIT LANDLORD */}
        {showLandlordModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {editingLandlord ? 'Modifier la Fiche Mandant' : 'Nouveau Propriétaire Mandant'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowLandlordModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitLandlord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Type Selection */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>TYPE DE MANDANT</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'individual' })}
                      className={`btn ${formData.type === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Users size={16} /> Particulier
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'company' })}
                      className={`btn ${formData.type === 'company' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Building size={16} /> Entreprise / SCI
                    </button>
                  </div>
                </div>

                {formData.type === 'individual' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Prénom *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        placeholder="Ex: Amadou"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        placeholder="Ex: Koné"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Raison Sociale / Société *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      placeholder="Ex: SCI Les Oliviers ou Société Immobilière Ivoirienne"
                    />
                  </div>
                )}

                {/* Contact info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Téléphone Mobile (WhatsApp) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+225 07..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email (pour envoi automatique du CRG)</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="bailleur@domaine.com"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Adresse de résidence</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Cocody Danga, Rue des Jardins"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ville</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Abidjan"
                    />
                  </div>
                </div>

                {/* Mandate & Agency Fees Settings */}
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: 'rgba(1, 62, 55, 0.04)',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    border: '1px solid rgba(1, 62, 55, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Percent size={14} /> Barème d&apos;honoraires de gestion agence
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Taux d&apos;honoraires agence (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.managementFeeRate}
                        onChange={(e) => setFormData({ ...formData, managementFeeRate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ex: 10% sur les loyers bruts encaissés</span>
                    </div>

                    <div className="form-group">
                      <label className="form-label">TVA sur honoraires (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.feeTaxRate}
                        onChange={(e) => setFormData({ ...formData, feeTaxRate: parseFloat(e.target.value) || 0 })}
                        required
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ex: 18% (Taux légal en vigueur)</span>
                    </div>
                  </div>
                </div>

                {/* Payment coordinates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text)' }}>
                    Coordonnées de reversement du solde net
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Banque Mandant</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="SGCI, BOA, Ecobank..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Numéro IBAN / RIB / Compte</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.ibanOrRib}
                        onChange={(e) => setFormData({ ...formData, ibanOrRib: e.target.value })}
                        placeholder="CI092 01001 012345678901 23"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Numéro Mobile Money (Optionnel)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobileMoneyNumber}
                      onChange={(e) => setFormData({ ...formData, mobileMoneyNumber: e.target.value })}
                      placeholder="Orange Money / Wave / MTN Momo"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowLandlordModal(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Enregistrement...' : editingLandlord ? 'Mettre à jour' : 'Créer le mandant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE PROPERTY ASSIGNMENT */}
        {showPortfolioModal && selectedLandlordForPortfolio && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '24px',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                    Patrimoine & Biens sous mandat
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Bailleur :{' '}
                    <strong>
                      {selectedLandlordForPortfolio.type === 'company'
                        ? selectedLandlordForPortfolio.companyName
                        : `${selectedLandlordForPortfolio.firstName} ${selectedLandlordForPortfolio.lastName}`}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search properties */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Filtrer les biens par nom ou adresse..."
                  value={portfolioSearch}
                  onChange={(e) => setPortfolioSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              {/* Property list with checkboxes */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {allProperties
                  .filter((p) => {
                    const search = portfolioSearch.toLowerCase();
                    return (
                      !portfolioSearch ||
                      p.name.toLowerCase().includes(search) ||
                      (p.address && p.address.toLowerCase().includes(search))
                    );
                  })
                  .map((property) => {
                    const isChecked = selectedPropertyIds.includes(property.id);
                    const isBuilding = ['building', 'residence', 'villa'].includes(property.type);

                    return (
                      <div
                        key={property.id}
                        onClick={() => handleTogglePropertyAssignment(property.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          backgroundColor: isChecked ? 'rgba(1, 62, 55, 0.06)' : 'transparent',
                          border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{property.name}</span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: isBuilding ? '#eff6ff' : '#f1f5f9',
                                  color: isBuilding ? '#1d4ed8' : '#475569',
                                  fontWeight: 600,
                                }}
                              >
                                {property.type}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {[property.address, property.city].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>

                        {property.landlordId && property.landlordId !== selectedLandlordForPortfolio.id && (
                          <span style={{ fontSize: '0.7rem', color: '#b91c1c', fontWeight: 600 }}>
                            Assigné à un autre bailleur
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <strong>{selectedPropertyIds.length}</strong> bien(s) sélectionné(s)
                </span>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowPortfolioModal(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePortfolio}
                    className="btn btn-primary"
                    disabled={portfolioLoading}
                  >
                    {portfolioLoading ? 'Synchronisation...' : 'Enregistrer le patrimoine'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: MARK REPORT AS PAID */}
        {showMarkPaidModal && reportToPay && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Confirmer le reversement au bailleur
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Rapport {reportToPay.reportNumber}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ fontSize: '0.8125rem', color: '#166534' }}>Montant net à reverser :</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                  {formatFcfa(Number(reportToPay.netPayableToLandlord))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Référence du Virement / Preuve de règlement
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="Ex: VIR-SGCI-20261028-0912"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowMarkPaidModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleMarkReportPaid}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#16a34a' }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Validation...' : 'Valider le paiement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Supprimer ce bailleur mandant"
          message={`Êtes-vous sûr de vouloir supprimer définitivement ${
            landlordToDelete?.type === 'company'
              ? landlordToDelete?.companyName
              : `${landlordToDelete?.firstName} ${landlordToDelete?.lastName}`
          } ? Ses biens seront dissociés.`}
          confirmText="Oui, supprimer"
          cancelText="Annuler"
          type="danger"
          loading={actionLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </Layout>
  );
}
