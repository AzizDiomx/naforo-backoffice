'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  User,
  Phone,
  Mail,
  Droplet,
  Zap,
  Wind,
  Flame,
  ShieldAlert,
  HelpCircle,
  Check,
  UserCheck,
  AlertCircle,
  Upload,
  Calendar,
  FileText,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [incident, setIncident] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal / Accordion toggle states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Inline errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [incData, usersData] = await Promise.all([
        api.get(`/incidents/${id}`),
        api.get('/users?limit=100').catch(() => ({ data: [] }))
      ]);

      setIncident(incData);
      
      const userList = Array.isArray(usersData) ? usersData : usersData.data || usersData.items || [];
      // Filter technicians, managers, and admins who can be assigned
      const techList = userList.filter((u: any) => ['technician', 'manager', 'admin'].includes(u.role));
      setTechnicians(techList);
      
      if (incData.assignedTo) {
        setSelectedTechId(incData.assignedTo);
      }
    } catch (err) {
      handleFormError(err, "Erreur de chargement des détails de l'incident.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // 1. Assign technician
  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) {
      setFieldErrors({ assignedTo: "Veuillez choisir un technicien ou intervenant." });
      return;
    }

    setActionLoading(true);
    setFieldErrors({});

    try {
      await api.post(`/incidents/${id}/assign`, { assignedTo: selectedTechId });
      showFormSuccess("L'intervention a été assignée avec succès. L'intervenant a été notifié.");
      setShowAssignModal(false);
      loadData();
    } catch (err) {
      const result = handleFormError(err, "Erreur lors de l'assignation du technicien.");
      setFieldErrors(result.fieldErrors);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Resolve incident
  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      setFieldErrors({ resolutionNotes: "Le rapport de résolution doit comporter au moins 5 caractères." });
      return;
    }

    setActionLoading(true);
    setFieldErrors({});

    try {
      await api.post(`/incidents/${id}/resolve`, {
        resolutionNotes: resolutionNotes.trim(),
        resolvedAt: new Date().toISOString()
      });
      showFormSuccess("L'incident est marqué comme résolu. Le résident a été informé.");
      setShowResolveModal(false);
      loadData();
    } catch (err) {
      const result = handleFormError(err, "Erreur lors de la résolution de l'incident.");
      setFieldErrors(result.fieldErrors);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Close incident
  const handleCloseIncident = async () => {
    if (!confirm("Confirmez-vous la clôture définitive de ce ticket d'incident ?")) return;

    setActionLoading(true);
    try {
      await api.put(`/incidents/${id}/status`, { status: 'closed' });
      showFormSuccess("Le dossier d'incident a été clôturé avec succès.");
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur lors de la clôture de l'incident.");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Reopen incident
  const handleReopenIncident = async () => {
    if (!confirm("Voulez-vous rouvrir ce ticket d'incident ?")) return;

    setActionLoading(true);
    try {
      await api.put(`/incidents/${id}/status`, { status: 'open' });
      showFormSuccess("Le dossier a été rouvert.");
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur lors de la réouverture.");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Upload extra photos
  const handleUploadPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach((f) => formData.append('photos', f));
      await api.postFormData(`/incidents/${id}/photos`, formData);
      showFormSuccess("Les photos complémentaires ont été ajoutées avec succès.");
      setShowPhotoModal(false);
      setUploadFiles([]);
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur lors du téléversement des photos.");
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'leak':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
            <Droplet size={14} /> Fuite d'eau
          </span>
        );
      case 'plumbing':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
            <Wrench size={14} /> Plomberie
          </span>
        );
      case 'electricity':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#fefce8', color: '#a16207' }}>
            <Zap size={14} /> Électricité
          </span>
        );
      case 'ac':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#f0fdfa', color: '#0f766e' }}>
            <Wind size={14} /> Climatisation
          </span>
        );
      case 'breakdown':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#fff7ed', color: '#c2410c' }}>
            <Flame size={14} /> Panne équipement
          </span>
        );
      case 'security':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#fef2f2', color: '#b91c1c' }}>
            <ShieldAlert size={14} /> Sécurité / Serrure
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#475569' }}>
            <HelpCircle size={14} /> Autre réclamation
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={14} /> Urgent
          </span>
        );
      case 'high':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#ffedd5', color: '#c2410c' }}>
            Élevé
          </span>
        );
      case 'medium':
        return (
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            Moyen
          </span>
        );
      default:
        return (
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem', fontWeight: 500, backgroundColor: '#f1f5f9', color: '#64748b' }}>
            Faible
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem' }}>
            <CheckCircle2 size={14} /> Résolu
          </span>
        );
      case 'closed':
        return (
          <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem' }}>
            <Check size={14} /> Clôturé
          </span>
        );
      case 'in_progress':
        return (
          <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem', backgroundColor: 'rgba(1, 62, 55, 0.1)', color: 'var(--primary)' }}>
            <Clock size={14} /> En intervention
          </span>
        );
      default:
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.8125rem' }}>
            <AlertCircle size={14} /> Ouvert
          </span>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement du dossier d'incident...
        </div>
      </Layout>
    );
  }

  if (!incident) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Incident introuvable.
        </div>
      </Layout>
    );
  }

  const currentStep = incident.status === 'closed' ? 5 : incident.status === 'resolved' ? 4 : incident.status === 'in_progress' ? 3 : incident.assignedTo ? 2 : 1;

  return (
    <Layout>
      <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Back Link */}
        <Link
          href="/incidents"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          Retour au registre des incidents
        </Link>

        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', backgroundColor: 'rgba(1, 62, 55, 0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                {incident.incidentNumber}
              </span>
              {getStatusBadge(incident.status)}
              {getPriorityBadge(incident.priority)}
              {getTypeBadge(incident.type)}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '8px 0 4px 0' }}>
              {incident.title}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> Déclaré le {new Date(incident.createdAt).toLocaleDateString('fr-FR')} à {new Date(incident.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {incident.status === 'open' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <UserCheck size={16} />
                Assigner un technicien
              </button>
            )}

            {incident.status === 'in_progress' && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <UserCheck size={16} />
                  Réassigner
                </button>
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#16a34a' }}
                >
                  <CheckCircle2 size={16} />
                  Résoudre l'incident
                </button>
              </>
            )}

            {incident.status === 'resolved' && (
              <>
                <button
                  onClick={handleReopenIncident}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  disabled={actionLoading}
                >
                  <RotateCcw size={15} />
                  Rouvrir
                </button>
                <button
                  onClick={handleCloseIncident}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  disabled={actionLoading}
                >
                  <Check size={16} />
                  Clôturer définitivement
                </button>
              </>
            )}

            {incident.status === 'closed' && (
              <button
                onClick={handleReopenIncident}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                disabled={actionLoading}
              >
                <RotateCcw size={15} />
                Rouvrir le ticket
              </button>
            )}
          </div>
        </div>

        {/* Lifecycle Stepper / Timeline Bar */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', position: 'relative' }}>
            {/* Step 1: Déclaré */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= 1 ? '#16a34a' : 'var(--border)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700
                }}>
                  {currentStep > 1 ? <Check size={16} /> : '1'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: currentStep >= 1 ? 'var(--text)' : 'var(--text-muted)' }}>
                  Déclaré
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '36px' }}>
                {new Date(incident.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {/* Step 2: Assigné */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= 2 ? '#16a34a' : 'var(--border)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700
                }}>
                  {currentStep > 2 ? <Check size={16} /> : '2'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: currentStep >= 2 ? 'var(--text)' : 'var(--text-muted)' }}>
                  Intervenant Assigné
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '36px' }}>
                {incident.assignee ? `${incident.assignee.firstName} ${incident.assignee.lastName}` : 'En attente'}
              </span>
            </div>

            {/* Step 3: En intervention */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= 3 ? '#16a34a' : 'var(--border)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700
                }}>
                  {currentStep > 3 ? <Check size={16} /> : '3'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: currentStep >= 3 ? 'var(--text)' : 'var(--text-muted)' }}>
                  Intervention en cours
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '36px' }}>
                {incident.status === 'in_progress' ? 'Travaux actifs' : currentStep > 3 ? 'Terminé' : 'Non démarré'}
              </span>
            </div>

            {/* Step 4: Résolu / Clôturé */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= 4 ? '#16a34a' : 'var(--border)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700
                }}>
                  {currentStep >= 4 ? <Check size={16} /> : '4'}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: currentStep >= 4 ? 'var(--text)' : 'var(--text-muted)' }}>
                  {incident.status === 'closed' ? 'Clôturé' : 'Résolu'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '36px' }}>
                {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString('fr-FR') : 'En attente'}
              </span>
            </div>
          </div>
        </div>

        {/* Assign Modal / Form Box */}
        {showAssignModal && (
          <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleAssignTechnician} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(1, 62, 55, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    Affecter un technicien ou intervenant
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    L'intervenant recevra une notification automatique et le statut du ticket passera à "En intervention".
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>INTERVENANT RESPONSABLE</label>
                <select
                  className={`form-control ${fieldErrors.assignedTo ? 'is-invalid' : ''}`}
                  value={selectedTechId}
                  onChange={(e) => { setSelectedTechId(e.target.value); clearFieldError('assignedTo'); }}
                  required
                >
                  <option value="">Sélectionner un intervenant / technicien...</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.role === 'technician' ? 'Technicien' : t.role === 'manager' ? 'Gestionnaire' : 'Administrateur'})
                    </option>
                  ))}
                </select>
                {fieldErrors.assignedTo && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.assignedTo}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Assignation...' : "Confirmer l'affectation"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resolve Modal / Form Box */}
        {showResolveModal && (
          <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleResolveIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                    Rédiger le rapport de résolution des travaux
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    Précisez les interventions menées, les pièces remplacées et les remarques pour le locataire.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>TRAVAUX RÉALISÉS & COMPTE-RENDU</label>
                <textarea
                  className={`form-control ${fieldErrors.resolutionNotes ? 'is-invalid' : ''}`}
                  rows={3}
                  placeholder="Ex: Remplacement du siphon et joint d'étanchéité par Yao Plomberie. Test d'écoulement concluant."
                  value={resolutionNotes}
                  onChange={(e) => { setResolutionNotes(e.target.value); clearFieldError('resolutionNotes'); }}
                  required
                />
                {fieldErrors.resolutionNotes && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.resolutionNotes}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowResolveModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#16a34a' }} disabled={actionLoading}>
                  {actionLoading ? 'Enregistrement...' : "Valider la résolution"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Extra Photos Upload Box */}
        {showPhotoModal && (
          <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleUploadPhotos} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  Ajouter des photos complémentaires (constat / fin de travaux)
                </h3>
              </div>

              <div className="form-group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) setUploadFiles(Array.from(e.target.files));
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPhotoModal(false)} className="btn btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || uploadFiles.length === 0}>
                  {actionLoading ? 'Téléversement...' : 'Téléverser'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Grid: Details + Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

          {/* Left Column: Diagnostic & Photos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Diagnostic Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                Description & Diagnostic du problème
              </h3>

              <div style={{ backgroundColor: 'var(--background)', padding: '16px', borderRadius: 'var(--radius)', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text)' }}>
                {incident.description || "Aucune description détaillée n'a été saisie pour cette réclamation."}
              </div>

              {/* Resolution Notes Box if present */}
              {incident.resolutionNotes && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '0.875rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Rapport de résolution validé le {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleDateString('fr-FR') : ''} :</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#15803d', lineHeight: '1.5' }}>
                    {incident.resolutionNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Photos Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} style={{ color: 'var(--primary)' }} />
                  Photos & Preuves visuelles ({incident.photos?.length || 0})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(!showPhotoModal)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Upload size={12} />
                  Ajouter photo
                </button>
              </div>

              {(!incident.photos || incident.photos.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Aucune photo attachée à ce dossier d'incident.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {incident.photos.map((url: string, idx: number) => {
                    const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
                    return (
                      <a
                        key={idx}
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                          display: 'block'
                        }}
                      >
                        <img
                          src={fullUrl}
                          alt={`Preuve ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem'
                        }}>
                          <ExternalLink size={10} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Context Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Property Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} style={{ color: 'var(--primary)' }} />
                Bien immobilier concerné
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  href={`/properties/${incident.propertyId}`}
                  style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {incident.property?.name}
                  <ExternalLink size={14} />
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                    {incident.property?.city || 'Abidjan'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {incident.property?.address || 'Adresse non renseignée'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tenant Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} style={{ color: 'var(--primary)' }} />
                Résident déclarant
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(1, 62, 55, 0.08)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {`${incident.tenantProfile?.firstName?.[0] || ''}${incident.tenantProfile?.lastName?.[0] || ''}`.toUpperCase()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                    {incident.tenantProfile?.firstName} {incident.tenantProfile?.lastName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locataire occupant</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', marginTop: '4px' }}>
                {incident.tenantProfile?.phone && (
                  <a
                    href={`tel:${incident.tenantProfile.phone}`}
                    style={{ color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    {incident.tenantProfile.phone}
                  </a>
                )}
                {incident.tenantProfile?.email && (
                  <a
                    href={`mailto:${incident.tenantProfile.email}`}
                    style={{ color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    {incident.tenantProfile.email}
                  </a>
                )}
              </div>
            </div>

            {/* Assignee / Technician Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={16} style={{ color: 'var(--primary)' }} />
                  Intervenant responsable
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  {incident.assignee ? 'Modifier' : 'Assigner'}
                </button>
              </div>

              {incident.assignee ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(1, 62, 55, 0.08)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {`${incident.assignee.firstName?.[0] || ''}${incident.assignee.lastName?.[0] || ''}`.toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                        {incident.assignee.firstName} {incident.assignee.lastName}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {incident.assignee.role === 'technician' ? 'Technicien de maintenance' : 'Gestionnaire'}
                      </div>
                    </div>
                  </div>

                  {incident.assignee.phone && (
                    <a
                      href={`tel:${incident.assignee.phone}`}
                      style={{ fontSize: '0.8125rem', color: 'var(--text)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                      {incident.assignee.phone}
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                    Aucun technicien n'est encore assigné à cette intervention.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(true)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Affecter un prestataire
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
