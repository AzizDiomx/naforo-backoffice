'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  AlertCircle,
  Building,
  User,
  Droplet,
  Zap,
  Wind,
  Flame,
  ShieldAlert,
  HelpCircle,
  AlertTriangle,
  Upload,
  X,
  FileText
} from 'lucide-react';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

export default function CreateIncidentPage() {
  const router = useRouter();

  // Reference data
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Form states
  const [propertyId, setPropertyId] = useState('');
  const [tenantProfileId, setTenantProfileId] = useState('');
  const [type, setType] = useState('plumbing');
  const [priority, setPriority] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Submission & Validation states
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.get('/properties?limit=100').catch(() => ({ data: [] })),
      api.get('/tenant-profiles?limit=100').catch(() => ({ data: [] })),
      api.get('/contracts?status=active&limit=100').catch(() => ({ data: [] }))
    ])
      .then(([propsRes, tenantsRes, contractsRes]) => {
        const propList = Array.isArray(propsRes) ? propsRes : propsRes.data || propsRes.items || [];
        const tenantList = Array.isArray(tenantsRes) ? tenantsRes : tenantsRes.data || tenantsRes.items || [];
        const contractList = Array.isArray(contractsRes) ? contractsRes : contractsRes.data || contractsRes.items || [];

        setProperties(propList);
        setTenants(tenantList);
        setContracts(contractList);
      })
      .catch((err) => {
        console.error("Erreur de chargement des références:", err);
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, []);

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  // When property changes, auto-suggest or pre-fill active tenant if present
  const handlePropertyChange = (newPropertyId: string) => {
    setPropertyId(newPropertyId);
    clearFieldError('propertyId');

    const matchingContract = contracts.find((c: any) => c.propertyId === newPropertyId && c.status === 'active');
    if (matchingContract && matchingContract.tenantProfileId) {
      setTenantProfileId(matchingContract.tenantProfileId);
      clearFieldError('tenantProfileId');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray].slice(0, 5));

      // Generate previews
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!propertyId) {
      errors.propertyId = "Veuillez sélectionner le bien immobilier concerné.";
    }
    if (!title || title.trim().length < 3) {
      errors.title = "L'intitulé de l'incident doit comporter au moins 3 caractères.";
    }
    if (description && description.trim().length > 0 && description.trim().length < 5) {
      errors.description = "La description doit comporter au moins 5 caractères.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      handleFormError(new Error(Object.values(errors)[0]), "Veuillez corriger les anomalies du formulaire.");
      return;
    }

    try {
      // 1. Create incident
      const payload: any = {
        propertyId,
        type,
        priority,
        title: title.trim(),
        description: description.trim() || undefined,
      };

      if (tenantProfileId) {
        payload.tenantProfileId = tenantProfileId;
      }

      const res: any = await api.post('/incidents', payload);
      const incidentId = res?.id || res?.data?.id;

      // 2. Upload photos if selected
      if (incidentId && selectedFiles.length > 0) {
        try {
          const formData = new FormData();
          selectedFiles.forEach((file) => {
            formData.append('photos', file);
          });

          await api.postFormData(`/incidents/${incidentId}/photos`, formData);
        } catch (uploadErr) {
          console.warn("Avertissement : Les photos n'ont pas pu être téléversées.", uploadErr);
        }
      }

      showFormSuccess("L'incident a été déclaré avec succès et enregistré dans le registre technique.");
      router.push('/incidents');
    } catch (err) {
      const result = handleFormError(err, "Erreur lors de la déclaration de l'incident.");
      setFieldErrors(result.fieldErrors);
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [
    { id: 'plumbing', label: 'Plomberie', icon: Wrench, color: '#0369a1', bg: '#e0f2fe' },
    { id: 'leak', label: "Fuite d'eau", icon: Droplet, color: '#1d4ed8', bg: '#eff6ff' },
    { id: 'electricity', label: 'Électricité', icon: Zap, color: '#a16207', bg: '#fefce8' },
    { id: 'ac', label: 'Climatisation', icon: Wind, color: '#0f766e', bg: '#f0fdfa' },
    { id: 'breakdown', label: "Panne d'équipement", icon: Flame, color: '#c2410c', bg: '#fff7ed' },
    { id: 'security', label: 'Sécurité / Serrure', icon: ShieldAlert, color: '#b91c1c', bg: '#fef2f2' },
    { id: 'other', label: 'Autre réclamation', icon: HelpCircle, color: '#475569', bg: '#f1f5f9' },
  ];

  const priorityLevels = [
    { id: 'low', label: 'Faible', desc: 'Gêne mineure sans urgence', color: '#64748b', bg: '#f1f5f9' },
    { id: 'medium', label: 'Moyen', desc: 'Intervention sous 48h recommandée', color: '#0284c7', bg: '#e0f2fe' },
    { id: 'high', label: 'Élevé', desc: 'Dysfonctionnement majeur', color: '#c2410c', bg: '#ffedd5' },
    { id: 'urgent', label: 'Urgent', desc: 'Danger ou dégât des eaux imminent', color: '#dc2626', bg: '#fee2e2' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Back Link */}
        <Link
          href="/incidents"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          Retour aux incidents & pannes
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: 'rgba(1, 62, 55, 0.08)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Wrench size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Déclarer un incident / réclamation
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Enregistrez un dysfonctionnement technique, qualifiez la priorité et préparez l'intervention
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section 1: Bien immobilier & Déclarant */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} style={{ color: 'var(--primary)' }} />
              1. Localisation & Locataire concerné
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              {/* Bien immobilier */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  BIEN IMMOBILIER CONCERNÉ <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <select
                  className={`form-control ${fieldErrors.propertyId ? 'is-invalid' : ''}`}
                  value={propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  disabled={dataLoading}
                >
                  <option value="">Sélectionner un bien loué ou géré...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city || 'Abidjan'} - {p.address || 'Sans adresse'})
                    </option>
                  ))}
                </select>
                {fieldErrors.propertyId && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.propertyId}</span>
                  </div>
                )}
              </div>

              {/* Déclarant / Locataire occupant */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  LOCATAIRE DÉCLARANT / OCCUPANT
                </label>
                <select
                  className={`form-control ${fieldErrors.tenantProfileId ? 'is-invalid' : ''}`}
                  value={tenantProfileId}
                  onChange={(e) => {
                    setTenantProfileId(e.target.value);
                    clearFieldError('tenantProfileId');
                  }}
                  disabled={dataLoading}
                >
                  <option value="">Rattachement automatique ou choisir un locataire...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.phone})
                    </option>
                  ))}
                </select>
                {fieldErrors.tenantProfileId && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.tenantProfileId}</span>
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Si le bien sélectionné a un bail actif en cours, le locataire est pré-sélectionné automatiquement.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Catégorie & Priorité */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} style={{ color: 'var(--primary)' }} />
              2. Catégorie d'incident & Niveau d'urgence
            </h2>

            {/* Type selector visual grid */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
                CATÉGORIE DU PROBLÈME <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px'
              }}>
                {incidentTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => { setType(t.id); clearFieldError('type'); }}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: isSelected ? 'rgba(1, 62, 55, 0.04)' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: t.bg,
                        color: t.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={18} />
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.type && (
                <div className="form-error" style={{ marginTop: '6px' }}>
                  <AlertCircle size={13} />
                  <span>{fieldErrors.type}</span>
                </div>
              )}
            </div>

            {/* Priority selector visual grid */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
                DEGRÉ D'URGENCE / PRIORITÉ <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '12px'
              }}>
                {priorityLevels.map((p) => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => { setPriority(p.id); clearFieldError('priority'); }}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius)',
                        border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border)',
                        backgroundColor: isSelected ? p.bg : '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: p.color }}>
                          {p.label}
                        </span>
                        {p.id === 'urgent' && <AlertTriangle size={14} style={{ color: p.color }} />}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.priority && (
                <div className="form-error" style={{ marginTop: '6px' }}>
                  <AlertCircle size={13} />
                  <span>{fieldErrors.priority}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Diagnostic & Description */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '10px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--primary)' }} />
              3. Détails & Diagnostic du dysfonctionnement
            </h2>

            {/* Titre */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                INTITULÉ COURT DU PROBLÈME <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${fieldErrors.title ? 'is-invalid' : ''}`}
                placeholder="Ex: Fuite sous évier cuisine, Disjoncteur principal qui saute..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError('title');
                }}
              />
              {fieldErrors.title && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.title}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                DESCRIPTION DÉTAILLÉE & CONSIGNES D'ACCÈS
              </label>
              <textarea
                className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                rows={4}
                placeholder="Précisez la pièce exacte, la fréquence de la panne, les actions déjà tentées et les horaires de présence du résident..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError('description');
                }}
              />
              {fieldErrors.description && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.description}</span>
                </div>
              )}
            </div>

            {/* Photos upload */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                PHOTOS DU PROBLÈME (JUSQU'À 5 PHOTOS)
              </label>

              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  disabled={selectedFiles.length >= 5}
                />
                <Upload size={28} style={{ color: 'var(--primary)', margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 4px 0' }}>
                  Glissez vos photos ici ou cliquez pour parcourir
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Formats acceptés : JPG, PNG, WEBP (Max 5 photos)
                </span>
              </div>

              {/* Previews */}
              {filePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                  {filePreviews.map((previewUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: '90px',
                        height: '90px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <Link href="/incidents" className="btn btn-secondary">
              Annuler
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || dataLoading}
              style={{ minWidth: '180px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le signalement'}
            </button>
          </div>

        </form>

      </div>
    </Layout>
  );
}
