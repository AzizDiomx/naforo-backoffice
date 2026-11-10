'use client';

import { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck,
  Building,
  User,
  Zap,
  Droplets,
  Key,
  Download,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  PenTool,
  X,
  ExternalLink,
  Camera,
  Maximize2
} from 'lucide-react';

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingModal, setSigningModal] = useState<'inspector' | 'tenant' | null>(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const loadInspection = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inspections/${id}`);
      setInspection(res);
    } catch (err) {
      handleFormError(err, 'Impossible de charger les détails de cet état des lieux.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadInspection();
    }
  }, [id]);

  // Setup Canvas when modal opens
  useEffect(() => {
    if (signingModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      setHasDrawn(false);
    }
  }, [signingModal]);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirmSignature = async () => {
    if (!hasDrawn || !canvasRef.current) {
      showFormSuccess('Veuillez apposer votre signature sur le cadre.');
      return;
    }

    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    setSigningLoading(true);
    try {
      await api.post(`/inspections/${id}/sign`, {
        signerRole: signingModal,
        signature: signatureDataUrl,
      });

      showFormSuccess(`Signature ${signingModal === 'inspector' ? 'du gestionnaire' : 'du locataire'} enregistrée avec succès !`);
      setSigningModal(null);
      loadInspection();
    } catch (err) {
      handleFormError(err, 'Erreur lors de l’enregistrement de la signature.');
    } finally {
      setSigningLoading(false);
    }
  };

  const formatFcfa = (val: number | string | undefined | null) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Chargement des détails de l’état des lieux...
        </div>
      </Layout>
    );
  }

  if (!inspection) {
    return (
      <Layout>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2>Constat introuvable</h2>
          <Link href="/inspections" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Retour à la liste
          </Link>
        </div>
      </Layout>
    );
  }

  const isEntry = inspection.type === 'entry';
  const isSigned = inspection.status === 'signed';
  const meters = (inspection.meterReadings as any) || {};
  const rooms = (inspection.roomsData as any[]) || [];

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/inspections" className="btn btn-secondary" style={{ padding: '8px' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
                  État des Lieux {inspection.inspectionNumber}
                </h1>
                <span
                  className="badge"
                  style={{
                    backgroundColor: isEntry ? '#ecfdf5' : '#fef2f2',
                    color: isEntry ? '#059669' : '#dc2626',
                    borderColor: isEntry ? '#a7f3d0' : '#fecaca',
                    fontSize: '0.8rem',
                  }}
                >
                  {isEntry ? 'Constat d’Entrée' : 'Constat de Sortie'}
                </span>
                {isSigned ? (
                  <span className="badge badge-success" style={{ gap: '4px' }}>
                    <CheckCircle2 size={12} /> Signé & Certifié
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ gap: '4px' }}>
                    <Clock size={12} /> En attente de signature
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Effectué le {formatDate(inspection.inspectionDate || inspection.createdAt)} par {inspection.inspectorName || 'Gestionnaire'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {inspection.pdfUrl && (
              <a
                href={api.getFileUrl(inspection.pdfUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} /> Télécharger le PDF Certifié
              </a>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Bien */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Building size={20} color="#0284c7" />
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Bien Immobilier</h2>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {inspection.property?.name || 'Bien non renseigné'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {inspection.property?.address}, {inspection.property?.city}
            </div>
          </div>

          {/* Locataire */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <User size={20} color="#059669" />
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Locataire Désigné</h2>
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {inspection.tenantProfile
                ? `${inspection.tenantProfile.firstName} ${inspection.tenantProfile.lastName}`
                : 'Non assigné'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Tél : {inspection.tenantProfile?.phone || 'Non renseigné'}
            </div>
          </div>

          {/* Relevés Rapides */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Zap size={20} color="#eab308" />
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Relevés Clés & Énergie</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
              <div><strong>CIE :</strong> {meters.electricityMeterNumber || '-'} (Index: {meters.electricityIndex || '-'})</div>
              <div><strong>SODECI :</strong> {meters.waterMeterNumber || '-'} (Index: {meters.waterIndex || '-'})</div>
              <div><strong>Clés :</strong> {meters.keysCount ?? '-'} jeu(x) ({meters.keysDetail || 'Standard'})</div>
            </div>
          </div>
        </div>

        {/* Retenues sur caution (si Sortie) */}
        {!isEntry && (inspection.estimatedDeductionAmount || inspection.deductionDetails) && (
          <div className="card" style={{ padding: '20px', backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#b45309' }}>
              <AlertTriangle size={20} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Retenue Constatée sur Caution Locative
              </h2>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#b45309', marginBottom: '6px' }}>
              {formatFcfa(inspection.estimatedDeductionAmount)}
            </div>
            {inspection.deductionDetails && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>
                {inspection.deductionDetails}
              </p>
            )}
          </div>
        )}

        {/* Constat Pièce par Pièce */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={20} color="#0284c7" />
            Constat Détaillé par Pièce ({rooms.length} pièces inspectées)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rooms.map((room: any, rIdx: number) => (
              <div
                key={rIdx}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {room.roomName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(room.elements || []).map((el: any, elIdx: number) => {
                    const conditionBadge =
                      el.condition === 'neuf' ? (
                        <span className="badge badge-success">Neuf</span>
                      ) : el.condition === 'bon' ? (
                        <span className="badge badge-primary">Bon état</span>
                      ) : el.condition === 'usage' ? (
                        <span className="badge badge-warning">État d’usage</span>
                      ) : (
                        <span className="badge badge-danger">Mauvais état</span>
                      );

                    return (
                      <div
                        key={elIdx}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div style={{ flex: '1 1 200px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{el.name}</span>
                          {el.comment && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              💬 {el.comment}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {conditionBadge}

                          {/* Photos */}
                          {el.photos && el.photos.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {el.photos.map((pUrl: string, pIdx: number) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => setSelectedPhoto(api.getFileUrl(pUrl))}
                                  style={{
                                    border: 'none',
                                    padding: 0,
                                    background: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                  }}
                                  title="Agrandir la photo"
                                >
                                  <img
                                    src={api.getFileUrl(pUrl)}
                                    alt="Photo constat"
                                    style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observations Générales */}
        {inspection.generalObservations && (
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
              Observations Générales
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {inspection.generalObservations}
            </p>
          </div>
        )}

        {/* Dual Signature Module */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PenTool size={20} color="#7c3aed" />
            Signatures Électroniques Contradictoires
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Gestionnaire Signature Card */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: inspection.inspectorSignedAt ? '#f0fdf4' : '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Signature du Gestionnaire / Inspecteur
                </span>
                {inspection.inspectorSignedAt ? (
                  <span className="badge badge-success" style={{ gap: '4px' }}>
                    <CheckCircle2 size={12} /> Signé
                  </span>
                ) : (
                  <span className="badge badge-neutral">En attente</span>
                )}
              </div>

              {inspection.inspectorSignature ? (
                <div>
                  <img
                    src={inspection.inspectorSignature}
                    alt="Signature Gestionnaire"
                    style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Signé le {formatDate(inspection.inspectorSignedAt)}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSigningModal('inspector')}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <PenTool size={15} /> Signer en tant que Gestionnaire
                </button>
              )}
            </div>

            {/* Locataire Signature Card */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px',
                backgroundColor: inspection.tenantSignedAt ? '#f0fdf4' : '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Signature du Locataire
                </span>
                {inspection.tenantSignedAt ? (
                  <span className="badge badge-success" style={{ gap: '4px' }}>
                    <CheckCircle2 size={12} /> Signé
                  </span>
                ) : (
                  <span className="badge badge-neutral">En attente</span>
                )}
              </div>

              {inspection.tenantSignature ? (
                <div>
                  <img
                    src={inspection.tenantSignature}
                    alt="Signature Locataire"
                    style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Signé le {formatDate(inspection.tenantSignedAt)}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSigningModal('tenant')}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <PenTool size={15} /> Signer en tant que Locataire
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Signature Pad */}
        {signingModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '520px',
                padding: '24px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSigningModal(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
                Signature Électronique {signingModal === 'inspector' ? 'Gestionnaire' : 'Locataire'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Veuillez signer à l’aide de votre souris ou de votre doigt sur écran tactile ci-dessous :
              </p>

              {/* Canvas Pad */}
              <div
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  touchAction: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={470}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{ display: 'block', width: '100%', height: '180px', cursor: 'crosshair' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Effacer
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSigningModal(null)}
                    className="btn btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSignature}
                    disabled={signingLoading || !hasDrawn}
                    className="btn btn-primary"
                  >
                    {signingLoading ? 'Certification...' : 'Confirmer & Apposer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Photo Zoom */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px',
              cursor: 'zoom-out',
            }}
          >
            <img
              src={selectedPhoto}
              alt="Agrandissement photo constat"
              style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
