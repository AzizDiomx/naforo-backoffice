'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { 
  ArrowLeft, 
  AlertCircle, 
  FileText, 
  Building2, 
  Layers,
  Plus,
  User, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  ShieldAlert, 
  Info 
} from 'lucide-react';
import Link from 'next/link';

const LOT_TYPES = ['building', 'residence', 'lot'];
const TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement',
  villa: 'Villa',
  shop: 'Boutique / Commerce',
  office: 'Bureau',
  parking: 'Parking',
};

export default function CreateContractPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>('all');
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [propertyId, setPropertyId] = useState('');
  const [tenantProfileId, setTenantProfileId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [chargesAmount, setChargesAmount] = useState<number | ''>(0);
  const [depositAmount, setDepositAmount] = useState<number | ''>(0);
  const [cautionAmount, setCautionAmount] = useState<number | ''>(0);
  const [paymentDay, setPaymentDay] = useState<number | ''>(5);
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
    Promise.all([
      api.get('/properties?limit=200').catch(() => []),
      api.get('/properties/lots').catch(() => []),
      api.get('/tenant-profiles?limit=200').catch(() => [])
    ])
      .then(([propsData, lotsData, tenantsData]) => {
        const props = Array.isArray(propsData) ? propsData : (propsData as any)?.items || (propsData as any)?.data || [];
        const rawLots = Array.isArray(lotsData) ? lotsData : [];
        const fallbackLots = props.filter((p: any) => LOT_TYPES.includes(p.type));
        const mergedLotsMap = new Map<string, any>();
        [...rawLots, ...fallbackLots].forEach((l: any) => {
          if (l && l.id && !mergedLotsMap.has(l.id)) mergedLotsMap.set(l.id, l);
        });
        const allLots = Array.from(mergedLotsMap.values());
        setLots(allLots);

        // Filtrer uniquement les biens locatifs disponibles (exclure les conteneurs de type Lot)
        const rentableAvailable = props.filter(
          (p: any) => p.status === 'available' && !LOT_TYPES.includes(p.type)
        );
        setProperties(rentableAvailable);
        setTenants(Array.isArray(tenantsData) ? tenantsData : (tenantsData as any)?.items || (tenantsData as any)?.data || []);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const preLotId = params.get('lotId');
          const prePropId = params.get('propertyId');
          if (preLotId) setSelectedLotId(preLotId);
          if (prePropId) {
            const foundProp = rentableAvailable.find((p: any) => p.id === prePropId);
            if (foundProp) {
              setPropertyId(foundProp.id);
              if (foundProp.parentId) setSelectedLotId(foundProp.parentId);
              setRentAmount(foundProp.rentAmount ? Number(foundProp.rentAmount) : '');
              setChargesAmount(foundProp.chargesAmount ? Number(foundProp.chargesAmount) : 0);
              const d = foundProp.depositAmount ? Number(foundProp.depositAmount) : 0;
              setDepositAmount(d);
              setCautionAmount(d);
            }
          }
        }
        setDataLoading(false);
      })
      .catch(() => {
        setDataLoading(false);
      });
  }, []);

  const filteredProperties = properties.filter((p: any) => {
    if (selectedLotId === 'all') return true;
    if (selectedLotId === '__independent__') return !p.parentId;
    return p.parentId === selectedLotId || p.parent?.id === selectedLotId;
  });

  const selectedPropertyObj = properties.find((p: any) => p.id === propertyId);

  // Remplissage automatique des tarifs financiers lors de la sélection du bien
  const handlePropertyChange = (pId: string) => {
    setPropertyId(pId);
    clearFieldError('propertyId');
    const selected = properties.find(p => p.id === pId);
    if (selected) {
      const r = selected.rentAmount ? Number(selected.rentAmount) : '';
      const c = selected.chargesAmount ? Number(selected.chargesAmount) : 0;
      const d = selected.depositAmount ? Number(selected.depositAmount) : 0;
      setRentAmount(r);
      setChargesAmount(c);
      setDepositAmount(d);
      setCautionAmount(d);
    }
  };

  // Calcul du plafond légal de caution (Loi n° 2019-576 : 2 mois de loyer max)
  const maxLegalDeposit = rentAmount !== '' ? Number(rentAmount) * 2 : 0;
  const isDepositOverLimit = rentAmount !== '' && depositAmount !== '' && Number(depositAmount) > maxLegalDeposit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const clientErrors: Record<string, string> = {};

    if (!propertyId) {
      clientErrors.propertyId = 'Veuillez sélectionner un bien immobilier à louer.';
    }

    if (!tenantProfileId) {
      clientErrors.tenantProfileId = 'Veuillez sélectionner le locataire preneur du bail.';
    }

    if (!startDate) {
      clientErrors.startDate = 'La date de prise d\'effet du contrat est obligatoire.';
    }

    if (startDate && endDate) {
      const s = new Date(startDate);
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

    setLoading(true);

    const payload = {
      propertyId,
      tenantProfileId,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      rentAmount: Number(rentAmount),
      chargesAmount: chargesAmount !== '' ? Number(chargesAmount) : 0,
      depositAmount: depositAmount !== '' ? Number(depositAmount) : 0,
      cautionAmount: cautionAmount !== '' ? Number(cautionAmount) : (depositAmount !== '' ? Number(depositAmount) : 0),
      paymentDay: Number(paymentDay),
      notes: notes.trim() || undefined,
      paymentReminderEnabled: true
    };

    try {
      await api.post('/contracts', payload);
      showFormSuccess('Contrat de bail créé et activé avec succès !');
      setTimeout(() => {
        window.location.href = '/contracts';
      }, 600);
    } catch (err) {
      const parsed = handleFormError(err, "Une erreur est survenue lors de la création du contrat de bail.");
      setError(parsed.message);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setFieldErrors(parsed.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement des biens vacants et des locataires...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/contracts" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour à la liste des baux
        </Link>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Nouveau Contrat de Bail</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Liez un locataire à un bien disponible et configurez les conditions financières et juridiques
          </p>
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
            
            {/* 1. Parties prenantes */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Parties Prenantes & Attribution du Bien
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Sélecteur de Lot Parent (Étape 1 : Filtrage hiérarchique Lot -> Bien) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} style={{ color: 'var(--primary)' }} />
                  1. LOT / IMMEUBLE (FILTRE OPTIONNEL)
                </label>
                <select
                  className="form-control"
                  value={selectedLotId}
                  onChange={(e) => {
                    const nextLot = e.target.value;
                    setSelectedLotId(nextLot);
                    // Si le bien déjà sélectionné n'appartient pas à ce lot, on réinitialise la sélection du bien
                    if (propertyId) {
                      const currentProp = properties.find((p: any) => p.id === propertyId);
                      if (currentProp) {
                        const belongs =
                          nextLot === 'all' ||
                          (nextLot === '__independent__' && !currentProp.parentId) ||
                          currentProp.parentId === nextLot ||
                          currentProp.parent?.id === nextLot;
                        if (!belongs) {
                          setPropertyId('');
                        }
                      }
                    }
                  }}
                >
                  <option value="all">
                    Tous les biens vacants ({properties.length} disponible{properties.length > 1 ? 's' : ''})
                  </option>
                  {lots.length > 0 && (
                    <optgroup label="Lots (Immeubles / Résidences)">
                      {lots.map((lot: any) => {
                        const vacantInLot = properties.filter(
                          (p: any) => p.parentId === lot.id || p.parent?.id === lot.id
                        ).length;
                        return (
                          <option key={lot.id} value={lot.id}>
                            🏢 {lot.name} ({lot.city || 'Abidjan'}) — {vacantInLot} bien{vacantInLot > 1 ? 's' : ''} vacant{vacantInLot > 1 ? 's' : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  <option value="__independent__">
                    🏠 Biens individuels indépendants (Hors lot : {properties.filter((p: any) => !p.parentId).length})
                  </option>
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Un lot regroupe plusieurs biens. Sélectionnez un lot pour filtrer ses unités locatives vacantes.
                </span>
              </div>

              {/* Sélecteur du Bien Locatif Vacant (Étape 2 : Attribution au locataire) */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} style={{ color: 'var(--primary)' }} />
                  2. BIEN LOCATIF VACANT À LOUER *
                </label>
                <select
                  className={`form-control ${fieldErrors.propertyId ? 'is-invalid' : ''}`}
                  value={propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                >
                  <option value="">
                    {filteredProperties.length === 0
                      ? 'Aucun bien vacant dans cette sélection...'
                      : 'Sélectionnez le bien à attribuer au locataire...'}
                  </option>

                  {selectedLotId === 'all' ? (
                    <>
                      {lots.map((lot: any) => {
                        const lotUnits = properties.filter(
                          (p: any) => p.parentId === lot.id || p.parent?.id === lot.id
                        );
                        if (lotUnits.length === 0) return null;
                        return (
                          <optgroup key={lot.id} label={`🏢 Lot : ${lot.name} (${lot.city || 'Abidjan'})`}>
                            {lotUnits.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {TYPE_LABELS[p.type] || p.type}
                                {p.rentAmount ? ` • ${Number(p.rentAmount).toLocaleString('fr-FR')} FCFA` : ''}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                      {properties.filter((p: any) => !p.parentId).length > 0 && (
                        <optgroup label="🏠 Biens Individuels Indépendants (Hors Lot)">
                          {properties
                            .filter((p: any) => !p.parentId)
                            .map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {p.city || 'Abidjan'} ({TYPE_LABELS[p.type] || p.type}
                                {p.rentAmount ? ` • ${Number(p.rentAmount).toLocaleString('fr-FR')} FCFA` : ''})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </>
                  ) : (
                    filteredProperties.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.parent?.name ? `[${p.parent.name}] ` : ''}
                        {p.name} — {p.city || 'Abidjan'} ({TYPE_LABELS[p.type] || p.type}
                        {p.rentAmount ? ` • ${Number(p.rentAmount).toLocaleString('fr-FR')} FCFA` : ''})
                      </option>
                    ))
                  )}
                </select>
                {fieldErrors.propertyId && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.propertyId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rappel visuel du Lot parent ou raccourci de création si le Lot sélectionné n'a aucun bien vacant */}
            {selectedPropertyObj && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '0.82rem',
                color: '#166534'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={16} />
                  <span>
                    Bien sélectionné : <strong>{selectedPropertyObj.name}</strong> ({TYPE_LABELS[selectedPropertyObj.type] || selectedPropertyObj.type})
                    {selectedPropertyObj.parent?.name
                      ? ` • Rattaché au Lot « ${selectedPropertyObj.parent.name} »`
                      : ' • Bien individuel indépendant'}
                  </span>
                </div>
                {selectedPropertyObj.rentAmount && (
                  <span style={{ fontWeight: 700 }}>
                    Loyer catalogue : {Number(selectedPropertyObj.rentAmount).toLocaleString('fr-FR')} FCFA/mois
                  </span>
                )}
              </div>
            )}

            {filteredProperties.length === 0 && (
              <div style={{
                padding: '14px 16px',
                borderRadius: '10px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '0.82rem',
                color: '#92400e'
              }}>
                <span>
                  {selectedLotId !== 'all' && selectedLotId !== '__independent__'
                    ? '⚠️ Aucun bien locatif vacant n’est disponible dans ce lot actuellement.'
                    : '⚠️ Aucun bien locatif vacant disponible. Tous vos biens sont occupés ou aucun bien n’a encore été créé.'}
                </span>
                <Link
                  href={
                    selectedLotId !== 'all' && selectedLotId !== '__independent__'
                      ? `/properties/create?parentId=${selectedLotId}`
                      : '/properties/create'
                  }
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} />
                  {selectedLotId !== 'all' && selectedLotId !== '__independent__'
                    ? 'Ajouter un bien dans ce lot'
                    : 'Créer un bien locatif'}
                </Link>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
                LOCATAIRE PRENEUR DU BAIL *
              </label>
              <select
                className={`form-control ${fieldErrors.tenantProfileId ? 'is-invalid' : ''}`}
                value={tenantProfileId}
                onChange={(e) => {
                  setTenantProfileId(e.target.value);
                  clearFieldError('tenantProfileId');
                }}
              >
                <option value="">Sélectionnez un profil locataire...</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} — Tél : {t.phone}
                  </option>
                ))}
              </select>
              {fieldErrors.tenantProfileId && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.tenantProfileId}</span>
                </div>
              )}
            </div>

            {/* 2. Durée du bail */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>
              Durée & Échéancier
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                  DATE DE DÉBUT DE LOCATION *
                </label>
                <input
                  type="date"
                  className={`form-control ${fieldErrors.startDate ? 'is-invalid' : ''}`}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    clearFieldError('startDate');
                  }}
                />
                {fieldErrors.startDate && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.startDate}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  DATE DE FIN (LAISSER VIDE POUR INDÉTERMINÉE)
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
            </div>

            <div className="form-group">
              <label className="form-label">JOUR DU MOIS POUR L'ÉCHÉANCE DU LOYER (1 - 31) *</label>
              <input
                type="number"
                min="1"
                max="31"
                className={`form-control ${fieldErrors.paymentDay ? 'is-invalid' : ''}`}
                placeholder="Ex: 5"
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                💡 Les rappels automatiques et la facturation mensuelle seront synchronisés sur ce quantième.
              </span>
            </div>

            {/* 3. Conditions financières & Caution */}
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
                <label className="form-label">DÉPÔT DE GARANTIE / CAUTION *</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.depositAmount || isDepositOverLimit ? 'is-invalid' : ''}`}
                  placeholder="500000"
                  value={depositAmount}
                  onChange={(e) => {
                    const v = e.target.value !== '' ? Number(e.target.value) : '';
                    setDepositAmount(v);
                    setCautionAmount(v);
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

            {/* Boîte d'information conformité juridique Loi n° 2019-576 */}
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
                <strong style={{ color: isDepositOverLimit ? 'var(--danger)' : 'var(--success)', display: 'block' }}>
                  Conformité Loi n° 2019-576 relative au bail d'habitation :
                </strong>
                {rentAmount ? (
                  <span>
                    Plafond maximal autorisé pour le dépôt de garantie : <strong>{maxLegalDeposit.toLocaleString('fr-FR')} FCFA</strong> (2 mois de loyer hors charges).
                    {isDepositOverLimit && (
                      <span style={{ color: 'var(--danger)', display: 'block', marginTop: '2px', fontWeight: 600 }}>
                        ⚠️ Votre caution saisie ({Number(depositAmount).toLocaleString('fr-FR')} FCFA) dépasse le plafond légal.
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Saisissez le montant du loyer pour calculer automatiquement le plafond légal de caution.
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CLAUSES PARTICULIÈRES OU REMARQUES INTERNES</label>
              <textarea
                className={`form-control ${fieldErrors.notes ? 'is-invalid' : ''}`}
                rows={3}
                placeholder="Ex: Animaux autorisés sous conditions, révision annuelle du loyer selon indice..."
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
              <Link href="/contracts" className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading || isDepositOverLimit}
              >
                {loading ? 'Création en cours...' : 'Enregistrer et activer le bail'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
}
