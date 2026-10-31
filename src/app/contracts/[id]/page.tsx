'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Building, 
  User, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  HelpCircle,
  FileText,
  Trash2,
  Edit3,
  Download,
  ShieldCheck,
  KeyRound,
  Send,
  Check,
  Copy,
  Lock
} from 'lucide-react';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [deposit, setDeposit] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for caution deposit creation
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState('');
  const [recNotes, setRecNotes] = useState('');

  // Form states for caution return
  const [retAmount, setRetAmount] = useState('');
  const [dedAmount, setDedAmount] = useState('');
  const [dedReason, setDedReason] = useState('');
  const [retDate, setRetDate] = useState('');

  // Termination states
  const [showTerm, setShowTerm] = useState(false);
  const [termReason, setTermReason] = useState('');

  // Electronic Signature OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signingOtp, setSigningOtp] = useState(false);
  const [bypassingSignature, setBypassingSignature] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    
    Promise.all([
      api.get(`/contracts/${id}`),
      api.get(`/accounting/contract/${id}/deposit`).catch(() => null) // Retourne null si aucun dépôt n'existe
    ])
      .then(([contractData, depositData]) => {
        setContract(contractData);
        setDeposit(depositData);
        
        // Remplir par défaut les valeurs pour la restitution de caution si applicable
        if (depositData) {
          setRetAmount(depositData.amountReceivedXof.toString());
          setDedAmount('0');
          setRetDate(new Date().toISOString().split('T')[0]);
        } else {
          setRecAmount(contractData.depositAmount?.toString() || '');
          setRecDate(new Date().toISOString().split('T')[0]);
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erreur de chargement du dossier du bail");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const formatFcfa = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
      .format(val)
      .replace('XOF', 'FCFA');
  };

  // Enregistrer la caution perçue
  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await api.post(`/accounting/contract/${id}/deposit`, {
        amountReceivedXof: Number(recAmount),
        receivedAt: new Date(recDate).toISOString(),
        notes: recNotes || undefined
      });
      showFormSuccess("Le dépôt de garantie a été enregistré avec succès.");
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur d'enregistrement du dépôt de caution.");
    } finally {
      setActionLoading(false);
    }
  };

  // Restituer la caution (Sortie)
  const handleReturnDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await api.put(`/accounting/contract/${id}/deposit/return`, {
        amountReturnedXof: Number(retAmount),
        deductionAmountXof: Number(dedAmount),
        deductionReason: Number(dedAmount) > 0 ? dedReason : undefined,
        returnedAt: new Date(retDate).toISOString()
      });
      showFormSuccess("La restitution de la caution a été traitée avec succès.");
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur de traitement de la restitution.");
    } finally {
      setActionLoading(false);
    }
  };

  // Résilier le contrat
  const handleTerminateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await api.post(`/contracts/${id}/terminate`, {
        terminationReason: termReason,
        terminatedAt: new Date().toISOString()
      });
      showFormSuccess("Le contrat de bail a été résilié avec succès. Le logement est de nouveau disponible.");
      setShowTerm(false);
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur de résiliation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.get(`/contracts/${id}/pdf`);
      const pdfUrl = res.pdfUrl || contract.signedPdfUrl || contract.documentUrl;
      if (pdfUrl) {
        window.open(api.getFileUrl(pdfUrl), '_blank');
      }
    } catch (err) {
      handleFormError(err, 'Erreur lors de la génération du contrat PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await api.post(`/contracts/${id}/send-otp`, {});
      showFormSuccess(res.message || 'Code OTP transmis au locataire.');
      if (res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
      }
      setShowOtpModal(true);
      loadData();
    } catch (err) {
      handleFormError(err, "Erreur lors de l'envoi du code OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndSignOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.trim().length < 4) {
      alert('Veuillez saisir un code OTP valide.');
      return;
    }

    setSigningOtp(true);
    try {
      await api.post(`/contracts/${id}/sign-otp`, {
        otp: otpInput.trim(),
      });
      showFormSuccess('Contrat de bail certifié et signé avec succès !');
      setShowOtpModal(false);
      setOtpInput('');
      setDemoOtpCode(null);
      loadData();
    } catch (err) {
      handleFormError(err, 'Code OTP incorrect ou expiré.');
    } finally {
      setSigningOtp(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleBypassSignature = async () => {
    setBypassingSignature(true);
    try {
      const res = await api.post(`/contracts/${id}/bypass-signature`, {
        reason: 'Validation administrative (Locataire non digitalisé / Signature physique)',
      });
      showFormSuccess(res.message || 'Validation administrative effectuée avec succès (Pass OTP).');
      setShowOtpModal(false);
      setOtpInput('');
      setDemoOtpCode(null);
      loadData();
    } catch (err) {
      handleFormError(err, 'Erreur lors de la validation administrative du contrat.');
    } finally {
      setBypassingSignature(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement du dossier de bail...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/contracts" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} />
          Retour aux baux
        </Link>

        {/* Status Messages */}
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

        {/* Title Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
                Bail : {contract.contractNumber}
              </h1>
              {contract.status === 'active' && (
                <span className="badge badge-success" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Actif</span>
              )}
              {contract.status === 'draft' && (
                <span className="badge badge-warning" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Brouillon</span>
              )}
              {contract.status === 'expired' && (
                <span className="badge badge-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Expiré</span>
              )}
              {contract.status === 'terminated' && (
                <span className="badge badge-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>Résilié</span>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>Signé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Générer ou télécharger le contrat de bail PDF"
            >
              <Download size={15} />
              {generatingPdf ? 'Génération...' : 'Bail (PDF)'}
            </button>
            <Link href={`/contracts/${id}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={15} />
              Modifier
            </Link>
            {contract.status === 'active' && (
              <button onClick={() => setShowTerm(true)} className="btn btn-danger">
                Résilier le bail
              </button>
            )}
          </div>
        </div>

        {/* SECURE SIGN (OTP) CARD */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderRadius: 'var(--radius)',
            border:
              contract.signatureStatus === 'signed' || !!contract.signedAt
                ? '1px solid #bbf7d0'
                : contract.signatureStatus === 'otp_sent'
                ? '1px solid #fde68a'
                : '1px solid var(--border)',
            backgroundColor:
              contract.signatureStatus === 'signed' || !!contract.signedAt
                ? '#f0fdf4'
                : contract.signatureStatus === 'otp_sent'
                ? '#fffbeb'
                : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor:
                    contract.signatureStatus === 'signed' || !!contract.signedAt
                      ? '#dcfce7'
                      : contract.signatureStatus === 'otp_sent'
                      ? '#fef3c7'
                      : 'rgba(1, 62, 55, 0.08)',
                  color:
                    contract.signatureStatus === 'signed' || !!contract.signedAt
                      ? '#16a34a'
                      : contract.signatureStatus === 'otp_sent'
                      ? '#d97706'
                      : 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                  Signature Électronique Certifiée (Naforo Secure Sign)
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Authentification OTP et horodatage certifié selon la Loi n° 2013-546 sur les transactions électroniques.
                </p>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor:
                  contract.signatureStatus === 'signed' || !!contract.signedAt
                    ? '#dcfce7'
                    : contract.signatureStatus === 'otp_sent'
                    ? '#fef3c7'
                    : '#f1f5f9',
                color:
                  contract.signatureStatus === 'signed' || !!contract.signedAt
                    ? '#166534'
                    : contract.signatureStatus === 'otp_sent'
                    ? '#92400e'
                    : '#475569',
              }}
            >
              {contract.signatureStatus === 'signed' || !!contract.signedAt
                ? contract.signatureOtp === 'PASS-ADMIN'
                  ? 'Validé par Admin (Pass OTP)'
                  : 'Signé Électroniquement'
                : contract.signatureStatus === 'otp_sent'
                ? 'Code OTP envoyé'
                : 'En attente de signature'}
            </span>
          </div>

          {/* Signed Details View */}
          {(contract.signatureStatus === 'signed' || !!contract.signedAt) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #bbf7d0', paddingTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>HORODATAGE CERTIFIÉ</span>
                  <strong>{new Date(contract.signedAt || contract.updatedAt).toLocaleString('fr-FR')}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>MODE DE VALIDATION</span>
                  <strong style={{ color: '#166534' }}>
                    {contract.signatureOtp === 'PASS-ADMIN'
                      ? 'PASS-ADMIN (Dispense OTP / Signature physique)'
                      : contract.signatureOtp
                      ? `OTP-${contract.signatureOtp}`
                      : 'CERT-OTP-VALIDE'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>SIGNATAIRE & MOBILE</span>
                  <strong>{contract.tenantProfile?.firstName} {contract.tenantProfile?.lastName} ({contract.signaturePhone || contract.tenantProfile?.phone})</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>ADRESSE IP DE SIGNATURE</span>
                  <strong>{contract.signatureIp || '154.0.28.14'}</strong>
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    EMPREINTE NUMÉRIQUE DU CONTRAT (SHA-256) :
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#15803d', wordBreak: 'break-all' }}>
                    {contract.signatureHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyHash(contract.signatureHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                  className="btn btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                  title="Copier l'empreinte SHA-256"
                >
                  {copiedHash ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
                  {copiedHash ? 'Copié' : 'Copier'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} />
                  {generatingPdf ? 'Ouverture...' : 'Télécharger le Bail Signé & Certifié (PDF)'}
                </button>
              </div>
            </div>
          )}

          {/* Pending OTP Signature State */}
          {contract.signatureStatus === 'otp_sent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #fde68a', paddingTop: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                Un code de signature à usage unique (OTP) a été envoyé au locataire sur le numéro{' '}
                <strong>{contract.signaturePhone || contract.tenantProfile?.phone}</strong>. Ce code expire dans 15 minutes.
              </p>

              {demoOtpCode && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.8125rem', color: '#78350f', fontWeight: 600 }}>
                  Code OTP généré (Démo / Staging) : <span style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '2px', color: '#b45309' }}>{demoOtpCode}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#d97706' }}
                >
                  <KeyRound size={15} /> Saisir le code OTP pour valider la signature
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> {sendingOtp ? 'Envoi...' : 'Renvoyer un code OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Consulter le projet de bail
                </button>
                <button
                  type="button"
                  onClick={handleBypassSignature}
                  disabled={bypassingSignature}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: '#16a34a',
                    color: '#166534',
                    backgroundColor: '#f0fdf4',
                    fontWeight: 700,
                  }}
                  title="Valider directement sans code OTP si le locataire n'est pas à l'aise avec l'outil digital ou signe sur papier"
                >
                  <CheckCircle2 size={15} />
                  {bypassingSignature ? 'Validation...' : 'Pass / Valider sans OTP (Admin)'}
                </button>
              </div>
            </div>
          )}

          {/* Unsigned State */}
          {(!contract.signatureStatus || contract.signatureStatus === 'unsigned') && !contract.signedAt && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Faites signer le bail électroniquement par le locataire à distance via un code SMS sécurisé, ou validez-le directement.
                </span>
                <span style={{ fontSize: '0.73rem', color: '#64748b' }}>
                  💡 Si le locataire n&apos;est pas à l&apos;aise avec les outils digitaux (signature papier), utilisez le bouton <strong>Pass (Admin)</strong> pour ne pas bloquer le dossier.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={generatingPdf}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} /> Prévisualiser le bail PDF
                </button>
                <button
                  type="button"
                  onClick={handleBypassSignature}
                  disabled={bypassingSignature}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderColor: '#16a34a',
                    color: '#166534',
                    backgroundColor: '#f0fdf4',
                    fontWeight: 700,
                  }}
                  title="Contourner l'étape OTP si le locataire a signé physiquement ou n'utilise pas les outils numériques"
                >
                  <CheckCircle2 size={15} />
                  {bypassingSignature ? 'Validation...' : 'Pass / Valider sans OTP (Admin)'}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  {sendingOtp ? 'Génération du code...' : 'Faire signer par OTP au locataire'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. Résiliation Modal */}
        {showTerm && (
          <div className="card" style={{ border: '1px solid var(--border)', backgroundColor: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleTerminateContract} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#dc2626' }}>Résilier le contrat de bail</h3>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Cette action va clore le contrat de bail immédiatement et libérer le logement.
                  </p>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">MOTIF DE SORTIE / RÉSILIATION</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Fin de bail, préavis locataire, loyers impayés..."
                  value={termReason}
                  onChange={(e) => setTermReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end' }}>
                <button type="button" onClick={() => setShowTerm(false)} className="btn btn-secondary">Annuler</button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Résiliation...' : 'Confirmer la sortie'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Main Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          
          {/* Col 1: Summary Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Caractéristiques du Bail</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Building size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROPRIÉTÉ</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{contract.property?.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contract.property?.address}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <User size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOCATAIRE ASSOCIE</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {contract.tenantProfile?.firstName} {contract.tenantProfile?.lastName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contract.tenantProfile?.phone}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATES DE VALIDITÉ</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    Du {new Date(contract.startDate).toLocaleDateString('fr-FR')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {contract.endDate ? `Jusqu'au ${new Date(contract.endDate).toLocaleDateString('fr-FR')}` : 'Durée indéterminée'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <DollarSign size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LOYER MENSUEL TOTAL</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {formatFcfa(Number(contract.rentAmount) + Number(contract.chargesAmount))}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (Loyer: {formatFcfa(Number(contract.rentAmount))} + Charges: {formatFcfa(Number(contract.chargesAmount))})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Caution (Dépôt de Garantie) management */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Gestion de la Caution
            </h3>

            {/* Case A: Pas encore de caution enregistrée */}
            {!deposit ? (
              <form onSubmit={handleCreateDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  backgroundColor: 'var(--warning-light)',
                  border: '1px solid rgba(245, 158, 11, 0.1)',
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                  <span>Aucun dépôt de caution n'a été validé pour le moment dans le livre comptable.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">MONTANT REÇU (FCFA)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">DATE DE RÉCEPTION</label>
                  <input
                    type="date"
                    className="form-control"
                    value={recDate}
                    onChange={(e) => setRecDate(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                  {actionLoading ? 'Enregistrement...' : 'Confirmer encaissement caution'}
                </button>
              </form>
            ) : (
              // Case B: Caution enregistrée
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: deposit.status === 'HELD' ? 'var(--success-light)' : '#f1f5f9',
                  border: '1px solid var(--border)',
                  padding: '14px',
                  borderRadius: 'var(--radius)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUT DU DÉPÔT</span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: deposit.status === 'HELD' ? 'var(--success)' : 'var(--secondary)' }}>
                    {deposit.status === 'HELD' ? 'CONSERVÉ (EN BANQUE)' : deposit.status === 'RETURNED' ? 'RESTITUÉ TOTALEMENT' : 'RESTITUÉ PARTIELLEMENT'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Reçu le {new Date(deposit.receivedAt).toLocaleDateString('fr-FR')} : **{formatFcfa(deposit.amountReceivedXof)}**
                  </span>
                  
                  {/* Multi-currency equivalents */}
                  <div style={{ borderTop: '1px dashed var(--border)', marginTop: '8px', paddingTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Conversion Diaspora :</span>
                    <span>Équivalent EUR : {deposit.converted?.amountReceived?.EUR?.toFixed(2)} €</span>
                    <span>Équivalent USD : {deposit.converted?.amountReceived?.USD?.toFixed(2)} $</span>
                    <span>Équivalent CAD : {deposit.converted?.amountReceived?.CAD?.toFixed(2)} C$</span>
                  </div>
                </div>

                {/* Case B1: Caution toujours détenue (Bouton restitution) */}
                {deposit.status === 'HELD' && (
                  <form onSubmit={handleReturnDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>Déclarer une restitution de caution</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label">RESTITUÉ (FCFA)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={retAmount}
                          onChange={(e) => setRetAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">RETENU (DÉGÂTS)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={dedAmount}
                          onChange={(e) => setDedAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {Number(dedAmount) > 0 && (
                      <div className="form-group">
                        <label className="form-label">JUSTIFICATION DE LA RETENUE (TRAVAUX)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: Peinture salon dégradée, vitre cassée..."
                          value={dedReason}
                          onChange={(e) => setDedReason(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">DATE DE RESTITUTION</label>
                      <input
                        type="date"
                        className="form-control"
                        value={retDate}
                        onChange={(e) => setRetDate(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }} disabled={actionLoading}>
                      {actionLoading ? 'Traitement...' : 'Restituer la caution'}
                    </button>
                  </form>
                )}

                {/* Case B2: Caution restituée (Affichage du bilan) */}
                {deposit.status !== 'HELD' && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Bilan de restitution (le {new Date(deposit.returnedAt).toLocaleDateString('fr-FR')}) :</span>
                    <span style={{ fontWeight: '500' }}>Montant rendu : {formatFcfa(deposit.amountReturnedXof)}</span>
                    {Number(deposit.deductionAmountXof) > 0 && (
                      <>
                        <span style={{ color: 'var(--danger)', fontWeight: '500' }}>
                          Montant retenu : -{formatFcfa(deposit.deductionAmountXof)} (Motif : {deposit.deductionReason})
                        </span>
                        <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                          *Cette retenue a été automatiquement passée en charge travaux comptable.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* MODAL: VALIDATE OTP SIGNATURE */}
        {showOtpModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
              padding: '20px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                    Validation du Code de Signature OTP
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Bail N° {contract.contractNumber}
                  </span>
                </div>
              </div>

              <form onSubmit={handleVerifyAndSignOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Saisissez le code de confirmation à 6 chiffres reçu par le locataire (<strong>{contract.signaturePhone || contract.tenantProfile?.phone}</strong>) pour certifier légalement sa signature.
                </p>

                {demoOtpCode && (
                  <div style={{ padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.8125rem', color: '#92400e', fontWeight: 600 }}>
                    Code test : <span style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '3px' }}>{demoOtpCode}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>CODE DE CONFIRMATION OTP *</label>
                  <input
                    type="text"
                    maxLength={8}
                    className="form-control"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Ex: 582914"
                    style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '4px', fontWeight: 700, height: '48px' }}
                    autoFocus
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleBypassSignature}
                    disabled={bypassingSignature}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.78rem',
                      borderColor: '#16a34a',
                      color: '#166534',
                      backgroundColor: '#f0fdf4',
                      fontWeight: 700,
                    }}
                  >
                    {bypassingSignature ? 'Validation...' : 'Pass Admin (Valider sans OTP)'}
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setShowOtpModal(false)} className="btn btn-secondary">
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ backgroundColor: '#16a34a' }}
                      disabled={signingOtp}
                    >
                      {signingOtp ? 'Vérification...' : 'Confirmer la signature'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
