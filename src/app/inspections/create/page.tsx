'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Building,
  User,
  Zap,
  Droplets,
  Key,
  Camera,
  Trash2,
  Plus,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface RoomElement {
  name: string;
  condition: 'neuf' | 'bon' | 'usage' | 'mauvais';
  comment: string;
  photos: string[];
}

interface RoomData {
  roomName: string;
  condition: 'neuf' | 'bon' | 'usage' | 'mauvais';
  elements: RoomElement[];
}

const DEFAULT_ELEMENTS = [
  'Murs & Peinture',
  'Carrelage & Sols',
  'Plafond',
  'Fenêtres & Vitres',
  'Portes & Serrures',
  'Prises & Interrupteurs',
  'Éclairage',
  'Plomberie & Robinetterie',
];

const INITIAL_ROOMS: RoomData[] = [
  {
    roomName: 'Salon / Séjour',
    condition: 'bon',
    elements: [
      { name: 'Murs & Peinture', condition: 'bon', comment: '', photos: [] },
      { name: 'Sol / Carrelage', condition: 'bon', comment: '', photos: [] },
      { name: 'Portes & Serrures', condition: 'bon', comment: '', photos: [] },
      { name: 'Fenêtres & Prises', condition: 'bon', comment: '', photos: [] },
    ],
  },
  {
    roomName: 'Chambre Principale',
    condition: 'bon',
    elements: [
      { name: 'Murs & Peinture', condition: 'bon', comment: '', photos: [] },
      { name: 'Sol / Carrelage', condition: 'bon', comment: '', photos: [] },
      { name: 'Placards & Portes', condition: 'bon', comment: '', photos: [] },
    ],
  },
  {
    roomName: 'Cuisine',
    condition: 'bon',
    elements: [
      { name: 'Évier & Robinetterie', condition: 'bon', comment: '', photos: [] },
      { name: 'Plan de travail', condition: 'bon', comment: '', photos: [] },
      { name: 'Murs / Faïence', condition: 'bon', comment: '', photos: [] },
    ],
  },
  {
    roomName: 'Salle d’eau / WC',
    condition: 'bon',
    elements: [
      { name: 'Sanitaires & Robinetterie', condition: 'bon', comment: '', photos: [] },
      { name: 'Lavabo & Douche', condition: 'bon', comment: '', photos: [] },
      { name: 'Murs / Carrelage', condition: 'bon', comment: '', photos: [] },
    ],
  },
];

export default function CreateInspectionPage() {
  const router = useRouter();

  // Basic Info
  const [properties, setProperties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedTenantProfileId, setSelectedTenantProfileId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [type, setType] = useState<'entry' | 'exit'>('entry');
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectorName, setInspectorName] = useState('');

  // Meters & Keys
  const [electricityMeterNumber, setElectricityMeterNumber] = useState('');
  const [electricityIndex, setElectricityIndex] = useState('');
  const [waterMeterNumber, setWaterMeterNumber] = useState('');
  const [waterIndex, setWaterIndex] = useState('');
  const [keysCount, setKeysCount] = useState<number | string>(2);
  const [keysDetail, setKeysDetail] = useState('2 clés porte d’entrée, 1 télécommande portail');

  // Rooms Data
  const [roomsData, setRoomsData] = useState<RoomData[]>(INITIAL_ROOMS);
  const [newRoomName, setNewRoomName] = useState('');

  // Observations & Deductions
  const [generalObservations, setGeneralObservations] = useState('');
  const [estimatedDeductionAmount, setEstimatedDeductionAmount] = useState<number | string>('');
  const [deductionDetails, setDeductionDetails] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/properties?limit=200').catch(() => []),
      api.get('/contracts?limit=200').catch(() => []),
      api.get('/auth/me').catch(() => null),
    ]).then(([propsRes, contractsRes, meRes]) => {
      const pList = Array.isArray(propsRes) ? propsRes : (propsRes as any)?.data || [];
      const cList = Array.isArray(contractsRes) ? contractsRes : (contractsRes as any)?.data || [];
      setProperties(pList);
      setContracts(cList);
      if (meRes) {
        setInspectorName(`${meRes.firstName || ''} ${meRes.lastName || ''}`.trim() || 'Gestionnaire Naforo');
      }
    });
  }, []);

  // When a contract is chosen, auto-select property and tenant
  const handleContractChange = (contractId: string) => {
    setSelectedContractId(contractId);
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      if (contract.propertyId) setSelectedPropertyId(contract.propertyId);
      if (contract.tenantProfileId) {
        setSelectedTenantProfileId(contract.tenantProfileId);
        const name = contract.tenantProfile
          ? `${contract.tenantProfile.firstName} ${contract.tenantProfile.lastName}`
          : 'Locataire';
        setTenantName(name);
      }
    }
  };

  // Add Room
  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    setRoomsData([
      ...roomsData,
      {
        roomName: newRoomName.trim(),
        condition: 'bon',
        elements: [
          { name: 'Murs & Peinture', condition: 'bon', comment: '', photos: [] },
          { name: 'Sol / Carrelage', condition: 'bon', comment: '', photos: [] },
        ],
      },
    ]);
    setNewRoomName('');
  };

  // Remove Room
  const handleRemoveRoom = (roomIndex: number) => {
    setRoomsData(roomsData.filter((_, idx) => idx !== roomIndex));
  };

  // Add Element to Room
  const handleAddElement = (roomIndex: number) => {
    const updated = [...roomsData];
    updated[roomIndex].elements.push({
      name: 'Nouvel élément',
      condition: 'bon',
      comment: '',
      photos: [],
    });
    setRoomsData(updated);
  };

  // Remove Element
  const handleRemoveElement = (roomIndex: number, elIndex: number) => {
    const updated = [...roomsData];
    updated[roomIndex].elements = updated[roomIndex].elements.filter((_, idx) => idx !== elIndex);
    setRoomsData(updated);
  };

  // Update Element
  const handleUpdateElement = (
    roomIndex: number,
    elIndex: number,
    field: keyof RoomElement,
    value: any
  ) => {
    const updated = [...roomsData];
    updated[roomIndex].elements[elIndex] = {
      ...updated[roomIndex].elements[elIndex],
      [field]: value,
    };
    setRoomsData(updated);
  };

  // Upload Photo for an element
  const handlePhotoUpload = async (roomIndex: number, elIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await api.upload('/inspections/upload-photo', formData);
      if (res && res.photoUrl) {
        const updated = [...roomsData];
        const currentPhotos = updated[roomIndex].elements[elIndex].photos || [];
        updated[roomIndex].elements[elIndex].photos = [...currentPhotos, res.photoUrl];
        setRoomsData(updated);
        showFormSuccess('Photo constatée ajoutée avec succès.');
      }
    } catch (err) {
      handleFormError(err, 'Impossible de téléverser la photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // Remove photo
  const handleRemovePhoto = (roomIndex: number, elIndex: number, photoUrl: string) => {
    const updated = [...roomsData];
    updated[roomIndex].elements[elIndex].photos = updated[roomIndex].elements[elIndex].photos.filter(
      (p) => p !== photoUrl
    );
    setRoomsData(updated);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPropertyId) {
      handleFormError(new Error('Veuillez sélectionner un bien immobilier.'));
      return;
    }

    if (roomsData.length === 0) {
      handleFormError(new Error('Veuillez ajouter au moins une pièce à inspecter.'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        propertyId: selectedPropertyId,
        contractId: selectedContractId || null,
        tenantProfileId: selectedTenantProfileId || null,
        type,
        inspectionDate,
        inspectorName: inspectorName.trim() || undefined,
        meterReadings: {
          electricityMeterNumber: electricityMeterNumber.trim() || null,
          electricityIndex: electricityIndex.trim() || null,
          waterMeterNumber: waterMeterNumber.trim() || null,
          waterIndex: waterIndex.trim() || null,
          keysCount: keysCount ? Number(keysCount) : null,
          keysDetail: keysDetail.trim() || null,
        },
        roomsData,
        generalObservations: generalObservations.trim() || null,
        estimatedDeductionAmount: estimatedDeductionAmount !== '' ? Number(estimatedDeductionAmount) : null,
        deductionDetails: deductionDetails.trim() || null,
      };

      const res = await api.post('/inspections', payload);
      showFormSuccess(`État des lieux ${res.inspectionNumber} enregistré avec succès !`);
      router.push(`/inspections/${res.id}`);
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’enregistrement de l’état des lieux.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/inspections" className="btn btn-secondary" style={{ padding: '8px' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                Nouveau Constat d’État des Lieux
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Relevé contradictoire d’entrée ou de sortie avec photos certifiées
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Identité du Constat */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={20} color="#0284c7" />
              1. Type & Références du Logement
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Type de Constat *
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setType('entry')}
                    className={`btn ${type === 'entry' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, backgroundColor: type === 'entry' ? '#059669' : undefined, borderColor: type === 'entry' ? '#047857' : undefined }}
                  >
                    🟢 Entrée des lieux
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('exit')}
                    className={`btn ${type === 'exit' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, backgroundColor: type === 'exit' ? '#dc2626' : undefined, borderColor: type === 'exit' ? '#b91c1c' : undefined }}
                  >
                    🔴 Sortie des lieux
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Contrat de Bail associé
                </label>
                <select
                  value={selectedContractId}
                  onChange={(e) => handleContractChange(e.target.value)}
                  className="input-field"
                >
                  <option value="">Sélectionner un contrat (recommandé)...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.property?.name} — {c.tenantProfile ? `${c.tenantProfile.firstName} ${c.tenantProfile.lastName}` : 'Locataire'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Bien Immobilier *
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner le bien...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.address}, {p.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Locataire
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="input-field"
                  placeholder="Nom complet du locataire"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Date d'inspection *
                </label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Gestionnaire / Inspecteur
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="input-field"
                  placeholder="Nom de l'agent qui réalise le constat"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Compteurs & Clés */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#eab308" />
              2. Relevés des Compteurs & Clés (CIE & SODECI)
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  N° Compteur CIE (Électricité)
                </label>
                <input
                  type="text"
                  value={electricityMeterNumber}
                  onChange={(e) => setElectricityMeterNumber(e.target.value)}
                  className="input-field"
                  placeholder="Ex: CIE-0482910"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Index CIE (kWh)
                </label>
                <input
                  type="text"
                  value={electricityIndex}
                  onChange={(e) => setElectricityIndex(e.target.value)}
                  className="input-field"
                  placeholder="Ex: 014285"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  N° Compteur SODECI (Eau)
                </label>
                <input
                  type="text"
                  value={waterMeterNumber}
                  onChange={(e) => setWaterMeterNumber(e.target.value)}
                  className="input-field"
                  placeholder="Ex: SOD-993821"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Index SODECI (m³)
                </label>
                <input
                  type="text"
                  value={waterIndex}
                  onChange={(e) => setWaterIndex(e.target.value)}
                  className="input-field"
                  placeholder="Ex: 00542"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Nombre de jeux de clés
                </label>
                <input
                  type="number"
                  value={keysCount}
                  onChange={(e) => setKeysCount(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                  Détail remise des clés
                </label>
                <input
                  type="text"
                  value={keysDetail}
                  onChange={(e) => setKeysDetail(e.target.value)}
                  className="input-field"
                  placeholder="Clé blindée, portail, boîte aux lettres..."
                />
              </div>
            </div>
          </div>

          {/* Card 3: Constat Pièce par Pièce */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#059669" />
                3. Constat Détaillé Pièce par Pièce & Photos
              </h2>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nom de la pièce..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="input-field"
                  style={{ width: '180px', height: '36px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="btn btn-secondary"
                  style={{ height: '36px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={14} /> Ajouter pièce
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {roomsData.map((room, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {room.roomName}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleAddElement(rIdx)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                      >
                        <Plus size={12} /> Ajouter élément
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoom(rIdx)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626' }}
                        title="Supprimer la pièce"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Elements List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {room.elements.map((el, elIdx) => (
                      <div
                        key={elIdx}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '10px',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <input
                            type="text"
                            value={el.name}
                            onChange={(e) => handleUpdateElement(rIdx, elIdx, 'name', e.target.value)}
                            className="input-field"
                            style={{ fontWeight: 600, fontSize: '0.85rem' }}
                          />
                        </div>

                        <div>
                          <select
                            value={el.condition}
                            onChange={(e) => handleUpdateElement(rIdx, elIdx, 'condition', e.target.value)}
                            className="input-field"
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              color:
                                el.condition === 'neuf'
                                  ? '#059669'
                                  : el.condition === 'bon'
                                  ? '#0284c7'
                                  : el.condition === 'usage'
                                  ? '#d97706'
                                  : '#dc2626',
                            }}
                          >
                            <option value="neuf">Neuf</option>
                            <option value="bon">Bon état</option>
                            <option value="usage">État d’usage</option>
                            <option value="mauvais">Mauvais état</option>
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Observations / détails..."
                            value={el.comment || ''}
                            onChange={(e) => handleUpdateElement(rIdx, elIdx, 'comment', e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.85rem' }}
                          />
                        </div>

                        {/* Photo Upload & Gallery */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <label
                            className="btn btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Camera size={13} />
                            Photo
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handlePhotoUpload(rIdx, elIdx, e)}
                            />
                          </label>

                          {/* Thumbnails */}
                          {(el.photos || []).map((pUrl, pIdx) => (
                            <div key={pIdx} style={{ position: 'relative' }}>
                              <img
                                src={api.getFileUrl(pUrl)}
                                alt="Constat"
                                style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(rIdx, elIdx, pUrl)}
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  right: '-4px',
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleRemoveElement(rIdx, elIdx)}
                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                            title="Supprimer l'élément"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Retenues sur Caution (si Sortie) */}
          {type === 'exit' && (
            <div className="card" style={{ padding: '24px', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309' }}>
                <AlertCircle size={20} />
                4. Retenues sur Caution Locative (Dégradations constatées)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                    Montant estimé des retenues (FCFA)
                  </label>
                  <input
                    type="number"
                    value={estimatedDeductionAmount}
                    onChange={(e) => setEstimatedDeductionAmount(e.target.value)}
                    className="input-field"
                    placeholder="Ex: 50000"
                    min="0"
                  />
                  <span style={{ fontSize: '0.75rem', color: '#b45309' }}>
                    Montant déduit automatiquement de la caution à restituer au locataire.
                  </span>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>
                    Détails des retenues & travaux locatifs imputés
                  </label>
                  <textarea
                    rows={3}
                    value={deductionDetails}
                    onChange={(e) => setDeductionDetails(e.target.value)}
                    className="input-field"
                    placeholder="Ex: Remplacement du verrou cassé (15.000 FCFA), peinture d'une partie du mur salon suite à perforation (35.000 FCFA)."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card 5: Observations Générales */}
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '16px' }}>
              5. Remarques et Observations Générales
            </h2>
            <textarea
              rows={3}
              value={generalObservations}
              onChange={(e) => setGeneralObservations(e.target.value)}
              className="input-field"
              placeholder="Remarques particulières, état de propreté globale, conditions climatiques lors du constat..."
            />
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href="/inspections" className="btn btn-secondary">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={16} />
              {loading ? 'Génération du constat...' : 'Valider & Passer à la Signature'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
