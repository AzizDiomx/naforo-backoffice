'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
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
  Calendar,
  History,
  Wrench,
  Receipt,
  Plus,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Download,
  DoorOpen
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
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'incidents' | 'financial'>('overview');

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

  const formatFcfa = (val: number | string | null | undefined) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(num)
      .replace('XOF', 'FCFA');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="badge badge-success">Disponible</span>;
      case 'occupied':
        return <span className="badge" style={{ backgroundColor: 'rgba(1, 62, 55, 0.12)', color: 'var(--primary)', fontWeight: '700' }}>Occupé</span>;
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
      lot: 'Lot / Ensemble Immobilier',
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
          Chargement du dossier de l'appartement...
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

  const contracts = property.contracts || [];
  const activeContract = contracts.find((c: any) => c.status === 'active');
  const pastContracts = contracts.filter((c: any) => c.status !== 'active');
  
  const incidents = property.incidents || [];
  const openIncidents = incidents.filter((i: any) => i.status === 'open' || i.status === 'in_progress');
  const resolvedIncidents = incidents.filter((i: any) => i.status === 'resolved' || i.status === 'closed');

  const childrenUnits = property.children || [];
  const isParentLot = property.type === 'building' || property.type === 'residence' || property.type === 'lot' || childrenUnits.length > 0;

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top actions bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/properties" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            Retour au parc immobilier
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isParentLot && (
              <Link 
                href={`/properties/create?parentId=${property.id}`} 
                className="btn btn-primary" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} />
                Ajouter un appartement dans ce lot
              </Link>
            )}
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
        <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', borderLeft: '4px solid var(--primary)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            backgroundColor: 'rgba(1, 62, 55, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Building2 size={32} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{property.name}</h1>
              {getStatusBadge(property.status)}
              
              {property.parent && (
                <Link 
                  href={`/properties/${property.parent.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(1, 62, 55, 0.06)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    border: '1px solid rgba(1, 62, 55, 0.15)'
                  }}
                  title="Voir la fiche du lot parent"
                >
                  <Building2 size={13} />
                  Lot : {property.parent.name}
                  <ExternalLink size={11} />
                </Link>
              )}

              {isParentLot && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: '1px solid #fde68a'
                }}>
                  Lot / Immeuble ({childrenUnits.length} appartement{childrenUnits.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '600' }}>{getPropertyTypeLabel(property.type)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {property.address}, {property.city}
              </span>
              {property.floor !== null && property.floor !== undefined && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Layers size={14} />
                  {property.floor === 0 ? 'RDC' : `${property.floor}ème étage`}
                </span>
              )}
              {property.areaSqm && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Maximize2 size={14} />
                  {property.areaSqm} m²
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? '700' : '500',
              color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <Building2 size={17} />
            Vue Générale & Spécifications
          </button>

          <button
            onClick={() => setActiveTab('tenants')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'tenants' ? '700' : '500',
              color: activeTab === 'tenants' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'tenants' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <History size={17} />
            Historique Locataires ({contracts.length})
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'incidents' ? '700' : '500',
              color: activeTab === 'incidents' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'incidents' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <Wrench size={17} />
            Historique Pannes & Incidents ({incidents.length})
            {openIncidents.length > 0 && (
              <span style={{
                backgroundColor: '#ef4444',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {openIncidents.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('financial')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === 'financial' ? '700' : '500',
              color: activeTab === 'financial' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'financial' ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <DollarSign size={17} />
            Performance & Quittances
          </button>
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW & SPECIFICATIONS
        ========================================================================= */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Technical specs */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0 }}>
                  Caractéristiques Techniques
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Surface Habitable</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <Maximize2 size={16} color="var(--primary)" />
                      <span>{property.areaSqm ? `${property.areaSqm} m²` : 'Non spécifiée'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Niveau / Étage</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <Layers size={16} color="var(--primary)" />
                      <span>{property.floor !== null && property.floor !== undefined ? (property.floor === 0 ? 'RDC' : `${property.floor}ème`) : 'Non spécifié'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Pièces Principales</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <Compass size={16} color="var(--primary)" />
                      <span>{property.rooms ? `${property.rooms} pièce(s)` : 'Non spécifié'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Salles d'eau / Bains</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <Bath size={16} color="var(--primary)" />
                      <span>{property.bathrooms ? `${property.bathrooms} salle(s)` : 'Non spécifiée'}</span>
                    </div>
                  </div>
                </div>

                {property.description && (
                  <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Description du logement
                    </span>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5', whiteSpace: 'pre-line', margin: 0 }}>
                      {property.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Conditions */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0 }}>
                  Conditions Financières de Location
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Loyer mensuel HC</span>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                      {formatFcfa(property.rentAmount)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Provision Charges</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                      {formatFcfa(property.chargesAmount)}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Dépôt de Garantie (Caution)</span>
                    <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                      {formatFcfa(property.depositAmount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* If it's a lot/building, show list of child apartments */}
              {isParentLot && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>
                      Appartements rattachés à ce Lot ({childrenUnits.length})
                    </h2>
                    <Link 
                      href={`/properties/create?parentId=${property.id}`} 
                      className="btn btn-primary"
                      style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} /> Ajouter un appartement
                    </Link>
                  </div>

                  {childrenUnits.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Aucun appartement n'est encore rattaché à ce lot. Cliquez sur le bouton ci-dessus pour en ajouter un.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {childrenUnits.map((u: any) => {
                        const uContract = u.contracts?.[0];
                        return (
                          <div 
                            key={u.id}
                            style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '14px',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)' }}>{u.name}</span>
                              {getStatusBadge(u.status)}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {u.floor !== null && u.floor !== undefined ? (u.floor === 0 ? 'RDC' : `${u.floor}ème étage`) : ''}
                              {u.areaSqm ? ` · ${u.areaSqm} m²` : ''}
                            </div>

                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                              {formatFcfa(Number(u.rentAmount || 0) + Number(u.chargesAmount || 0))} / mois
                            </div>

                            {uContract ? (
                              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                <User size={13} />
                                Locataire : {uContract.tenantProfile?.firstName} {uContract.tenantProfile?.lastName}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600' }}>
                                Logement vacant
                              </div>
                            )}

                            <Link 
                              href={`/properties/${u.id}`}
                              style={{ 
                                marginTop: '4px', 
                                fontSize: '0.75rem', 
                                color: 'var(--primary)', 
                                fontWeight: '700', 
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Voir la fiche historique <ExternalLink size={12} />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sidebar Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Locataire Actuel Quick Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Occupation Actuelle
                </span>

                {activeContract ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(1, 62, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: '800' }}>
                        {activeContract.tenantProfile?.firstName?.[0]}{activeContract.tenantProfile?.lastName?.[0]}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {activeContract.tenantProfile?.firstName} {activeContract.tenantProfile?.lastName}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {activeContract.tenantProfile?.phone}
                        </span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bail N°</span>
                        <span style={{ fontWeight: '700' }}>{activeContract.contractNumber}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Entrée le</span>
                        <span style={{ fontWeight: '700' }}>{new Date(activeContract.startDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <Link 
                      href={`/contracts/${activeContract.id}`} 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.78rem', padding: '8px', textAlign: 'center', display: 'block' }}
                    >
                      Détails du bail en cours
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center', padding: '10px 0' }}>
                    <DoorOpen size={32} color="#94a3b8" style={{ margin: '0 auto' }} />
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                      Cet appartement est actuellement inoccupé et disponible à la location.
                    </p>
                    <Link 
                      href="/contracts/create" 
                      className="btn btn-primary" 
                      style={{ fontSize: '0.78rem', padding: '8px', textAlign: 'center', marginTop: '6px' }}
                    >
                      Attribuer un locataire (Nouveau Bail)
                    </Link>
                  </div>
                )}
              </div>

              {/* Incidents Widget */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Santé Technique du Logement
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Pannes en cours</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: openIncidents.length > 0 ? '#ef4444' : '#10b981' }}>
                    {openIncidents.length}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Pannes résolues</span>
                  <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                    {resolvedIncidents.length}
                  </span>
                </div>

                <button 
                  onClick={() => setActiveTab('incidents')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}
                >
                  Consulter tout l'historique des pannes →
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: HISTORIQUE DES LOCATAIRES (ACTUEL & ANCIENS)
        ========================================================================= */}
        {activeTab === 'tenants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Locataire Actuel */}
            <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} color="#10b981" />
                  Locataire Actuel en Place
                </h2>
                {activeContract ? (
                  <span className="badge badge-success">Bail Actif</span>
                ) : (
                  <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>Logement Vacant</span>
                )}
              </div>

              {activeContract ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Identité du Locataire</span>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
                      {activeContract.tenantProfile?.firstName} {activeContract.tenantProfile?.lastName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Phone size={13} /> {activeContract.tenantProfile?.phone}
                    </div>
                    {activeContract.tenantProfile?.email && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Mail size={13} /> {activeContract.tenantProfile?.email}
                      </div>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Conditions du Bail</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
                      {formatFcfa(activeContract.rentAmount)} / mois
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Caution versée : {formatFcfa(activeContract.depositAmount || activeContract.cautionAmount)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Paiement le {activeContract.paymentDay || 5} du mois
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Dates d'Occupation</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                      Depuis le {new Date(activeContract.startDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Échéance : {activeContract.endDate ? new Date(activeContract.endDate).toLocaleDateString('fr-FR') : 'Durée indéterminée'}
                    </div>
                    <Link 
                      href={`/contracts/${activeContract.id}`} 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}
                    >
                      Consulter le contrat de bail complet <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Aucun contrat de bail n'est actuellement actif pour ce logement.
                </div>
              )}
            </div>

            {/* Anciens Locataires (Historique Chronologique) */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={20} color="var(--primary)" />
                    Historique des Anciens Locataires
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Traçabilité de tous les occupants successifs ayant résidé dans cet appartement.
                  </p>
                </div>
                <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700' }}>
                  {pastContracts.length} bail{pastContracts.length > 1 ? 's passés' : ' passé'}
                </span>
              </div>

              {pastContracts.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  Aucun historique de bail antérieur enregistré pour cet appartement.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {pastContracts.map((c: any, index: number) => {
                    const tenant = c.tenantProfile;
                    const durationMonths = Math.max(1, Math.round((new Date(c.endDate || c.terminatedAt || c.updatedAt).getTime() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)));
                    
                    return (
                      <div 
                        key={c.id} 
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#475569' }}>
                              #{pastContracts.length - index}
                            </div>
                            <div>
                              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                                {tenant?.firstName} {tenant?.lastName}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {tenant?.phone} {tenant?.email ? `· ${tenant.email}` : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', textTransform: 'capitalize' }}>
                              {c.status === 'terminated' ? 'Bail Résilié' : (c.status === 'expired' ? 'Bail Expiré' : c.status)}
                            </span>
                            <Link 
                              href={`/contracts/${c.id}`} 
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              Consulter bail <ExternalLink size={12} />
                            </Link>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Période d'occupation :</span>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                              Du {new Date(c.startDate).toLocaleDateString('fr-FR')} au {new Date(c.endDate || c.terminatedAt || c.updatedAt).toLocaleDateString('fr-FR')} ({durationMonths} mois)
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Loyer mensuel appliqué :</span>
                            <div style={{ fontWeight: '700', color: 'var(--primary)', marginTop: '2px' }}>
                              {formatFcfa(c.rentAmount)}
                            </div>
                          </div>

                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Motif de départ :</span>
                            <div style={{ fontWeight: '600', color: c.terminationReason ? '#b45309' : 'var(--text-muted)', marginTop: '2px' }}>
                              {c.terminationReason || 'Fin normale de contrat'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 3: HISTORIQUE DES PANNES & INCIDENTS
        ========================================================================= */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Incidents KPI Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Signalements</span>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-main)' }}>{incidents.length}</span>
              </div>

              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>En Cours / Non Résolus</span>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ef4444' }}>{openIncidents.length}</span>
              </div>

              <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pannes Résolues</span>
                <span style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981' }}>{resolvedIncidents.length}</span>
              </div>
            </div>

            {/* Incidents Timeline */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={20} color="var(--primary)" />
                    Journal des Pannes & Réparations de l'Appartement
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Historique technique complet des interventions de plomberie, électricité, climatisation, etc.
                  </p>
                </div>

                <Link 
                  href={`/incidents?propertyId=${property.id}`} 
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} /> Déclarer un incident
                </Link>
              </div>

              {incidents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Aucun incident signalé</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>Cet appartement ne présente aucun antécédent de panne enregistré.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {incidents.map((inc: any) => {
                    const isClosed = inc.status === 'resolved' || inc.status === 'closed';
                    const priorityColor = inc.priority === 'urgent' ? '#dc2626' : (inc.priority === 'high' ? '#ea580c' : '#0284c7');

                    return (
                      <div 
                        key={inc.id}
                        style={{
                          border: `1px solid ${isClosed ? '#e2e8f0' : '#fecaca'}`,
                          borderRadius: '12px',
                          padding: '16px',
                          backgroundColor: isClosed ? '#ffffff' : '#fff5f5',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>{inc.incidentNumber}</span>
                              <h3 style={{ fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                {inc.title}
                              </h3>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: isClosed ? '#ecfdf5' : '#fef2f2',
                                color: isClosed ? '#059669' : '#dc2626',
                                border: `1px solid ${isClosed ? '#a7f3d0' : '#fecaca'}`
                              }}>
                                {isClosed ? 'Résolu ✓' : (inc.status === 'in_progress' ? 'En cours de réparation' : 'Ouvert')}
                              </span>
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#f1f5f9',
                                color: priorityColor
                              }}>
                                Priorité {inc.priority}
                              </span>
                            </div>
                            
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span>Catégorie : <strong>{inc.type}</strong></span>
                              <span>Signalé le : <strong>{new Date(inc.createdAt).toLocaleDateString('fr-FR')}</strong></span>
                              {inc.tenantProfile && (
                                <span>Par le locataire : <strong>{inc.tenantProfile.firstName} {inc.tenantProfile.lastName}</strong></span>
                              )}
                            </div>
                          </div>

                          <Link 
                            href={`/incidents?id=${inc.id}`}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            Ouvrir le ticket <ExternalLink size={12} />
                          </Link>
                        </div>

                        {inc.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', margin: 0, backgroundColor: isClosed ? '#f8fafc' : '#ffffff', padding: '10px', borderRadius: '8px' }}>
                            {inc.description}
                          </p>
                        )}

                        {inc.resolutionNotes && (
                          <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#065f46' }}>
                            <strong>Notes de réparation :</strong> {inc.resolutionNotes}
                            {inc.resolvedAt && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                                Clôturé le {new Date(inc.resolvedAt).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 4: PERFORMANCE & QUITTANCES DE LOYER
        ========================================================================= */}
        {activeTab === 'financial' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Financial Performance KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Loyer Actuel</span>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>
                  {formatFcfa(Number(property.rentAmount || 0) + Number(property.chargesAmount || 0))}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>par mois (charges comprises)</span>
              </div>

              <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Baux Signés</span>
                <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#10b981', marginTop: '4px' }}>
                  {contracts.length}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>contrats enregistrés</span>
              </div>
            </div>

            {/* Quittances certifiées émises */}
            <div className="card">
              <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="var(--primary)" />
                Quittances de Loyer Certifiées émises pour cet Appartement
              </h2>

              {(() => {
                const allReceipts = contracts.flatMap((c: any) => c.receipts || []);
                if (allReceipts.length === 0) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Aucune quittance n'a encore été émise pour ce logement.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {allReceipts.map((r: any) => (
                      <div 
                        key={r.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          backgroundColor: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)' }}>{r.receiptNumber}</span>
                          <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '700', backgroundColor: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>Certifié ✓</span>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                          {formatFcfa(r.amount)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Émise le {new Date(r.issuedAt).toLocaleDateString('fr-FR')}
                        </div>
                        {r.pdfUrl && (
                          <a 
                            href={r.pdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '0.75rem', 
                              color: 'var(--primary)', 
                              fontWeight: '700', 
                              textDecoration: 'none',
                              marginTop: '4px'
                            }}
                          >
                            <Download size={13} /> Télécharger le PDF
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>
        )}

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
