'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { ArrowLeft, AlertCircle, User, Phone, Mail, ShieldAlert, Upload, FileText, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';

export default function CreateTenantPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalIdType, setNationalIdType] = useState('cni');
  const [nationalId, setNationalId] = useState('');
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [profession, setProfession] = useState('');
  const [employer, setEmployer] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quotaReached, setQuotaReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    // Vérifier les quotas locataires
    api.get('/subscriptions/me')
      .then(res => {
        if (res.quotas?.tenants?.reached) {
          setQuotaReached(true);
          setError("Vous avez atteint la limite de locataires actifs autorisée par votre forfait. Veuillez surclasser votre abonnement.");
        }
        setQuotaLoading(false);
      })
      .catch(() => {
        setQuotaLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quotaReached) {
      handleFormError(new Error("Vous avez atteint la limite de locataires actifs autorisée par votre forfait. Veuillez surclasser votre abonnement."));
      return;
    }
    setError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      clientErrors.firstName = 'Le prénom du locataire est obligatoire.';
    } else if (firstName.trim().length < 2) {
      clientErrors.firstName = 'Le prénom doit contenir au moins 2 caractères.';
    }

    if (!lastName.trim()) {
      clientErrors.lastName = 'Le nom du locataire est obligatoire.';
    } else if (lastName.trim().length < 2) {
      clientErrors.lastName = 'Le nom doit contenir au moins 2 caractères.';
    }

    if (!phone.trim()) {
      clientErrors.phone = 'Le numéro de téléphone est obligatoire.';
    } else if (phone.trim().replace(/\s+/g, '').length < 8) {
      clientErrors.phone = 'Le numéro de téléphone doit contenir au moins 8 chiffres.';
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        clientErrors.email = "Format d'adresse email invalide.";
      }
    }

    if (password && password.length < 6) {
      clientErrors.password = 'Le mot de passe doit contenir au moins 6 caractères.';
    }

    if (monthlyIncome !== '' && Number(monthlyIncome) <= 0) {
      clientErrors.monthlyIncome = 'Les revenus mensuels doivent être supérieurs à 0.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      const firstError = Object.values(clientErrors)[0];
      handleFormError(new Error(firstError));
      return;
    }

    setLoading(true);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
      password: password || undefined,
      nationalIdType: nationalIdType || 'cni',
      nationalId: nationalId.trim() || undefined,
      profession: profession.trim() || undefined,
      employer: employer.trim() || undefined,
      monthlyIncome: monthlyIncome !== '' ? Number(monthlyIncome) : undefined,
      emergencyContactName: emergencyContactName.trim() || undefined,
      emergencyContactPhone: emergencyContactPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const created = await api.post('/tenant-profiles', payload);
      if (idDocumentFile && created?.id) {
        const formData = new FormData();
        formData.append('idDocument', idDocumentFile);
        if (nationalId.trim()) formData.append('nationalId', nationalId.trim());
        if (nationalIdType) formData.append('nationalIdType', nationalIdType);
        await api.upload(`/tenant-profiles/${created.id}/id-document`, formData);
      }
      showFormSuccess('Fiche locataire et justificatif d\'identité enregistrés avec succès !');
      setTimeout(() => {
        window.location.href = '/tenants';
      }, 600);
    } catch (err) {
      const parsed = handleFormError(err, "Une erreur est survenue lors de la création de la fiche locataire.");
      setError(parsed.message);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors(parsed.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (quotaLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Vérification de vos quotas de souscription...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/tenants" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Ajouter un Locataire</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enregistrez le profil personnel et professionnel du futur résident</p>
        </div>

        {/* Error/Warning Banner */}
        {error && (
          <div style={{
            backgroundColor: quotaReached ? 'var(--warning-light)' : 'var(--danger-light)',
            border: `1px solid ${quotaReached ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: 'var(--radius)',
            padding: '16px',
            color: quotaReached ? 'var(--warning)' : 'var(--danger)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {quotaReached ? (
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
            )}
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>État Civil & Contact</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">PRÉNOM *</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                  placeholder="Ex: Kouassi"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError('firstName');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.firstName && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.firstName}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">NOM *</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                  placeholder="Ex: Yao"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError('lastName');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.lastName && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">NUMÉRO DE TÉLÉPHONE *</label>
                <input
                  type="tel"
                  className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                  placeholder="Ex: +225 0500000000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.phone && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.phone}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">ADRESSE EMAIL (POUR ACCÈS À L'ESPACE LOCATAIRE)</label>
                <input
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="Ex: locataire@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.email && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">MOT DE PASSE ACCÈS LOCATAIRE (OPTIONNEL)</label>
              <input
                type="text"
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                placeholder="Laissez vide pour générer un mot de passe temporaire"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                disabled={quotaReached}
              />
              {fieldErrors.password && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                💡 Si une adresse email est renseignée, le compte d'accès locataire sera créé automatiquement et recevra ses identifiants par e-mail.
              </span>
            </div>

            {/* Section Pièce d'Identité (Type, Numéro & Téléversement du justificatif) */}
            <div style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} style={{ color: 'var(--primary)' }} />
                  Pièce d'Identité & Justificatif Officiel (CNI / Passeport)
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Archivé automatiquement dans le dossier locataire et la GED
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">TYPE DE PIÈCE D'IDENTITÉ</label>
                  <select
                    className="form-control"
                    value={nationalIdType}
                    onChange={(e) => setNationalIdType(e.target.value)}
                    disabled={quotaReached}
                  >
                    <option value="cni">Carte Nationale d'Identité (CNI)</option>
                    <option value="passport">Passeport</option>
                    <option value="attestation">Attestation d'Identité (ONECI)</option>
                    <option value="consular_card">Carte Consulaire</option>
                    <option value="residence_permit">Titre de Séjour / Carte de Résident</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">NUMÉRO DE PIÈCE D'IDENTITÉ (CNI / PASSEPORT)</label>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.nationalId ? 'is-invalid' : ''}`}
                    placeholder="Ex: CI010293848"
                    value={nationalId}
                    onChange={(e) => {
                      setNationalId(e.target.value);
                      clearFieldError('nationalId');
                    }}
                    disabled={quotaReached}
                  />
                  {fieldErrors.nationalId && (
                    <div className="form-error">
                      <AlertCircle size={13} />
                      <span>{fieldErrors.nationalId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">TÉLÉVERSER LA COPIE DE LA PIÈCE (PDF, JPG, PNG, WEBP — MAX 10 MO)</label>
                {!idDocumentFile ? (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      cursor: quotaReached ? 'not-allowed' : 'pointer',
                      transition: 'border-color 0.2s ease',
                      gap: '6px'
                    }}
                  >
                    <Upload size={22} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      Cliquez pour sélectionner le scan ou la photo de la pièce d'identité
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Formats acceptés : PDF, JPEG, PNG, WEBP (Recto/Verso ou page principale)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      disabled={quotaReached}
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f) setIdDocumentFile(f);
                      }}
                    />
                  </label>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {idDocumentFile.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#15803d' }}>
                          {(idDocumentFile.size / 1024).toFixed(1)} Ko • Prêt à être téléversé et archivé
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIdDocumentFile(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      <X size={15} /> Retirer
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Situation Professionnelle</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">PROFESSION</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.profession ? 'is-invalid' : ''}`}
                  placeholder="Ex: Cadre Bancaire, Ingénieur..."
                  value={profession}
                  onChange={(e) => {
                    setProfession(e.target.value);
                    clearFieldError('profession');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.profession && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.profession}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">EMPLOYEUR / ENTREPRISE</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.employer ? 'is-invalid' : ''}`}
                  placeholder="Ex: Orange CI, Ministère..."
                  value={employer}
                  onChange={(e) => {
                    setEmployer(e.target.value);
                    clearFieldError('employer');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.employer && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.employer}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">REVENUS MENSUELS ESTIMÉS (FCFA)</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.monthlyIncome ? 'is-invalid' : ''}`}
                  placeholder="Ex: 600000"
                  value={monthlyIncome}
                  onChange={(e) => {
                    setMonthlyIncome(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('monthlyIncome');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.monthlyIncome && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.monthlyIncome}</span>
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Contact d'Urgence & Notes</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">NOM DU CONTACT D'URGENCE</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.emergencyContactName ? 'is-invalid' : ''}`}
                  placeholder="Ex: Marie Yao (Épouse)"
                  value={emergencyContactName}
                  onChange={(e) => {
                    setEmergencyContactName(e.target.value);
                    clearFieldError('emergencyContactName');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.emergencyContactName && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.emergencyContactName}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">TÉLÉPHONE D'URGENCE</label>
                <input
                  type="tel"
                  className={`form-control ${fieldErrors.emergencyContactPhone ? 'is-invalid' : ''}`}
                  placeholder="Ex: +225 0102030405"
                  value={emergencyContactPhone}
                  onChange={(e) => {
                    setEmergencyContactPhone(e.target.value);
                    clearFieldError('emergencyContactPhone');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.emergencyContactPhone && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.emergencyContactPhone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">NOTES OU COMMENTAIRES INTERNES</label>
              <textarea
                className={`form-control ${fieldErrors.notes ? 'is-invalid' : ''}`}
                rows={3}
                placeholder="Observations particulières sur le profil du locataire..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearFieldError('notes');
                }}
                disabled={quotaReached}
              ></textarea>
              {fieldErrors.notes && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.notes}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <Link href="/tenants" className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading || quotaReached}
              >
                {loading ? 'Création en cours...' : 'Créer la fiche locataire'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
}
