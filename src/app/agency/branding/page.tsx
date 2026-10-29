'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import {
  Palette,
  Upload,
  Check,
  Building2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Shield,
  Save,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AgencyBrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    primaryColor: '#013e37',
    accentColor: '#ffefb3',
    rccm: '',
    taxNumber: '',
    licenseNumber: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: 'Abidjan',
    whiteLabelEnabled: true,
    logoUrl: '',
    stampUrl: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);

  const loadBranding = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      let currentOrgId = '';
      if (userStr) {
        const u = JSON.parse(userStr);
        currentOrgId = u.organizationId || u.organization?.id;
        setOrgId(currentOrgId);
      }

      if (!currentOrgId) {
        const orgRes = await api.get('/auth/me');
        currentOrgId = orgRes.user?.organizationId || orgRes.organization?.id;
        setOrgId(currentOrgId);
      }

      if (currentOrgId) {
        const data = await api.get(`/organizations/${currentOrgId}/branding`);
        setFormData({
          name: data.name || '',
          tagline: data.tagline || 'Administration de biens & Gestion locative professionnelle',
          primaryColor: data.primaryColor || '#013e37',
          accentColor: data.accentColor || '#ffefb3',
          rccm: data.rccm || '',
          taxNumber: data.taxNumber || '',
          licenseNumber: data.licenseNumber || '',
          website: data.website || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || 'Abidjan',
          whiteLabelEnabled: data.whiteLabelEnabled !== false,
          logoUrl: data.logoUrl || '',
          stampUrl: data.stampUrl || '',
        });
      }
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des paramètres de marque blanche.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    try {
      await api.put(`/organizations/${orgId}/branding`, formData);
      showFormSuccess('Paramètres de marque blanche enregistrés avec succès. Tous vos futurs documents reflèteront ces changements.');
    } catch (err) {
      handleFormError(err, "Erreur lors de l'enregistrement de la marque blanche.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !orgId) return;
    const file = e.target.files[0];
    setLogoFile(file);

    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const res = await api.postFormData(`/organizations/${orgId}/logo`, form);
      setFormData((prev) => ({ ...prev, logoUrl: res.logoUrl || res.data?.logoUrl || prev.logoUrl }));
      showFormSuccess('Logo officiel mis à jour.');
    } catch (err) {
      handleFormError(err, 'Erreur lors du téléversement du logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadStamp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !orgId) return;
    const file = e.target.files[0];
    setStampFile(file);

    setUploadingStamp(true);
    try {
      const form = new FormData();
      form.append('stamp', file);
      const res = await api.postFormData(`/organizations/${orgId}/stamp`, form);
      setFormData((prev) => ({ ...prev, stampUrl: res.stampUrl || res.data?.stampUrl || prev.stampUrl }));
      showFormSuccess('Cachet officiel de l’agence mis à jour.');
    } catch (err) {
      handleFormError(err, 'Erreur lors du téléversement du cachet.');
    } finally {
      setUploadingStamp(false);
    }
  };

  const colorPresets = [
    { name: 'Émeraude Royale', primary: '#013e37', accent: '#ffefb3' },
    { name: 'Bleu Corporate', primary: '#1e3a8a', accent: '#dbeafe' },
    { name: 'Anthracite & Or', primary: '#18181b', accent: '#fef08a' },
    { name: 'Bordeaux Prestige', primary: '#7f1d1d', accent: '#fee2e2' },
    { name: 'Teal Agence Moderne', primary: '#0f766e', accent: '#ccfbf1' },
  ];

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          Chargement de l&apos;espace marque blanche...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(1, 62, 55, 0.1)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palette size={22} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Marque Blanche Agence
              </h1>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Personnalisez l&apos;identité visuelle, le logo, les couleurs et le cachet officiel appliqués sur tous vos documents (Baux, Quittances, CRG, Factures).
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={saving}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>

        {/* Live Preview Card */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            <Eye size={15} />
            APERÇU DE L&apos;EN-TÊTE OFFICIEL DE VOS DOCUMENTS PDF
          </div>

          <div
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: formData.primaryColor,
              color: '#ffffff',
              padding: '18px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {formData.logoUrl ? (
                <img
                  src={api.getFileUrl(formData.logoUrl)}
                  alt="Logo Agence"
                  style={{ width: '48px', height: '48px', objectFit: 'contain', backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px' }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                  }}
                >
                  {(formData.name || 'AG')[0]}
                </div>
              )}

              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  {(formData.name || 'VOTRE AGENCE IMMOBILIÈRE').toUpperCase()}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>
                  {formData.tagline || 'Administration de biens & Gestion locative professionnelle'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.75rem', opacity: 0.9, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>{[formData.phone, formData.email].filter(Boolean).join(' • ') || '+225 07 00 00 00 00'}</div>
              <div>{[formData.address, formData.city].filter(Boolean).join(', ') || 'Abidjan, Côte d’Ivoire'}</div>
              <div style={{ opacity: 0.75, fontSize: '0.7rem' }}>
                {[
                  formData.rccm ? `RCCM : ${formData.rccm}` : 'RCCM : CI-ABJ-XXXX',
                  formData.taxNumber ? `CC : ${formData.taxNumber}` : 'CC : XXXXXXX',
                ].join(' | ')}
              </div>
            </div>
          </div>
        </div>

        {/* Main Settings Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Col 1: Visual Identity & Colors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Identity Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                Identité Visuelle & Nom Commercial
              </h3>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Nom commercial de l&apos;agence *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Ivoire Prestige Immobilier"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slogan ou spécialité</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Ex: Expert en gestion locative et syndic de copropriété"
                />
              </div>

              {/* Color Presets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Thème de couleur prédéfini</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: preset.primary, accentColor: preset.accent })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: preset.primary,
                        color: '#ffffff',
                        border: formData.primaryColor === preset.primary ? '2px solid #000000' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {formData.primaryColor === preset.primary && <Check size={12} />}
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Couleur primaire</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      style={{ width: '42px', height: '38px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Couleur secondaire / accent</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      style={{ width: '42px', height: '38px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border)' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logos & Stamp Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} style={{ color: 'var(--primary)' }} />
                Logo Officiel & Cachet de l&apos;Agence
              </h3>

              {/* Logo Upload */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px dashed var(--border)',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {formData.logoUrl ? (
                    <img src={api.getFileUrl(formData.logoUrl)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Building2 size={24} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Logo Haute Résolution</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PNG transparent ou JPEG recommandé (max 2 Mo).</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadLogo}
                    disabled={uploadingLogo}
                    style={{ fontSize: '0.8rem', marginTop: '4px' }}
                  />
                  {uploadingLogo && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Téléversement du logo...</span>}
                </div>
              </div>

              {/* Stamp / Cachet Upload */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '8px',
                    border: '1px dashed var(--border)',
                    backgroundColor: '#fafafa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {formData.stampUrl ? (
                    <img src={api.getFileUrl(formData.stampUrl)} alt="Cachet" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Shield size={24} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Cachet officiel / Signature du Directeur</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Apposé automatiquement au bas des quittances et des baux certifiés.</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadStamp}
                    disabled={uploadingStamp}
                    style={{ fontSize: '0.8rem', marginTop: '4px' }}
                  />
                  {uploadingStamp && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Téléversement du cachet...</span>}
                </div>
              </div>
            </div>

          </div>

          {/* Col 2: Legal Info & Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Legal Mentions Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'var(--primary)' }} />
                Mentions Légales & Agréments
              </h3>

              <div className="form-group">
                <label className="form-label">Numéro RCCM (Registre du Commerce)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.rccm}
                  onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                  placeholder="Ex: CI-ABJ-2023-B-14258"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Numéro de Compte Contribuable (CC / DGI)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  placeholder="Ex: 2104589 A"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Agrément Ministériel / N° Carte Professionnelle</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="Ex: AG-MCLU-2024-N0092"
                />
              </div>
            </div>

            {/* Contact Details Box */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} style={{ color: 'var(--primary)' }} />
                Coordonnées & Siège Social
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Téléphone Agence</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+225 07..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Professionnel</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@agence.ci"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Adresse du Siège</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Plateau, Immeuble Horizon"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Abidjan"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Site Web officiel</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.monagence.ci"
                />
              </div>

              {/* White Label toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input
                  type="checkbox"
                  id="whiteLabelCheck"
                  checked={formData.whiteLabelEnabled}
                  onChange={(e) => setFormData({ ...formData, whiteLabelEnabled: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="whiteLabelCheck" style={{ fontSize: '0.8125rem', cursor: 'pointer', margin: 0 }}>
                  <strong>Activer la marque blanche sur tous les exports PDF</strong>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    Vos clients (locataires et bailleurs) verront exclusivement l&apos;identité et les coordonnées de votre agence.
                  </div>
                </label>
              </div>

            </div>

          </div>

        </form>
      </div>
    </Layout>
  );
}
