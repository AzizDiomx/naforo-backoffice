'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { 
  Plus, 
  Gem, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Percent, 
  Sparkles, 
  Check, 
  X, 
  Calendar, 
  Building2, 
  Users2, 
  Edit3, 
  Trash2, 
  Eye, 
  Lock,
  Layers,
  ArrowRight,
  TrendingDown,
  Cpu,
  Award,
  HelpCircle,
  ShieldCheck,
  Info
} from 'lucide-react';

interface PlanFeatureOption {
  code: string;
  label: string;
  hint: string;
  nature: 'software_enforced' | 'service_sla';
  category: 'base' | 'automation' | 'compliance' | 'enterprise';
}

const ALL_FEATURE_OPTIONS: PlanFeatureOption[] = [
  // --- MODULES AVEC CONTRÔLE LOGICIEL ACTIF ---
  { 
    code: 'dashboard', 
    label: 'Tableau de bord & KPIs en direct', 
    hint: 'Accès au module /dashboard (revenus, baux, taux d\'occupation)',
    nature: 'software_enforced', 
    category: 'base' 
  },
  { 
    code: 'standard_pdf', 
    label: 'Quittances & Factures PDF standard', 
    hint: 'Moteur PDFKit Naforo pour génération de quittances et factures',
    nature: 'software_enforced', 
    category: 'base' 
  },
  { 
    code: 'email_reminders', 
    label: 'Relances Email automatiques', 
    hint: 'Jobs programmés Bull Queue & Nodemailer à J-15..J+15',
    nature: 'software_enforced', 
    category: 'base' 
  },
  { 
    code: 'sms_whatsapp', 
    label: 'Relances SMS automatiques (Twilio)', 
    hint: 'Conditionne l\'envoi des alertes et rappels de loyer par SMS aux locataires',
    nature: 'software_enforced', 
    category: 'automation' 
  },
  { 
    code: 'mobile_money_autovalidate', 
    label: 'Paiements Mobile Money (Wave, Orange, MTN, Moov)', 
    hint: 'Activation des déclarations d\'encaissement Mobile Money dans /payments',
    nature: 'software_enforced', 
    category: 'automation' 
  },
  { 
    code: 'qr_code_verification', 
    label: 'Tampon QR Code cryptographique infalsifiable', 
    hint: 'Signature HMAC SHA-256 et URL de vérification publique des quittances',
    nature: 'software_enforced', 
    category: 'compliance' 
  },
  { 
    code: 'excel_export', 
    label: 'Exports comptables Excel (.xlsx) & DGI', 
    hint: 'Débloque les boutons d\'export Excel dans /accounting et route API',
    nature: 'software_enforced', 
    category: 'compliance' 
  },
  { 
    code: 'ged_vault', 
    label: 'Coffre-fort GED & Pièces justificatives', 
    hint: 'Déverrouille l\'accès au menu et à l\'API /documents',
    nature: 'software_enforced', 
    category: 'base' 
  },
  { 
    code: 'chat_encrypted', 
    label: 'Messagerie locataires chiffrée AES-256', 
    hint: 'Déverrouille la messagerie instantanée /chat et l\'API des conversations',
    nature: 'software_enforced', 
    category: 'automation' 
  },
  { 
    code: 'incident_management', 
    label: 'Gestion des pannes & tickets d\'intervention', 
    hint: 'Accès complet au workflow de signalement et résolution /incidents',
    nature: 'software_enforced', 
    category: 'base' 
  },
  { 
    code: 'multi_users', 
    label: 'Accès multi-gestionnaires & collaborateurs RBAC', 
    hint: 'Contrôle la création de collaborateurs dans /users (Starter: 1, Pro: 2, Expert: illimité)',
    nature: 'software_enforced', 
    category: 'enterprise' 
  },

  // --- ENGAGEMENTS COMMERCIAUX & SERVICE / SLA ---
  { 
    code: 'agency_mandates', 
    label: 'Mandats de gérance & multi-bailleurs', 
    hint: 'Mention contractuelle pour cabinets de gestion immobilière',
    nature: 'service_sla', 
    category: 'enterprise' 
  },
  { 
    code: 'api_webhooks', 
    label: 'Accès API REST & Intégrations Webhooks', 
    hint: 'Mise à disposition des clés d\'API et documentation pour intégrations tierces',
    nature: 'service_sla', 
    category: 'enterprise' 
  },
  { 
    code: 'priority_support_sla', 
    label: 'Gestionnaire dédié & SLA Support 99.9%', 
    hint: 'Assistance téléphonique prioritaire avec engagement contractuel',
    nature: 'service_sla', 
    category: 'enterprise' 
  },
];

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Modal states
  const [showForm, setShowForm] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Delete Modal states
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthlyXof, setPriceMonthlyXof] = useState<string>('24900');
  const [yearlyDiscountPercent, setYearlyDiscountPercent] = useState<string>('20');
  const [maxProperties, setMaxProperties] = useState<string>('15');
  const [maxTenants, setMaxTenants] = useState<string>('15');
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'email_reminders', 'sms_whatsapp', 'mobile_money_autovalidate', 'qr_code_verification', 'excel_export', 'ged_vault'
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');

  const loadData = () => {
    setLoading(true);
    setError(null);
    api.get('/subscriptions/plans?includeInactive=true')
      .then(res => {
        const pList = Array.isArray(res) ? res : res?.data || res?.items || [];
        setPlans(pList);
        setLoading(false);
      })
      .catch((err) => {
        setError("Impossible de charger les offres d'abonnement.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const openCreateModal = () => {
    setEditingPlanId(null);
    setName('');
    setCode('');
    setDescription('');
    setPriceMonthlyXof('24900');
    setYearlyDiscountPercent('20');
    setMaxProperties('15');
    setMaxTenants('15');
    setIsRecommended(false);
    setSelectedFeatures(['email_reminders', 'sms_whatsapp', 'mobile_money_autovalidate', 'qr_code_verification', 'excel_export', 'ged_vault']);
    setShowForm(true);
  };

  const openEditModal = (p: any) => {
    setEditingPlanId(p.id);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description || '');
    setPriceMonthlyXof(String(p.priceMonthlyXof || 0));
    setYearlyDiscountPercent(String(p.yearlyDiscountPercent ?? 20));
    setMaxProperties(String(p.maxProperties || 15));
    setMaxTenants(String(p.maxTenants || 15));
    setIsRecommended(Boolean(p.isRecommended));

    let fList: string[] = [];
    try {
      fList = typeof p.features === 'string' ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : []);
    } catch {
      fList = [];
    }
    setSelectedFeatures(fList);
    setShowForm(true);
  };

  const toggleFeature = (featCode: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featCode) ? prev.filter(c => c !== featCode) : [...prev, featCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      code,
      description: description || undefined,
      priceMonthlyXof: Number(priceMonthlyXof),
      yearlyDiscountPercent: Number(yearlyDiscountPercent),
      maxProperties: Number(maxProperties),
      maxTenants: Number(maxTenants),
      isRecommended,
      features: selectedFeatures,
    };

    try {
      if (editingPlanId) {
        await api.put(`/subscriptions/plans/${editingPlanId}`, payload);
        setSuccess(`L'offre "${name}" a été mise à jour avec succès.`);
      } else {
        await api.post('/subscriptions/plans', payload);
        setSuccess(`La nouvelle formule "${name}" a été créée avec succès.`);
      }
      setShowForm(false);
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Une erreur est survenue lors de l'enregistrement de l'offre.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deleteTargetPlan) return;
    setDeleteLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/subscriptions/plans/${deleteTargetPlan.id}`);
      setSuccess(`L'offre "${deleteTargetPlan.name}" a été définitivement supprimée avec succès.`);
      setDeleteTargetPlan(null);
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Une erreur est survenue lors de la suppression de l'offre.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isEditingStarter = editingPlanId ? (plans.find(p => p.id === editingPlanId)?.code === 'starter') : false;

  const softwareEnforcedFeatures = ALL_FEATURE_OPTIONS.filter(f => f.nature === 'software_enforced');
  const serviceSlaFeatures = ALL_FEATURE_OPTIONS.filter(f => f.nature === 'service_sla');

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement du catalogue des offres d'abonnement Naforo...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        
        {/* HEADER SECTION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 14px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 800, color: '#15803d', marginBottom: 8 }}>
              <Gem size={14} color="#16a34a" /> CATALOGUE SAAS & ABONNEMENTS Naforo
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Gestion Globale des Offres & Tarifs
            </h1>
            <p style={{ color: '#475569', fontSize: '0.9rem', marginTop: 4 }}>
              Définissez le prix mensuel, les remises annuelles, les quotas de biens et configurez les modules actifs et engagements SLA par formule.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '12px 24px',
              fontSize: '0.875rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(1, 62, 55,0.3)'
            }}
          >
            <Plus size={18} /> Créer une Nouvelle Offre
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: 16, color: '#991b1b', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={20} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 14, padding: 16, color: '#166534', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span>{success}</span>
          </div>
        )}

        {/* EXPLICIT LEGEND BANNER FOR BADGES */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '16px 22px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HelpCircle size={18} color="#64748b" />
            <span style={{ fontWeight: 800, color: '#0f172a' }}>Comprendre les Badges de Fonctionnalités :</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0'
              }}>
                <Cpu size={13} /> Contrôle Logiciel Actif
              </span>
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Active ou verrouille directement l'écran, le bouton ou l'API dans le code</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: '0.72rem',
                fontWeight: 800,
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe'
              }}>
                <Award size={13} /> Engagement Commercial & SLA
              </span>
              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>Mention contractuelle et niveau de service promis (sans verrou logiciel direct)</span>
            </div>
          </div>
        </div>

        {/* SAAS INTEGRITY RULES BANNER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '14px 22px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 800 }}>
            <ShieldCheck size={18} />
            <span>Règles de Gestion & Intégrité SaaS :</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', color: '#166534', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <strong>1. Grandfathering :</strong> Suppression impossible si abonnés actifs (utiliser Bloquer/Archiver)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <strong>2. Socle Starter :</strong> 0 FCFA intangible, non supprimable et non blocable
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <strong>3. Recommandation :</strong> Exclusivité d'une seule formule star en vitrine
            </span>
          </div>
        </div>

        {/* KPI METRICS OVERVIEW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>OFFRES ENREGISTRÉES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
              {plans.length} Formules
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ color: '#16a34a' }}>● {plans.filter(p => p.isActive !== false).length} actives</span>
              <span style={{ color: '#dc2626' }}>● {plans.filter(p => p.isActive === false).length} bloquées</span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>MODULES APPLICATIFS EN CODE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', marginTop: 4 }}>11 Modules</div>
            <span style={{ fontSize: '0.725rem', color: '#15803d', fontWeight: 700 }}>Contrôle logiciel actif & sécurisé</span>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#64748b', fontSize: '0.775rem', fontWeight: 800 }}>ENGAGEMENTS COMMERCIAUX & SLA</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>3 Options</div>
            <span style={{ fontSize: '0.725rem', color: '#2563eb', fontWeight: 700 }}>Support garanti & mandats agences</span>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, backgroundColor: '#f1f5f9', padding: '4px', borderRadius: 12 }}>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.8rem',
                backgroundColor: filterStatus === 'all' ? 'var(--primary)' : 'transparent',
                color: filterStatus === 'all' ? '#ffffff' : '#64748b',
                boxShadow: filterStatus === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Toutes les formules ({plans.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('active')}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.8rem',
                backgroundColor: filterStatus === 'active' ? '#16a34a' : 'transparent',
                color: filterStatus === 'active' ? '#ffffff' : '#64748b',
                boxShadow: filterStatus === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Actives ({plans.filter(p => p.isActive !== false).length})
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus('blocked')}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '0.8rem',
                backgroundColor: filterStatus === 'blocked' ? '#dc2626' : 'transparent',
                color: filterStatus === 'blocked' ? '#ffffff' : '#64748b',
                boxShadow: filterStatus === 'blocked' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Bloquées / Archivées ({plans.filter(p => p.isActive === false).length})
            </button>
          </div>
        </div>

        {/* PLANS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {plans.filter(p => {
            if (filterStatus === 'active') return p.isActive !== false;
            if (filterStatus === 'blocked') return p.isActive === false;
            return true;
          }).map((p) => {
            const isBlocked = p.isActive === false;
            const monthlyPrice = Number(p.priceMonthlyXof || 0);
            const discountPercent = Number(p.yearlyDiscountPercent ?? 20);
            const yearlyMonthlyPrice = Math.round(monthlyPrice * (1 - discountPercent / 100));
            
            let featureArray: string[] = [];
            try {
              featureArray = typeof p.features === 'string' ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : []);
            } catch {
              featureArray = [];
            }

            const includedSoftwareCount = softwareEnforcedFeatures.filter(f => featureArray.includes(f.code)).length;
            const includedServiceCount = serviceSlaFeatures.filter(f => featureArray.includes(f.code)).length;

            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: isBlocked ? '#fcfcfc' : '#ffffff',
                  border: isBlocked 
                    ? '1.5px dashed #cbd5e1' 
                    : (p.isRecommended ? '2.5px solid var(--primary)' : '1px solid #e2e8f0'),
                  borderRadius: 24,
                  padding: 28,
                  position: 'relative',
                  opacity: isBlocked ? 0.92 : 1,
                  boxShadow: p.isRecommended ? '0 12px 30px rgba(1, 62, 55,0.12)' : '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {p.isRecommended && (
                  <div style={{
                    position: 'absolute',
                    top: -14,
                    right: 24,
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    padding: '4px 16px',
                    borderRadius: 50,
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    boxShadow: '0 4px 12px rgba(1, 62, 55,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Sparkles size={14} /> RECOMMANDÉ
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: isBlocked ? '#475569' : '#0f172a', margin: 0 }}>
                      {p.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ 
                        backgroundColor: isBlocked ? '#fef2f2' : '#f0fdf4', 
                        color: isBlocked ? '#dc2626' : '#16a34a', 
                        border: `1px solid ${isBlocked ? '#fecaca' : '#bbf7d0'}`, 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        padding: '2px 8px', 
                        borderRadius: 20 
                      }}>
                        {isBlocked ? '● Bloquée / Archivée' : '● Offre Active'}
                      </span>
                      <span style={{ 
                        backgroundColor: (p._count?.subscriptions || 0) > 0 ? '#eff6ff' : '#f8fafc', 
                        color: (p._count?.subscriptions || 0) > 0 ? '#1d4ed8' : '#64748b', 
                        border: `1px solid ${(p._count?.subscriptions || 0) > 0 ? '#bfdbfe' : '#e2e8f0'}`, 
                        fontSize: '0.72rem', 
                        fontWeight: 800, 
                        padding: '2px 8px', 
                        borderRadius: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Building2 size={12} /> {p._count?.subscriptions || 0} agence{(p._count?.subscriptions || 0) > 1 ? 's' : ''} abonnée{(p._count?.subscriptions || 0) > 1 ? 's' : ''}
                      </span>
                      {p.code === 'starter' && (
                        <span style={{ 
                          backgroundColor: '#f5f3ff', 
                          color: '#6d28d9', 
                          border: '1px solid #ddd6fe', 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <ShieldCheck size={12} /> Socle Système Protégé
                        </span>
                      )}
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        Code: {p.code}
                      </span>
                    </div>
                  </div>

                  {isBlocked && (
                    <div style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 10,
                      backgroundColor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      fontSize: '0.75rem',
                      color: '#9f1239',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <Lock size={13} /> Cette formule est masquée aux nouveaux clients. Les abonnements déjà souscrits restent actifs jusqu'à échéance.
                    </div>
                  )}

                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 6, minHeight: 40 }}>
                    {p.description || 'Description personnalisée de l\'offre'}
                  </p>

                  {/* PRICING DISPLAY */}
                  <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
                        {formatFcfa(monthlyPrice)}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>/ mois (Mensuel)</span>
                    </div>

                    {discountPercent > 0 && monthlyPrice > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#16a34a' }}>
                            {formatFcfa(yearlyMonthlyPrice)} / mois
                          </span>
                          <span style={{ fontSize: '0.725rem', color: '#475569', display: 'block' }}>en facturation annuelle</span>
                        </div>
                        <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 900, padding: '4px 10px', borderRadius: 20 }}>
                          -{discountPercent}% Remise
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QUOTAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
                    <div style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '0.725rem', color: '#1e40af', fontWeight: 800 }}>BIENS IMMOBILIERS</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e3a8a', marginTop: 2 }}>
                        {p.maxProperties >= 9999 ? 'Illimité' : `${p.maxProperties} Max`}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.725rem', color: '#166534', fontWeight: 800 }}>LOCATAIRES ACTIFS</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#14532d', marginTop: 2 }}>
                        {p.maxTenants >= 9999 ? 'Illimité' : `${p.maxTenants} Max`}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: SOFTWARE-ENFORCED MODULES */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Cpu size={14} color="#15803d" /> Modules Applicatifs Débloqués ({includedSoftwareCount}/{softwareEnforcedFeatures.length})
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        border: '1px solid #bbf7d0'
                      }}>
                        Contrôle Logiciel Actif
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {softwareEnforcedFeatures.map((feat) => {
                        const isIncluded = featureArray.includes(feat.code);
                        return (
                          <div 
                            key={feat.code} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              gap: 8, 
                              fontSize: '0.8rem', 
                              color: isIncluded ? '#0f172a' : '#94a3b8', 
                              fontWeight: isIncluded ? 700 : 400,
                              padding: '4px 6px',
                              borderRadius: 6,
                              backgroundColor: isIncluded ? '#f8fafc' : 'transparent'
                            }}
                            title={feat.hint}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                              {isIncluded ? (
                                <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                              ) : (
                                <X size={15} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              )}
                              <span style={{ textDecoration: isIncluded ? 'none' : 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {feat.label}
                              </span>
                            </div>

                            {isIncluded && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: '#166534',
                                backgroundColor: '#dcfce7',
                                padding: '1px 6px',
                                borderRadius: 4,
                                flexShrink: 0
                              }}>
                                Actif
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECTION 2: SERVICE & SLA COMMITMENTS */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Award size={14} color="#1d4ed8" /> Services & Engagements SLA ({includedServiceCount}/{serviceSlaFeatures.length})
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 4,
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe'
                      }}>
                        Engagement Commercial & SLA
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {serviceSlaFeatures.map((feat) => {
                        const isIncluded = featureArray.includes(feat.code);
                        return (
                          <div 
                            key={feat.code} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              gap: 8, 
                              fontSize: '0.8rem', 
                              color: isIncluded ? '#0f172a' : '#94a3b8', 
                              fontWeight: isIncluded ? 700 : 400,
                              padding: '4px 6px',
                              borderRadius: 6,
                              backgroundColor: isIncluded ? '#f8fafc' : 'transparent'
                            }}
                            title={feat.hint}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                              {isIncluded ? (
                                <CheckCircle2 size={15} color="#2563eb" style={{ flexShrink: 0 }} />
                              ) : (
                                <X size={15} color="#cbd5e1" style={{ flexShrink: 0 }} />
                              )}
                              <span style={{ textDecoration: isIncluded ? 'none' : 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {feat.label}
                              </span>
                            </div>

                            {isIncluded && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: '#1e40af',
                                backgroundColor: '#dbeafe',
                                padding: '1px 6px',
                                borderRadius: 4,
                                flexShrink: 0
                              }}>
                                Inclus
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* EDIT, BLOCK/UNBLOCK & DELETE ACTION BUTTONS */}
                <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => openEditModal(p)}
                    style={{
                      flex: 1,
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '10px',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <Edit3 size={16} /> Modifier
                  </button>

                  {p.code === 'starter' ? (
                    <button
                      disabled
                      title="Le forfait Starter est indispensable à l'onboarding et ne peut pas être bloqué ou archivé."
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        color: '#94a3b8',
                        padding: '10px 12px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Lock size={15} /> Bloquer
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await api.patch(`/subscriptions/plans/${p.id}/status`, { isActive: isBlocked });
                          setSuccess(`Offre "${p.name}" ${isBlocked ? 'débloquée et réactivée' : 'bloquée/archivée'} avec succès.`);
                          loadData();
                        } catch (err: any) {
                          if (err instanceof ApiError) setError(err.message);
                          else setError("Erreur lors du changement d'état de l'offre.");
                        }
                      }}
                      style={{
                        backgroundColor: isBlocked ? '#f0fdf4' : '#fef2f2',
                        border: isBlocked ? '1.5px solid #86efac' : '1.5px solid #fca5a5',
                        color: isBlocked ? '#16a34a' : '#dc2626',
                        padding: '10px 12px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {isBlocked ? <CheckCircle2 size={15} /> : <Lock size={15} />}
                      {isBlocked ? 'Débloquer' : 'Bloquer'}
                    </button>
                  )}

                  {/* SUPPRESSION / PROTECTION GRANDFATHERING */}
                  {p.code === 'starter' ? (
                    <button
                      disabled
                      title="Le forfait Starter est le socle système obligatoire de Naforo et ne peut jamais être supprimé."
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        color: '#94a3b8',
                        padding: '10px 12px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  ) : (p._count?.subscriptions || 0) > 0 ? (
                    <button
                      disabled
                      title={`Suppression impossible : ${p._count.subscriptions} agence(s) sont abonnées à cette offre. Règle de Grandfathering : utilisez le bouton Bloquer pour fermer les souscriptions tout en préservant les contrats en cours.`}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        color: '#94a3b8',
                        padding: '10px 12px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Lock size={14} />
                      <span style={{ fontSize: '0.72rem' }}>Verrouillé</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteTargetPlan(p)}
                      title="Supprimer définitivement cette formule (aucune agence n'y est abonnée)"
                      style={{
                        backgroundColor: '#fff1f2',
                        border: '1.5px solid #fecdd3',
                        color: '#e11d48',
                        padding: '10px 12px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL CREATION / EDITION FORM */}
        {showForm && (
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
            padding: 16
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 32,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {editingPlanId ? `Modifier l'offre : ${name}` : 'Créer une Nouvelle Formule'}
                  </h2>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '4px 0 0 0' }}>
                    Configurez les tarifs, quotas volumétriques et sélectionnez les modules applicatifs et engagements SLA.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={22} />
                </button>
              </div>

              {isEditingStarter && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <ShieldCheck size={20} />
                  <span>
                    <strong>Forfait Socle Système Protégé :</strong> Cette offre est le forfait d'accueil gratuit obligatoire lors de l'inscription des agences. Son code et sa gratuité (0 FCFA) sont intangibles.
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* NOM & CODE UNIQUE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      NOM PUBLIC DE LA FORMULE *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pro / Sérénité"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      CODE IDENTIFIANT UNIQUE *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: pro, starter, expert"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      required
                      disabled={Boolean(editingPlanId)}
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', backgroundColor: editingPlanId ? '#f1f5f9' : '#ffffff' }}
                    />
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                    DESCRIPTION COMMERCIALE (ACCROCHE)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Idéale pour les bailleurs particuliers gérant jusqu'à 15 logements..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                {/* PRIX MENSUEL & REMISE ANNUELLE */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      PRIX MENSUEL (FCFA / MOIS) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 24900 (0 pour gratuit)"
                      value={isEditingStarter ? '0' : priceMonthlyXof}
                      onChange={(e) => setPriceMonthlyXof(e.target.value)}
                      required
                      disabled={isEditingStarter}
                      style={{ 
                        width: '100%', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: 10, 
                        padding: '10px 14px', 
                        fontSize: '0.9rem', 
                        outline: 'none', 
                        fontWeight: 700,
                        backgroundColor: isEditingStarter ? '#f1f5f9' : '#ffffff'
                      }}
                    />
                    {isEditingStarter && (
                      <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        ● Gratuité obligatoire (0 FCFA) pour l'offre Starter
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      REMISE SUR FACTURATION ANNUELLE (%)
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 20"
                      value={yearlyDiscountPercent}
                      onChange={(e) => setYearlyDiscountPercent(e.target.value)}
                      min="0"
                      max="100"
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* QUOTAS VOLUMÉTRIQUES */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      QUOTA BIENS IMMOBILIERS MAX *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 15 (Saisir 9999 pour illimité)"
                      value={maxProperties}
                      onChange={(e) => setMaxProperties(e.target.value)}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', fontWeight: 600 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: 6 }}>
                      QUOTA LOCATAIRES ACTIFS MAX *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 15 (Saisir 9999 pour illimité)"
                      value={maxTenants}
                      onChange={(e) => setMaxTenants(e.target.value)}
                      required
                      style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: '0.9rem', outline: 'none', fontWeight: 600 }}
                    />
                  </div>
                </div>

                {/* FEATURE SELECTOR SECTION 1: SOFTWARE ENFORCED */}
                <div style={{ border: '1px solid #bbf7d0', borderRadius: 14, padding: 18, backgroundColor: '#f0fdf4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Cpu size={16} /> 1. Modules Applicatifs & Automatisations
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: '#ffffff',
                      color: '#15803d',
                      border: '1px solid #86efac'
                    }}>
                      Contrôle Logiciel Actif
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#166534', margin: '0 0 12px 0' }}>
                    Ces fonctionnalités activent ou restreignent directement les écrans, boutons et endpoints d'API dans l'application.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {softwareEnforcedFeatures.map((feat) => {
                      const isChecked = selectedFeatures.includes(feat.code);
                      return (
                        <label
                          key={feat.code}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: '0.825rem',
                            backgroundColor: isChecked ? '#ffffff' : '#f8fafc',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: isChecked ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFeature(feat.code)}
                              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontWeight: 800, color: isChecked ? '#0f172a' : '#64748b' }}>
                              {feat.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', paddingLeft: 24 }}>
                            {feat.hint}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* FEATURE SELECTOR SECTION 2: SERVICE & SLA */}
                <div style={{ border: '1px solid #bfdbfe', borderRadius: 14, padding: 18, backgroundColor: '#eff6ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 900, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={16} /> 2. Engagements Commerciaux & Support SLA
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      backgroundColor: '#ffffff',
                      color: '#1d4ed8',
                      border: '1px solid #93c5fd'
                    }}>
                      Engagement Commercial & SLA
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#1e40af', margin: '0 0 12px 0' }}>
                    Ces options enrichissent la proposition de valeur commerciale du forfait sans blocage logiciel direct.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                    {serviceSlaFeatures.map((feat) => {
                      const isChecked = selectedFeatures.includes(feat.code);
                      return (
                        <label
                          key={feat.code}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            fontSize: '0.825rem',
                            backgroundColor: isChecked ? '#ffffff' : '#f8fafc',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: isChecked ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFeature(feat.code)}
                              style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                            />
                            <span style={{ fontWeight: 800, color: isChecked ? '#0f172a' : '#64748b' }}>
                              {feat.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', paddingLeft: 24 }}>
                            {feat.hint}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* IS RECOMMENDED TOGGLE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: 14, borderRadius: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      id="recToggle"
                      checked={isRecommended}
                      onChange={(e) => setIsRecommended(e.target.checked)}
                      style={{ width: 18, height: 18, accentColor: '#d97706' }}
                    />
                    <label htmlFor="recToggle" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309', cursor: 'pointer' }}>
                      Mettre en avant cette formule comme "RECOMMANDÉE" (Badge Doré ⭐)
                    </label>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#92400e', paddingLeft: 30 }}>
                    Règle SaaS : Une seule formule peut être recommandée à la fois. Cocher cette case retirera automatiquement la recommandation des autres formules.
                  </span>
                </div>

                {/* SUBMIT BUTTONS */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 12,
                      border: 'none',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {actionLoading ? 'Enregistrement...' : (editingPlanId ? 'Enregistrer les Modifications' : 'Créer la Formule')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMATION DE SUPPRESSION SÉCURISÉE (ORPHELINS SEULEMENT) */}
        {deleteTargetPlan && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 24,
              maxWidth: 520,
              width: '100%',
              padding: 32,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Supprimer définitivement l'offre ?
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Formule : <strong>{deleteTargetPlan.name}</strong> (code: <code>{deleteTargetPlan.code}</code>)
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>
                  <CheckCircle2 size={16} /> Règle SaaS validée : 0 agence abonnée
                </div>
                <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Cette offre n'a aucun abonnement actif ni historique de paiement rattaché. Sa suppression n'affectera aucun client et la retirera définitivement de la base de données.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setDeleteTargetPlan(null)}
                  disabled={deleteLoading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeletePlan}
                  disabled={deleteLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  {deleteLoading ? 'Suppression en cours...' : 'Confirmer la suppression'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
