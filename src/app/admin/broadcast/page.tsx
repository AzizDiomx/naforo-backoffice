'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { 
  Radio, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Building2, 
  UserCheck, 
  Bell,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function BroadcastPage() {
  const [target, setTarget] = useState<'all' | 'owners' | 'tenants' | 'organization'>('all');
  const [organizationId, setOrganizationId] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [type, setType] = useState('SYSTEM_BROADCAST');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // History of broadcast messages sent in session
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Load organizations for target selection dropdown
    api.get('/organizations?limit=100')
      .then(res => {
        const list = Array.isArray(res) ? res : res.data || res.items || [];
        setOrganizations(list);
      })
      .catch(() => {});
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError("Veuillez remplir le titre et le contenu du message.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/admin/notifications/broadcast', {
        title,
        message,
        target,
        organizationId: target === 'organization' ? organizationId : undefined,
        type
      });

      const count = res.recipientCount || 0;
      setSuccess(`Notification diffusée avec succès à ${count} utilisateur(s) !`);

      // Add to session history
      setHistory(prev => [
        {
          id: Date.now().toString(),
          title,
          message,
          target,
          count,
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        },
        ...prev
      ]);

      // Reset form
      setTitle('');
      setMessage('');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Erreur lors de la diffusion de la notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Radio size={28} color="var(--primary)" /> Diffusion de Notifications Internes
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Diffusez des alertes en temps réel sur la cloche In-App de tous les utilisateurs ou de cibles spécifiques
            </p>
          </div>
        </div>

        {/* Banners */}
        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius)', padding: '14px', color: 'var(--danger)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-light)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius)', padding: '14px', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span>{success}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          
          {/* Main Form */}
          <div className="card" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Target Selector */}
              <div>
                <label className="form-label" style={{ fontWeight: '700', fontSize: '0.85rem' }}>CIBLE DE LA DIFFUSION</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                  
                  <button
                    type="button"
                    onClick={() => setTarget('all')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${target === 'all' ? 'var(--primary)' : '#e2e8f0'}`,
                      backgroundColor: target === 'all' ? '#eff6ff' : '#ffffff',
                      color: target === 'all' ? 'var(--primary)' : '#0f172a',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Users size={18} /> Tous les Utilisateurs
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('owners')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${target === 'owners' ? 'var(--primary)' : '#e2e8f0'}`,
                      backgroundColor: target === 'owners' ? '#eff6ff' : '#ffffff',
                      color: target === 'owners' ? 'var(--primary)' : '#0f172a',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <UserCheck size={18} /> Propriétaires / Agences
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('tenants')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${target === 'tenants' ? 'var(--primary)' : '#e2e8f0'}`,
                      backgroundColor: target === 'tenants' ? '#eff6ff' : '#ffffff',
                      color: target === 'tenants' ? 'var(--primary)' : '#0f172a',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Users size={18} /> Tous les Locataires
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget('organization')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `2px solid ${target === 'organization' ? 'var(--primary)' : '#e2e8f0'}`,
                      backgroundColor: target === 'organization' ? '#eff6ff' : '#ffffff',
                      color: target === 'organization' ? 'var(--primary)' : '#0f172a',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Building2 size={18} /> Agence Spécifique
                  </button>

                </div>
              </div>

              {/* Organization Select Dropdown if target === organization */}
              {target === 'organization' && (
                <div className="form-group">
                  <label className="form-label">SÉLECTIONNER L'AGENCE</label>
                  <select
                    className="form-control"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner une entreprise / agence --</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name} ({o.email || o.plan})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Severity / Type */}
              <div className="form-group">
                <label className="form-label">TYPE / NIVEAU D'URGENCE</label>
                <select
                  className="form-control"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="SYSTEM_INFO">🔵 Information Système</option>
                  <option value="SYSTEM_WARNING">🟡 Avertissement / Maintenance</option>
                  <option value="SYSTEM_URGENT">🔴 Alerte Urgente / Obligatoire</option>
                </select>
              </div>

              {/* Title Input */}
              <div className="form-group">
                <label className="form-label">TITRE DE LA NOTIFICATION</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Maintenance système programmée ce samedi de 02h à 04h"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Message Textarea */}
              <div className="form-group">
                <label className="form-label">CONTENU DU MESSAGE</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Saisissez ici le texte de la notification qui apparaîtra sur la cloche In-App..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '14px', fontSize: '0.95rem', justifyContent: 'center' }}
                disabled={loading}
              >
                <Send size={18} />
                {loading ? 'Diffusion en cours...' : 'Diffuser la notification maintenant'}
              </button>

            </form>
          </div>

          {/* History Panel */}
          <div className="card" style={{ padding: '20px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--primary)" /> Historique de la Session
            </h3>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Aucune notification diffusée au cours de cette session.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map(item => (
                  <div key={item.id} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      <span>{item.title}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.date}</span>
                    </div>
                    <p style={{ color: '#475569', margin: 0, fontSize: '0.78rem', lineHeight: '1.4' }}>{item.message}</p>
                    <div style={{ marginTop: '8px', fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Users size={12} /> Cible : {item.target.toUpperCase()} • {item.count} destinataire(s)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
