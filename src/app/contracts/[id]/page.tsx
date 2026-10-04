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
  Edit3
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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link href={`/contracts/${id}/edit`} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={15} />
              Modifier le bail
            </Link>
            {contract.status === 'active' && (
              <button onClick={() => setShowTerm(true)} className="btn btn-danger">
                Résilier le bail
              </button>
            )}
          </div>
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

      </div>
    </Layout>
  );
}
