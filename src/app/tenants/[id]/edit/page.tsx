'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditTenantPage() {
  const { id } = useParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [profession, setProfession] = useState('');
  const [employer, setEmployer] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    if (!id) return;
    setError(null);

    api.get(`/tenant-profiles/${id}`)
      .then(res => {
        setFirstName(res.firstName || '');
        setLastName(res.lastName || '');
        setEmail(res.email || '');
        setPhone(res.phone || '');
        setNationalId(res.nationalId || '');
        setProfession(res.profession || '');
        setEmployer(res.employer || '');
        setMonthlyIncome(res.monthlyIncome ?? '');
        setEmergencyContactName(res.emergencyContactName || '');
        setEmergencyContactPhone(res.emergencyContactPhone || '');
        setNotes(res.notes || '');
        setLoading(false);
      })
      .catch((err) => {
        handleFormError(err, "Impossible de charger les données du locataire.");
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (monthlyIncome !== '' && Number(monthlyIncome) <= 0) {
      clientErrors.monthlyIncome = 'Les revenus mensuels doivent être supérieurs à 0.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      const firstError = Object.values(clientErrors)[0];
      handleFormError(new Error(firstError));
      return;
    }

    setSubmitting(true);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim(),
      nationalId: nationalId.trim() || null,
      profession: profession.trim() || null,
      employer: employer.trim() || null,
      monthlyIncome: monthlyIncome !== '' ? Number(monthlyIncome) : null,
      emergencyContactName: emergencyContactName.trim() || null,
      emergencyContactPhone: emergencyContactPhone.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      await api.put(`/tenant-profiles/${id}`, payload);
      showFormSuccess('Fiche locataire mise à jour avec succès !');
      setTimeout(() => {
        window.location.href = `/tenants/${id}`;
      }, 600);
    } catch (err) {
      const parsed = handleFormError(err, "Une erreur est survenue lors de la mise à jour de la fiche locataire.");
      setError(parsed.message);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors(parsed.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href={`/tenants/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour au dossier locataire
        </Link>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Modifier le Locataire</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mettez à jour les informations administratives du résident</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius)',
            padding: '16px',
            color: 'var(--danger)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
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
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError('firstName');
                  }}
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
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError('lastName');
                  }}
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
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                />
                {fieldErrors.phone && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.phone}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">ADRESSE EMAIL</label>
                <input
                  type="email"
                  className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
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
              <label className="form-label">NUMÉRO DE PIÈCE D'IDENTITÉ (CNI / PASSEPORT)</label>
              <input
                type="text"
                className={`form-control ${fieldErrors.nationalId ? 'is-invalid' : ''}`}
                value={nationalId}
                onChange={(e) => {
                  setNationalId(e.target.value);
                  clearFieldError('nationalId');
                }}
              />
              {fieldErrors.nationalId && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.nationalId}</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Situation Professionnelle</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">PROFESSION</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.profession ? 'is-invalid' : ''}`}
                  value={profession}
                  onChange={(e) => {
                    setProfession(e.target.value);
                    clearFieldError('profession');
                  }}
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
                  value={employer}
                  onChange={(e) => {
                    setEmployer(e.target.value);
                    clearFieldError('employer');
                  }}
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
                  value={monthlyIncome}
                  onChange={(e) => {
                    setMonthlyIncome(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('monthlyIncome');
                  }}
                />
                {fieldErrors.monthlyIncome && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.monthlyIncome}</span>
                  </div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Contact d'Urgence</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">NOM COMPLET DU CONTACT D'URGENCE</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.emergencyContactName ? 'is-invalid' : ''}`}
                  value={emergencyContactName}
                  onChange={(e) => {
                    setEmergencyContactName(e.target.value);
                    clearFieldError('emergencyContactName');
                  }}
                />
                {fieldErrors.emergencyContactName && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.emergencyContactName}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">NUMÉRO DU CONTACT D'URGENCE</label>
                <input
                  type="tel"
                  className={`form-control ${fieldErrors.emergencyContactPhone ? 'is-invalid' : ''}`}
                  value={emergencyContactPhone}
                  onChange={(e) => {
                    setEmergencyContactPhone(e.target.value);
                    clearFieldError('emergencyContactPhone');
                  }}
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
              <label className="form-label">NOTES / REMARQUES PARTICULIÈRES</label>
              <textarea
                className={`form-control ${fieldErrors.notes ? 'is-invalid' : ''}`}
                rows={3}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  clearFieldError('notes');
                }}
              ></textarea>
              {fieldErrors.notes && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.notes}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <Link href={`/tenants/${id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={submitting}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
}
