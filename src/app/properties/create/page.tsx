'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { ArrowLeft, AlertCircle, Building2, Globe, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CountryItem {
  id: string;
  code: string;
  name: string;
  phoneCode?: string;
  flag?: string;
  citiesCount?: number;
}

interface CityItem {
  id: string;
  name: string;
  countryId: string;
  region?: string;
}

export default function CreatePropertyPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('apartment');
  const [address, setAddress] = useState('');

  // Backend Geographic Master Data
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('CI');
  const [country, setCountry] = useState('Côte d\'Ivoire');
  const [city, setCity] = useState('Abidjan');
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCityName, setCustomCityName] = useState('');

  const [floor, setFloor] = useState<number | ''>('');
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [rooms, setRooms] = useState<number | ''>('');
  const [bathrooms, setBathrooms] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [chargesAmount, setChargesAmount] = useState<number | ''>('');
  const [depositAmount, setDepositAmount] = useState<number | ''>('');

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

  // 1. Charger la liste des pays depuis le backend
  useEffect(() => {
    setCountriesLoading(true);
    api.get<CountryItem[]>('/locations/countries')
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        if (list.length > 0) {
          setCountries(list);
          const defaultC = list.find(c => c.code === 'CI') || list[0];
          setSelectedCountryCode(defaultC.code);
          setCountry(defaultC.name);
        }
      })
      .catch(() => {
        setCountries([
          { id: '1', code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
          { id: '2', code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
          { id: '3', code: 'ML', name: 'Mali', flag: '🇲🇱' },
        ]);
      })
      .finally(() => {
        setCountriesLoading(false);
      });
  }, []);

  // 2. Charger dynamiquement les villes du pays sélectionné depuis le backend
  useEffect(() => {
    if (!selectedCountryCode) return;
    setCitiesLoading(true);
    setIsCustomCity(false);
    setCustomCityName('');

    api.get<CityItem[]>(`/locations/cities?countryCode=${selectedCountryCode}`)
      .then(res => {
        const list = Array.isArray(res) ? res : [];
        setCities(list);
        if (list.length > 0) {
          setCity(list[0].name);
        } else {
          setCity('');
          setIsCustomCity(true);
        }
      })
      .catch(() => {
        setCities([]);
        setIsCustomCity(true);
      })
      .finally(() => {
        setCitiesLoading(false);
      });
  }, [selectedCountryCode]);

  useEffect(() => {
    // Vérifier les quotas avant de charger le formulaire
    api.get('/subscriptions/me')
      .then(res => {
        if (res.quotas?.properties?.reached) {
          setQuotaReached(true);
          setError("Vous avez atteint la limite de biens autorisée par votre forfait. Veuillez surclasser votre abonnement.");
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
      handleFormError(new Error("Vous avez atteint la limite autorisée par votre forfait. Veuillez surclasser votre abonnement."));
      return;
    }
    setError(null);
    setFieldErrors({});

    const finalCity = isCustomCity ? customCityName.trim() : city;
    const clientErrors: Record<string, string> = {};

    if (!name.trim()) {
      clientErrors.name = 'Le nom du bien est obligatoire.';
    } else if (name.trim().length < 2) {
      clientErrors.name = 'Le nom du bien doit contenir au moins 2 caractères.';
    }

    if (!address.trim()) {
      clientErrors.address = "L'adresse physique est obligatoire.";
    } else if (address.trim().length < 3) {
      clientErrors.address = "L'adresse doit contenir au moins 3 caractères.";
    }

    if (!finalCity) {
      clientErrors.city = 'Veuillez sélectionner ou renseigner une ville.';
    }

    if (rentAmount !== '' && Number(rentAmount) <= 0) {
      clientErrors.rentAmount = 'Le montant du loyer doit être strictement supérieur à 0.';
    }
    if (chargesAmount !== '' && Number(chargesAmount) < 0) {
      clientErrors.chargesAmount = 'Le montant des charges ne peut pas être négatif.';
    }
    if (depositAmount !== '' && Number(depositAmount) < 0) {
      clientErrors.depositAmount = 'Le montant de la caution ne peut pas être négatif.';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      const firstError = Object.values(clientErrors)[0];
      handleFormError(new Error(firstError));
      return;
    }

    setLoading(true);

    const payload = {
      name: name.trim(),
      type,
      address: address.trim(),
      city: finalCity,
      country,
      floor: floor !== '' ? Number(floor) : undefined,
      areaSqm: areaSqm !== '' ? Number(areaSqm) : undefined,
      rooms: rooms !== '' ? Number(rooms) : undefined,
      bathrooms: bathrooms !== '' ? Number(bathrooms) : undefined,
      description: description.trim() || undefined,
      rentAmount: rentAmount !== '' ? Number(rentAmount) : undefined,
      chargesAmount: chargesAmount !== '' ? Number(chargesAmount) : 0,
      depositAmount: depositAmount !== '' ? Number(depositAmount) : 0,
    };

    try {
      await api.post('/properties', payload);
      showFormSuccess('Bien immobilier créé avec succès !');
      setTimeout(() => {
        window.location.href = '/properties';
      }, 600);
    } catch (err) {
      const parsed = handleFormError(err, "Une erreur est survenue lors de la création du bien.");
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
        <Link href="/properties" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>

        {/* Title */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>Ajouter un Bien</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Renseignez les caractéristiques physiques et financières du logement</p>
        </div>

        {/* Error Banner */}
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
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Informations Générales</h3>

            <div className="form-group">
              <label className="form-label">NOM DU BIEN (EX: APPARTEMENT A102) *</label>
              <input
                type="text"
                className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                placeholder="Ex: Villa Hibiscus, Appartement 3ème Gauche..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError('name');
                }}
                disabled={quotaReached}
              />
              {fieldErrors.name && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.name}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">TYPE DE BIEN *</label>
                <select
                  className={`form-control ${fieldErrors.type ? 'is-invalid' : ''}`}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    clearFieldError('type');
                  }}
                  disabled={quotaReached}
                >
                  <option value="apartment">Appartement</option>
                  <option value="villa">Villa</option>
                  <option value="building">Immeuble</option>
                  <option value="residence">Résidence</option>
                  <option value="shop">Boutique / Commerce</option>
                  <option value="office">Bureau</option>
                  <option value="parking">Parking</option>
                </select>
                {fieldErrors.type && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.type}</span>
                  </div>
                )}
              </div>

              {/* Sélecteur Pays - Chargé depuis l'API Backend */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} style={{ color: 'var(--primary)' }} />
                  PAYS *
                  {countriesLoading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', marginLeft: '4px' }} />}
                </label>
                <select
                  className={`form-control ${fieldErrors.country ? 'is-invalid' : ''}`}
                  value={selectedCountryCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedCountryCode(code);
                    const found = countries.find(c => c.code === code);
                    if (found) setCountry(found.name);
                    clearFieldError('country');
                  }}
                  disabled={quotaReached || countriesLoading}
                  style={{ fontWeight: '500' }}
                >
                  {countries.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.flag ? `${c.flag} ` : ''}{c.name} ({c.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.country && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.country}</span>
                  </div>
                )}
              </div>

              {/* Sélecteur Ville - Chargé dynamiquement selon le pays depuis l'API Backend */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    VILLE *
                    {citiesLoading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', marginLeft: '4px' }} />}
                  </label>
                  {!isCustomCity ? (
                    <button
                      type="button"
                      onClick={() => { setIsCustomCity(true); setCustomCityName(''); clearFieldError('city'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Autre ville ?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setIsCustomCity(false); clearFieldError('city'); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Choisir dans la liste
                    </button>
                  )}
                </div>

                {!isCustomCity ? (
                  <select
                    className={`form-control ${fieldErrors.city ? 'is-invalid' : ''}`}
                    value={city}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCity(true);
                        setCustomCityName('');
                      } else {
                        setCity(e.target.value);
                      }
                      clearFieldError('city');
                    }}
                    disabled={quotaReached || citiesLoading}
                    style={{ fontWeight: '500' }}
                  >
                    {cities.map((ct) => (
                      <option key={ct.id || ct.name} value={ct.name}>
                        {ct.name} {ct.region ? `(${ct.region})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">+ Saisie libre / Autre ville...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.city ? 'is-invalid' : ''}`}
                    placeholder="Saisissez le nom de la ville..."
                    value={customCityName}
                    onChange={(e) => {
                      setCustomCityName(e.target.value);
                      clearFieldError('city');
                    }}
                    disabled={quotaReached}
                    autoFocus
                  />
                )}
                {fieldErrors.city && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.city}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ADRESSE COMPLÈTE *</label>
              <input
                type="text"
                className={`form-control ${fieldErrors.address ? 'is-invalid' : ''}`}
                placeholder="Ex: Cocody Angré 8ème Tranche, Ruelle pharmacie..."
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearFieldError('address');
                }}
                disabled={quotaReached}
              />
              {fieldErrors.address && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.address}</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Caractéristiques Physiques</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">SURFACE (M²)</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.areaSqm ? 'is-invalid' : ''}`}
                  placeholder="85"
                  value={areaSqm}
                  onChange={(e) => {
                    setAreaSqm(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('areaSqm');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.areaSqm && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.areaSqm}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">ÉTAGE</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.floor ? 'is-invalid' : ''}`}
                  placeholder="0 (RDC)"
                  value={floor}
                  onChange={(e) => {
                    setFloor(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('floor');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.floor && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.floor}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">PIÈCES</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.rooms ? 'is-invalid' : ''}`}
                  placeholder="3"
                  value={rooms}
                  onChange={(e) => {
                    setRooms(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('rooms');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.rooms && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.rooms}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">SALLES D'EAU</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.bathrooms ? 'is-invalid' : ''}`}
                  placeholder="2"
                  value={bathrooms}
                  onChange={(e) => {
                    setBathrooms(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('bathrooms');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.bathrooms && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.bathrooms}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">DESCRIPTION DÉTAILLÉE (OPTIONS, COMMODITÉS...)</label>
              <textarea
                className={`form-control ${fieldErrors.description ? 'is-invalid' : ''}`}
                rows={3}
                placeholder="Ex: Piscine commune, groupe électrogène, gardiennage 24/7..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearFieldError('description');
                }}
                disabled={quotaReached}
              ></textarea>
              {fieldErrors.description && (
                <div className="form-error">
                  <AlertCircle size={13} />
                  <span>{fieldErrors.description}</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '10px' }}>Conditions Financières (FCFA)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">LOYER MENSUEL (HORS CHARGES) *</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.rentAmount ? 'is-invalid' : ''}`}
                  placeholder="250000"
                  value={rentAmount}
                  onChange={(e) => {
                    setRentAmount(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('rentAmount');
                  }}
                  disabled={quotaReached}
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
                  disabled={quotaReached}
                />
                {fieldErrors.chargesAmount && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.chargesAmount}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">DÉPÔT DE GARANTIE (CAUTION)</label>
                <input
                  type="number"
                  className={`form-control ${fieldErrors.depositAmount ? 'is-invalid' : ''}`}
                  placeholder="500000"
                  value={depositAmount}
                  onChange={(e) => {
                    setDepositAmount(e.target.value !== '' ? Number(e.target.value) : '');
                    clearFieldError('depositAmount');
                  }}
                  disabled={quotaReached}
                />
                {fieldErrors.depositAmount && (
                  <div className="form-error">
                    <AlertCircle size={13} />
                    <span>{fieldErrors.depositAmount}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <Link href="/properties" className="btn btn-secondary" style={{ flex: 1 }}>
                Annuler
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading || quotaReached}
              >
                {loading ? 'Création en cours...' : 'Créer le bien immobilier'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </Layout>
  );
}
