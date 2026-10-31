'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  Award, 
  Briefcase, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Building,
  DollarSign,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Upload,
  ExternalLink
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

const ID_TYPE_LABELS: Record<string, string> = {
  cni: 'Carte Nationale d\'Identité (CNI)',
  passport: 'Passeport',
  attestation: 'Attestation d\'Identité (ONECI)',
  consular_card: 'Carte Consulaire',
  residence_permit: 'Titre de Séjour / Carte de Résident',
};

export default function TenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [uploadingIdDoc, setUploadingIdDoc] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadIdDocDirect = async (file: File) => {
    setUploadingIdDoc(true);
    try {
      const formData = new FormData();
      formData.append('idDocument', file);
      if (tenant?.nationalId) formData.append('nationalId', tenant.nationalId);
      if (tenant?.nationalIdType) formData.append('nationalIdType', tenant.nationalIdType);
      const updated = await api.upload(`/tenant-profiles/${id}/id-document`, formData);
      setTenant((prev: any) => ({ ...prev, ...updated }));
      showFormSuccess('Pièce d\'identité téléversée et archivée avec succès !');
    } catch (err) {
      handleFormError(err, 'Erreur lors du téléversement de la pièce d\'identité.');
    } finally {
      setUploadingIdDoc(false);
    }
  };

  const handleRecalculateRisk = async () => {
    setScoringLoading(true);
    try {
      const res = await api.post(`/tenant-profiles/${id}/recalculate-risk`);
      showFormSuccess('Score prédictif et facteurs de risque actualisés.');
      setTenant((prev: any) => ({
        ...prev,
        ...res,
      }));
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’actualisation du score de risque.');
    } finally {
      setScoringLoading(false);
    }
  };

  const loadTenant = () => {
    setLoading(true);
    setError(null);
    api.get(`/tenant-profiles/${id}`)
      .then(res => {
        setTenant(res);
        setLoading(false);
      })
      .catch((err) => {
        const parsed = handleFormError(err, "Impossible de charger la fiche locataire.");
        setError(parsed.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      loadTenant();
    }
  }, [id]);

  const confirmDeleteTenant = async () => {
    setActionLoading(true);
    setError(null);

    try {
      await api.delete(`/tenant-profiles/${id}`);
      showFormSuccess('Fiche locataire supprimée avec succès.');
      setTimeout(() => {
        window.location.href = '/tenants';
      }, 500);
    } catch (err) {
      const parsed = handleFormError(err, "Erreur lors de la suppression du locataire. Vérifiez qu'aucun contrat actif n'y soit lié.");
      setError(parsed.message);
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 90) return <span className="badge badge-success" style={{ fontWeight: 'bold' }}>{score}/100 Excellent</span>;
    if (score >= 70) return <span className="badge badge-warning" style={{ fontWeight: 'bold' }}>{score}/100 Correct</span>;
    return <span className="badge badge-danger" style={{ fontWeight: 'bold' }}>{score}/100 Risqué</span>;
  };

  const getReliabilityBarColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 70) return 'var(--warning)';
    return 'var(--danger)';
  };

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement du dossier locataire...
        </div>
      </Layout>
    );
  }

  if (!tenant) {
    return (
      <Layout>
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px' }} />
          <p>Le locataire demandé est introuvable.</p>
          <Link href="/tenants" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/tenants" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            Retour aux résidents
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href={`/tenants/${id}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={16} />
              Modifier
            </Link>
            <button 
              onClick={() => setShowDeleteModal(true)} 
              className="btn btn-danger" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              disabled={actionLoading}
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius)', padding: '16px', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tenant Header card */}
        <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            backgroundColor: 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)'
          }}>
            <User size={32} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{tenant.firstName} {tenant.lastName}</h1>
              {getReliabilityBadge(tenant.reliabilityScore)}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} />
                {tenant.phone}
              </span>
              {tenant.email && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} />
                  {tenant.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info detail grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Main Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Box 1: Professional details */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                Dossier Professionnel & Administratif
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROFESSION SOUMISE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                    <Briefcase size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{tenant.profession || 'Non spécifiée'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EMPLOYEUR / ENTREPRISE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
                    <Award size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{tenant.employer || 'Non spécifié'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REVENUS DÉCLARÉS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.875rem', color: 'var(--success)' }}>
                    <DollarSign size={16} />
                    <span>{tenant.monthlyIncome ? formatFcfa(Number(tenant.monthlyIncome)) : 'Non spécifiés'}</span>
                  </div>
                </div>
              </div>

              {/* Bloc Justificatif d'Identité (CNI / Passeport + Pièce numérique) */}
              <div style={{
                marginTop: '10px',
                borderTop: '1px solid var(--border)',
                paddingTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} style={{ color: 'var(--primary)' }} />
                    JUSTIFICATIF D&apos;IDENTITÉ ({ID_TYPE_LABELS[tenant.nationalIdType || 'cni'] || 'CNI / Passeport'})
                  </span>
                  {tenant.nationalIdDocUrl ? (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> Copie numérique archivée
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> Aucune copie numérique jointe
                    </span>
                  )}
                </div>

                <div style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>
                      Numéro de pièce : <strong>{tenant.nationalId || 'Non renseigné'}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Type : {ID_TYPE_LABELS[tenant.nationalIdType || 'cni'] || 'CNI / Passeport'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {tenant.nationalIdDocUrl && (
                      <a
                        href={api.getFileUrl(tenant.nationalIdDocUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        style={{
                          padding: '7px 14px',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} /> Voir / Télécharger la pièce
                      </a>
                    )}

                    <label
                      className="btn btn-secondary"
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: uploadingIdDoc ? 'not-allowed' : 'pointer',
                        margin: 0
                      }}
                    >
                      <Upload size={14} />
                      {uploadingIdDoc
                        ? 'Téléversement...'
                        : tenant.nationalIdDocUrl
                        ? 'Remplacer la pièce'
                        : 'Téléverser la pièce (CNI / Passeport)'}
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        disabled={uploadingIdDoc}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadIdDocDirect(f);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {tenant.notes && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>NOTES INTERNES</span>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'pre-line' }}>{tenant.notes}</p>
                </div>
              )}
            </div>

            {/* Box 2: Contracts and Invoices history */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                Historique des Locations & Bails
              </h2>
              {(!tenant.contracts || tenant.contracts.length === 0) ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>Aucun contrat actif ou passé associé à ce locataire.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tenant.contracts.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Building size={20} style={{ color: 'var(--primary)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '700' }}>Bien : {c.property?.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Contrat N° {c.contractNumber} • Loyer : {formatFcfa(Number(c.rentAmount))}</span>
                        </div>
                      </div>
                      <Link href={`/contracts/${c.id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        Consulter bail
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Predictive Risk Scoring Card (Expert Tier) */}
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                border: '1px solid var(--border)',
                background: 'linear-gradient(135deg, rgba(1, 62, 55, 0.02) 0%, rgba(255, 239, 179, 0.06) 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text)' }}>
                    Scoring Prédictif d&apos;Impayé
                  </span>
                </div>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor:
                      tenant.riskLevel === 'critical'
                        ? '#fee2e2'
                        : tenant.riskLevel === 'high'
                        ? '#ffedd5'
                        : tenant.riskLevel === 'medium'
                        ? '#fef9c3'
                        : '#dcfce7',
                    color:
                      tenant.riskLevel === 'critical'
                        ? '#b91c1c'
                        : tenant.riskLevel === 'high'
                        ? '#c2410c'
                        : tenant.riskLevel === 'medium'
                        ? '#854d0e'
                        : '#166534',
                  }}
                >
                  {tenant.riskLevel === 'critical'
                    ? 'Risque Critique'
                    : tenant.riskLevel === 'high'
                    ? 'Risque Élevé'
                    : tenant.riskLevel === 'medium'
                    ? 'Risque Modéré'
                    : 'Risque Faible'}
                </span>
              </div>

              {/* Default Probability Gauge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Probabilité de défaut calculée</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color:
                        (tenant.predictedDefaultProbability || 5) >= 50
                          ? '#b91c1c'
                          : (tenant.predictedDefaultProbability || 5) >= 25
                          ? '#c2410c'
                          : '#166534',
                    }}
                  >
                    {tenant.predictedDefaultProbability ?? 5}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div
                    style={{
                      width: `${Math.min(100, tenant.predictedDefaultProbability ?? 5)}%`,
                      height: '100%',
                      backgroundColor:
                        (tenant.predictedDefaultProbability || 5) >= 50
                          ? '#dc2626'
                          : (tenant.predictedDefaultProbability || 5) >= 25
                          ? '#f59e0b'
                          : '#16a34a',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Risk Factors List */}
              {Array.isArray(tenant.riskFactors) && tenant.riskFactors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Facteurs déterminants :
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {tenant.riskFactors.map((factor: string, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.75rem',
                          color: 'var(--text)',
                          backgroundColor: '#ffffff',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <AlertCircle size={12} style={{ color: '#d97706', flexShrink: 0 }} />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recalculate Button */}
              <button
                type="button"
                onClick={handleRecalculateRisk}
                disabled={scoringLoading}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  marginTop: '4px',
                }}
              >
                <RefreshCw size={12} className={scoringLoading ? 'animate-spin' : ''} />
                {scoringLoading ? 'Actualisation...' : 'Actualiser le score prédictif'}
              </button>
            </div>
            
            {/* Reliability Rating Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>FIABILITÉ DES RÈGLEMENTS</span>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px' }}>
                  <span>Indice de Ponctualité</span>
                  <span>{tenant.reliabilityScore}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--background)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{
                    width: `${tenant.reliabilityScore}%`,
                    height: '100%',
                    backgroundColor: getReliabilityBarColor(tenant.reliabilityScore)
                  }}></div>
                </div>
              </div>

              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                L'indice est recalculé automatiquement à chaque validation de loyer. Les retards imputent une décote de points.
              </span>
            </div>

            {/* Emergency Contact */}
            {(tenant.emergencyContactName || tenant.emergencyContactPhone) && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>CONTACT EN CAS D'URGENCE</span>
                <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: '700' }}>{tenant.emergencyContactName || 'Non renseigné'}</span>
                  {tenant.emergencyContactPhone && (
                    <a href={`tel:${tenant.emergencyContactPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                      {tenant.emergencyContactPhone}
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Supprimer ce locataire"
          message={`Êtes-vous sûr de vouloir supprimer définitivement la fiche locataire de ${tenant.firstName} ${tenant.lastName} ?`}
          confirmText="Oui, supprimer"
          cancelText="Annuler"
          type="danger"
          loading={actionLoading}
          onConfirm={confirmDeleteTenant}
          onClose={() => setShowDeleteModal(false)}
        />

      </div>
    </Layout>
  );
}
