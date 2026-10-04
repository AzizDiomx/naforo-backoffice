'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { 
  ArrowLeft, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  ShieldCheck, 
  ShieldAlert 
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EditContractPage() {
  const { id } = useParams();

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [chargesAmount, setChargesAmount] = useState<number | ''>(0);
  const [depositAmount, setDepositAmount] = useState<number | ''>(0);
  const [paymentDay, setPaymentDay] = useState<number | ''>(5);
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

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

    api.get(`/contracts/${id}`)
      .then(res => {
        setContract(res);
        setEndDate(res.endDate ? new Date(res.endDate).toISOString().split('T')[0] : '');
        setRentAmount(res.rentAmount !== undefined ? Number(res.rentAmount) : '');
        setChargesAmount(res.chargesAmount !== undefined ? Number(res.chargesAmount) : 0);
        setDepositAmount(res.depositAmount !== undefined ? Number(res.depositAmount) : 0);
        setPaymentDay(res.paymentDay ?? 5);
        setStatus(res.status || 'active');
        setNotes(res.notes || '');
        setLoading(false);
      })
      .catch((err) => {
        handleFormError(err, "Impossible de charger le contrat de bail.");
        setLoading(false);
      });
  }, [id]);

  const maxLegalDeposit = rentAmount !== '' ? Number(rentAmount) * 2 : 0;
  const isDepositOverLimit = rentAmount !== '' && depositAmount !== '' && Number(depositAmount) > maxLegalDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};

    if (contract?.startDate && endDate) {
      const s = new Date(contract.startDate);
      const end = new Date(endDate);
      if (end <= s) {
        clientErrors.endDate = 'La date de fin de bail doit être postérieure à la date de début.';
      }
    }

    if (rentAmount === '' || Number(rentAmount) <= 0) {
      clientErrors.rentAmount = 'Le montant du loyer mensuel doit être strictement supérieur à 0.';
    }

    if (chargesAmount !== '' && Number(chargesAmount) < 0) {
      clientErrors.chargesAmount = 'Le montant des charges ne peut pas être négatif.';
    }

    if (depositAmount !== '' && Number(depositAmount) < 0) {
      clientErrors.depositAmount = 'Le montant du dépôt de garantie ne peut pas être négatif.';
    } else if (isDepositOverLimit) {
      clientErrors.depositAmount = `Le dépôt de garantie dépasse le plafond légal de 2 mois (${maxLegalDeposit.toLocaleString('fr-FR')} FCFA max - Loi n° 2019-576).`;
    }

    if (paymentDay === '' || Number(paymentDay) < 1 || Number(paymentDay) > 31) {
      clientErrors.paymentDay = 'Le jour d\'échéance doit être compris entre 1 et 31.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      const firstError = Object.values(clientErrors)[0];
      handleFormError(new Error(firstError));
      return;
    }

    setSubmitting(true);

    const payload = {
      endDate: endDate ? new Date(endDate).toISOString() : null,
      rentAmount: Number(rentAmount),
      chargesAmount: chargesAmount !== '' ? Number(chargesAmount) : 0,
      depositAmount: depositAmount !== '' ? Number(depositAmount) : 0,
      paymentDay: Number(paymentDay),
      status,
      notes: notes.trim() || null,
    };

    try {
      await api.put(`/contracts/${id}`, payload);
      showFormSuccess('Contrat de bail mis à jour avec succès !');
      setTimeout(() => {
        window.location.href = `/contracts/${id}`;
      }, 600);
    } catch (err) {
      const parsed = handleFormError(err, "Une erreur est survenue lors de la mise à jour du bail.");
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
          Chargement du contrat de bail...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href={`/contracts/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour aux détails du bail
        </Link>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>
            Modifier le Bail : {contract?.contractNumber}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Mettez à jour les conditions financières, les dates ou le statut du bail
          </p>
        </div>

        {/* Context Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>BIEN LOUÉ</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{contract?.property?.name}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOCATAIRE PRENEUR</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                {contract?.tenantProfile?.firstName} {contract?.tenantProfile?.lastName}
              </div>
            </div>
          </div>
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
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Période & Statut du Bail
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  DATE DE FIN (VIDE POUR INDÉTERMINÉE)
                </label>
                <input
                  type="date"
                  className={`form-control ${fieldErrors.endDate ? 'is-invalid' : ''}`}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    clearFieldError('endDate');
                  }}
                />
                {fieldErrors.endDate && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.endDate}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">STATUT DU CONTRAT</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Actif</option>
                  <option value="draft">Brouillon</option>
                  <option value="expired">Expiré</option>
                  <option value="terminated">Résilié</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">JOUR DU MOIS POUR L'ÉCHÉANCE DU LOYER (1 - 31) *</label>
              <input
                type="number"
                min="1"
                max="31"
                className={`form-control ${fieldErrors.paymentDay ? 'is-invalid' : ''}`}
                value={paymentDay}
                onChange={(e) => {
                  setPaymentDay(e.target.value !== '' ? Number(e.target.value) : '');
                  clearFieldError('paymentDay');
                }}
              />
              {fieldErrors.paymentDay && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.paymentDay}</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>
              Conditions Financières (FCFA)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">LOYER MENSUEL HORS CHARGES *</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.rentAmount ? 'is-invalid' : ''}`}
                  placeholder="250000"
                  value={rentAmount}
                  onChange={(e) => {
                    setRentAmount(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('rentAmount');
                  }}
                />
                {fieldErrors.rentAmount && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.rentAmount}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">PROVISION SUR CHARGES</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.chargesAmount ? 'is-invalid' : ''}`}
                  placeholder="25000"
                  value={chargesAmount}
                  onChange={(e) => {
                    setChargesAmount(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('chargesAmount');
                  }}
                />
                {fieldErrors.chargesAmount && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.chargesAmount}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">DÉPÔT DE GARANTIE / CAUTION</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.depositAmount || isDepositOverLimit ? 'is-invalid' : ''}`}
                  placeholder="500000"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('depositAmount');
                  }}
                />
                {fieldErrors.depositAmount && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.depositAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Boîte conformité légale */}
            <div style={{
              backgroundColor: isDepositOverLimit ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${isDepositOverLimit ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {isDepositOverLimit ? (
                <ShieldAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              ) : (
                <ShieldCheck size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
              )}
              <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                <strong style={{ color: isDepositOverLimit ? 'var(--danger)' : 'var(--success)' }}>
                  Loi n° 2019-576 : Plafond légal de garantie (2 mois max)
                </strong>
                <div>
                  Plafond autorisé : <strong>{maxLegalDeposit.toLocaleString('fr-FR')} FCFA</strong>.
                  {isDepositOverLimit && (
                    <span style={{ color: 'var(--danger)', display: 'block', fontWeight: 600 }}>
                      ⚠️ Votre dépôt saisi ({Number(depositAmount).toLocaleString('fr-FR')} FCFA) dépasse le plafond légal.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CLAUSES PARTICULIÈRES OU REMARQUES INTERNES</label>
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
              <Link href={`/contracts/${id}`} className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={submitting || isDepositOverLimit}
              >
                {submitting ? 'Enregistrement...' : 'Mettre à jour le bail'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
}
