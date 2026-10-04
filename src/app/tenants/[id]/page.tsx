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
  DollarSign
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

export default function TenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

              {tenant.nationalId && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px', fontSize: '0.875rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    JUSTIFICATIF D'IDENTITÉ (CNI / PASSEPORT)
                  </span>
                  <span>Numéro de pièce : <strong>{tenant.nationalId}</strong></span>
                </div>
              )}

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
