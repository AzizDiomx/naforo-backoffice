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
  Building2, 
  MapPin, 
  Maximize2, 
  Layers, 
  Compass, 
  Bath, 
  DollarSign, 
  FileText, 
  User,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadProperty = () => {
    setLoading(true);
    setError(null);
    api.get(`/properties/${id}`)
      .then(res => {
        setProperty(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Impossible de charger les détails du bien immobilier.");
        setLoading(false);
      });
  };

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const confirmDeleteProperty = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.delete(`/properties/${id}`);
      showFormSuccess('Bien immobilier supprimé avec succès.');
      setTimeout(() => {
        window.location.href = '/properties';
      }, 500);
    } catch (err) {
      const parsed = handleFormError(err, "Erreur lors de la suppression du bien. Vérifiez qu'aucun contrat actif n'y soit lié.");
      setError(parsed.message);
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Disponible</span>;
      case 'occupied':
        return <span className="badge badge-primary" style={{ backgroundColor: 'rgba(1, 62, 55, 0.1)', color: 'var(--primary)' }}>Occupé</span>;
      case 'maintenance':
        return <span className="badge badge-warning">En maintenance</span>;
      case 'reserved':
        return <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>Réservé</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Appartement',
      villa: 'Villa',
      building: 'Immeuble',
      residence: 'Résidence',
      shop: 'Boutique / Commerce',
      office: 'Bureau',
      parking: 'Parking'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement du dossier immobilier...
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px' }} />
          <p>Le bien immobilier demandé est introuvable.</p>
          <Link href="/properties" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  // Vérifier s'il y a un contrat actif sur le bien
  const activeContract = property.contracts?.find((c: any) => c.status === 'active');

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/properties" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            Retour au parc immobilier
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href={`/properties/${id}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Notifications */}
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius)', padding: '16px', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: 'var(--success-light)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius)', padding: '16px', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Property Header Info Card */}
        <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '12px',
            backgroundColor: 'rgba(1, 62, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Building2 size={32} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{property.name}</h1>
              {getStatusBadge(property.status)}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600' }}>{getPropertyTypeLabel(property.type)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {property.address}, {property.city}
              </span>
            </div>
          </div>
        </div>

        {/* Details and Sidebar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Main content column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Box 1: Technical specs */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                Caractéristiques Techniques
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SURFACE HABITABLE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Maximize2 size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{property.areaSqm ? `${property.areaSqm} m²` : 'Non spécifiée'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NIVEAU / ÉTAGE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Layers size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{property.floor !== null && property.floor !== undefined ? (property.floor === 0 ? 'RDC' : `${property.floor}ème`) : 'Non spécifié'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PIÈCES PRINCIPALES</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Compass size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{property.rooms ? `${property.rooms} pièce(s)` : 'Non spécifié'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SALLES D'EAU / BAINS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <Bath size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{property.bathrooms ? `${property.bathrooms} salle(s)` : 'Non spécifiée'}</span>
                  </div>
                </div>
              </div>

              {property.description && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>DESCRIPTION DU LOGEMENT</span>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{property.description}</p>
                </div>
              )}
            </div>

            {/* Box 2: Financial Conditions */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                Conditions Financières de Location
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--background)', padding: '12px', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600' }}>LOYER MENSUEL HORS CHARGES</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {property.rentAmount ? formatFcfa(Number(property.rentAmount)) : 'Non défini'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--background)', padding: '12px', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600' }}>PROVISION MENSUELLE CHARGES</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text)' }}>
                    {property.chargesAmount ? formatFcfa(Number(property.chargesAmount)) : '0 FCFA'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--background)', padding: '12px', borderRadius: 'var(--radius)' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600' }}>DÉPÔT DE GARANTIE REQUIS</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text)' }}>
                    {property.depositAmount ? formatFcfa(Number(property.depositAmount)) : '0 FCFA'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 3: Historical lease contracts */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                Historique des Contrats de Bails
              </h2>
              {(!property.contracts || property.contracts.length === 0) ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>Aucun contrat de bail enregistré pour ce bien.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {property.contracts.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '600' }}>Contrat N° {c.contractNumber}</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Du {new Date(c.startDate).toLocaleDateString('fr-FR')} au {c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : 'Indéterminé'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {c.status === 'active' ? 'Actif' : c.status}
                        </span>
                        <Link href={`/contracts/${c.id}`} style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          Détails
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar column (Locataire et Rendement) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Box Locataire Actif */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>OCCUPATION ACTUELLE</span>
                {activeContract ? (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Occupé</span>
                ) : (
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Disponible</span>
                )}
              </div>
              
              {activeContract ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                      <User size={16} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>
                        {activeContract.tenantProfile?.firstName} {activeContract.tenantProfile?.lastName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {activeContract.tenantProfile?.phone}
                      </span>
                    </div>
                  </div>

                  <Link 
                    href={`/contracts/${activeContract.id}`} 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '6px', textAlign: 'center', display: 'block', marginTop: '6px' }}
                  >
                    Voir le bail en cours
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Le logement est actuellement inoccupé et disponible à la location.</p>
                  
                  <Link 
                    href="/contracts/create" 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.75rem', padding: '8px', textAlign: 'center', display: 'block', marginTop: '4px' }}
                  >
                    Nouveau contrat de bail
                  </Link>
                </div>
              )}
            </div>

            {/* Rendement Locatif consolidé */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>PERFORMANCE DU BIEN</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REVENUS TOTAUX PERÇUS</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--success)' }}>
                  {formatFcfa(Number(property.rentAmount || 0) * (property.contracts?.length || 0) * 3)} 
                </h3>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Consolidation brute estimée</span>
              </div>
            </div>

          </div>

        </div>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          title="Supprimer ce bien immobilier"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le bien "${property.name}" ? Cette action effacera ses caractéristiques.`}
          confirmText="Oui, supprimer"
          cancelText="Annuler"
          type="danger"
          loading={actionLoading}
          onConfirm={confirmDeleteProperty}
          onClose={() => setShowDeleteModal(false)}
        />

      </div>
    </Layout>
  );
}
