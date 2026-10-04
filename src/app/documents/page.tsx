'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { api, ApiError } from '@/lib/api';
import { useSubscriptionFeature } from '@/lib/useSubscriptionFeature';
import Link from 'next/link';
import {
  FolderKanban,
  FileText,
  Download,
  Search,
  FileCode,
  Image as ImageIcon,
  Plus,
  Upload,
  Trash2,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  HardDrive,
  Folder,
  LayoutGrid,
  List,
  Eye,
  Copy,
  Check,
  Calendar,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  FileArchive,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

export default function DocumentsPage() {
  const { hasFeature, planName } = useSubscriptionFeature();
  const canUseGed = hasFeature('ged_vault');

  // Données
  const [documents, setDocuments] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres et recherche
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'size_desc' | 'name_asc'>('date_desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<any | null>(null);

  // Formulaire d'upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('general');
  const [customDocName, setCustomDocName] = useState('');
  const [associatedPropertyId, setAssociatedPropertyId] = useState('');
  const [associatedTenantId, setAssociatedTenantId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/documents'),
      api.get('/properties').catch(() => []),
      api.get('/tenant-profiles').catch(() => []),
    ])
      .then(([docsRes, propsRes, tenantsRes]) => {
        setDocuments(Array.isArray(docsRes) ? docsRes : docsRes?.items || docsRes?.data || []);
        setProperties(Array.isArray(propsRes) ? propsRes : propsRes?.items || propsRes?.data || []);
        setTenants(Array.isArray(tenantsRes) ? tenantsRes : tenantsRes?.items || tenantsRes?.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erreur lors du chargement des documents.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 Ko';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, size = 20) => {
    if (mimeType?.includes('image')) return <ImageIcon size={size} style={{ color: '#059669' }} />;
    if (mimeType?.includes('pdf')) return <FileText size={size} style={{ color: '#DC2626' }} />;
    if (mimeType?.includes('word') || mimeType?.includes('officedocument')) return <FileText size={size} style={{ color: '#2563EB' }} />;
    if (mimeType?.includes('zip') || mimeType?.includes('archive')) return <FileArchive size={size} style={{ color: '#D97706' }} />;
    return <FileCode size={size} style={{ color: '#475569' }} />;
  };

  const folderDefinitions: Record<string, { label: string; icon: any; color: string }> = {
    contract: { label: 'Baux & Contrats', icon: FileText, color: '#013E37' },
    property: { label: 'Titres & Actes Fonciers', icon: Building, color: '#059669' },
    tenant_profile: { label: 'Dossiers Locataires', icon: User, color: '#2563EB' },
    invoice: { label: 'Factures & Quittances', icon: FileText, color: '#D97706' },
    incident: { label: 'Travaux & Sinistres', icon: FileArchive, color: '#EA580C' },
    general: { label: 'Documents Généraux', icon: Folder, color: '#475569' },
  };

  // Calcul du stockage total utilisé
  const totalStorageBytes = useMemo(() => {
    return documents.reduce((sum, d) => sum + Number(d.fileSize || 0), 0);
  }, [documents]);

  const storageQuotaMaxBytes = 10 * 1024 * 1024 * 1024; // 10 Go standard
  const storageUsedPercent = Math.min(100, Math.max(0.5, (totalStorageBytes / storageQuotaMaxBytes) * 100)).toFixed(1);

  // Groupement par dossier
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((d) => {
      const folder = d.entityType || 'general';
      counts[folder] = (counts[folder] || 0) + 1;
    });
    return counts;
  }, [documents]);

  // Filtrage et tri des documents
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((d) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const nameMatch = d.name?.toLowerCase().includes(q);
          const typeMatch = d.entityType?.toLowerCase().includes(q);
          if (!nameMatch && !typeMatch) return false;
        }

        // Folder
        if (selectedFolder !== 'ALL' && d.entityType !== selectedFolder) {
          return false;
        }

        // Mime Type
        if (mimeTypeFilter !== 'ALL') {
          if (mimeTypeFilter === 'pdf' && !d.mimeType?.includes('pdf')) return false;
          if (mimeTypeFilter === 'image' && !d.mimeType?.includes('image')) return false;
          if (mimeTypeFilter === 'doc' && !d.mimeType?.includes('word') && !d.mimeType?.includes('officedocument')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'size_desc') return (b.fileSize || 0) - (a.fileSize || 0);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [documents, search, selectedFolder, mimeTypeFilter, sortBy]);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Soumission du téléversement
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Veuillez sélectionner un fichier à téléverser.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('entityType', entityType);
      
      const targetEntityId = associatedPropertyId || associatedTenantId || '';
      if (targetEntityId) {
        formData.append('entityId', targetEntityId);
      }

      await api.upload('/documents/upload', formData);

      setSuccess(`Le document "${uploadFile.name}" a été chiffré et sécurisé dans le coffre-fort !`);
      setShowUploadModal(false);
      setUploadFile(null);
      setCustomDocName('');
      setAssociatedPropertyId('');
      setAssociatedTenantId('');
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erreur lors du téléversement dans le coffre-fort.');
    } finally {
      setUploading(false);
    }
  };

  // Suppression d'un document
  const handleConfirmDelete = async () => {
    if (!deleteTargetDoc) return;
    try {
      await api.delete(`/documents/${deleteTargetDoc.id}`);
      setSuccess(`Document "${deleteTargetDoc.name}" supprimé définitivement du coffre-fort.`);
      setDeleteTargetDoc(null);
      loadData();
    } catch (err: any) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erreur lors de la suppression du document.');
    }
  };

  const getFullFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    return `http://localhost:3000${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  const copyFileUrl = (fileUrl: string, id: string) => {
    const fullUrl = getFullFileUrl(fileUrl);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

        {/* ----------------------------------------------------------------- */}
        {/* EXECUTIVE HEADER */}
        {/* ----------------------------------------------------------------- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(1, 62, 55, 0.08)',
                color: '#013E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FolderKanban size={22} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                Coffre-fort Numérique (GED)
              </h1>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '6px', maxWidth: '650px', lineHeight: 1.5 }}>
              Archivage sécurisé à valeur probante (AES-256), baux numériques, titres fonciers et gestion documentaire dématérialisée.
            </p>
          </div>

          {/* Action button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (!canUseGed) {
                  setError("Le coffre-fort GED et le téléversement de pièces sont réservés aux forfaits Pro et Expert.");
                  return;
                }
                setShowUploadModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#013E37',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)'
              }}
            >
              <Plus size={18} />
              Déposer un Document
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 4 KPI METRIC CARDS (STORAGE & SECURITY) */}
        {/* ----------------------------------------------------------------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>

          {/* Card 1: Espace Utilisé */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Stockage Consommé
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#F8FAFC',
                color: '#013E37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HardDrive size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginTop: '12px' }}>
              {formatBytes(totalStorageBytes)} <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#64748B' }}>/ 10 Go</span>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '9999px', marginTop: '12px', overflow: 'hidden' }}>
              <div style={{ width: `${storageUsedPercent}%`, height: '100%', backgroundColor: '#059669', borderRadius: '9999px' }} />
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '6px' }}>
              {storageUsedPercent}% de votre quota cloud utilisé
            </div>
          </div>

          {/* Card 2: Total Documents */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Documents Protégés
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginTop: '12px' }}>
              {documents.length} <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#64748B' }}>fichiers scellés</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginTop: '12px' }}>
              Indexation et recherche plein texte active
            </div>
          </div>

          {/* Card 3: Baux & Titres Fonciers */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>
                Baux & Actes Légaux
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginTop: '12px' }}>
              {(folderCounts.contract || 0) + (folderCounts.property || 0)} <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#64748B' }}>actes officiels</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '12px' }}>
              Contrats de bail et titres de propriété
            </div>
          </div>

          {/* Card 4: Sécurité & Intégrité AES-256 */}
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>
                Sécurité & Confidentialité
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#013E37', marginTop: '12px' }}>
              Chiffrement AES-256
            </div>
            <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '8px', fontWeight: '600' }}>
              Norme bancaire & intégrité probante
            </div>
          </div>

        </div>

        {/* Plan Upgrade Warning if on Starter */}
        {!canUseGed && (
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={22} color="#D97706" />
              <div>
                <div style={{ fontWeight: '800', color: '#92400E', fontSize: '0.9rem' }}>
                  Coffre-fort GED Limité &bull; Formule {planName || 'Starter'}
                </div>
                <div style={{ color: '#B45309', fontSize: '0.8125rem', marginTop: '2px' }}>
                  Le téléversement de documents externes et le stockage illimité sont inclus dans les forfaits <strong>Pro / Sérénité</strong> et <strong>Expert / Agence</strong>.
                </div>
              </div>
            </div>

            <Link
              href="/subscription"
              style={{
                backgroundColor: '#013E37',
                color: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} /> Débloquer le Coffre-fort
            </Link>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#15803D',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: '#15803D', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* DOSSIERS MÉTIERS TABS (FOLDER CATEGORIES) */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Tous */}
          <div
            onClick={() => setSelectedFolder('ALL')}
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: selectedFolder === 'ALL' ? '#013E37' : '#FFFFFF',
              color: selectedFolder === 'ALL' ? '#FFFFFF' : '#0F172A',
              border: `1px solid ${selectedFolder === 'ALL' ? '#013E37' : '#E2E8F0'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: selectedFolder === 'ALL' ? '0 2px 8px rgba(1, 62, 55, 0.2)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FolderKanban size={20} style={{ color: selectedFolder === 'ALL' ? '#34D399' : '#013E37' }} />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: selectedFolder === 'ALL' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: selectedFolder === 'ALL' ? '#FFFFFF' : '#64748B'
              }}>
                {documents.length}
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: '800', marginTop: '10px' }}>Tous les Fichiers</div>
            <div style={{ fontSize: '0.6875rem', color: selectedFolder === 'ALL' ? '#D1FAE5' : '#64748B', marginTop: '2px' }}>
              {formatBytes(totalStorageBytes)} archivés
            </div>
          </div>

          {/* Folders */}
          {Object.entries(folderDefinitions).map(([key, def]) => {
            const isSelected = selectedFolder === key;
            const count = folderCounts[key] || 0;
            const IconComponent = def.icon;

            return (
              <div
                key={key}
                onClick={() => setSelectedFolder(key)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? '#013E37' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#0F172A',
                  border: `1px solid ${isSelected ? '#013E37' : '#E2E8F0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(1, 62, 55, 0.2)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IconComponent size={20} style={{ color: isSelected ? '#34D399' : def.color }} />
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#64748B'
                  }}>
                    {count}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '800', marginTop: '10px' }}>{def.label}</div>
                <div style={{ fontSize: '0.6875rem', color: isSelected ? '#D1FAE5' : '#64748B', marginTop: '2px' }}>
                  {count} pièce(s)
                </div>
              </div>
            );
          })}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* FILTERS & SEARCH TOOLBAR */}
        {/* ----------------------------------------------------------------- */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '8px 14px',
            minWidth: '260px',
            flex: '1 1 260px'
          }}>
            <Search size={16} style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Rechercher par nom de fichier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.8125rem',
                color: '#0F172A',
                width: '100%'
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Selectors and View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>

            {/* Mime filter */}
            <select
              value={mimeTypeFilter}
              onChange={(e) => setMimeTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">Tous les formats</option>
              <option value="pdf">Documents PDF (.pdf)</option>
              <option value="image">Images & Photos (.png, .jpg)</option>
              <option value="doc">Bureautique (.docx, .doc)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#F8FAFC',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <option value="date_desc">Plus récents d'abord</option>
              <option value="date_asc">Plus anciens d'abord</option>
              <option value="size_desc">Taille décroissante</option>
              <option value="name_asc">Ordre alphabétique (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '2px'
            }}>
              <button
                onClick={() => setViewMode('list')}
                title="Affichage Liste"
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: viewMode === 'list' ? '#013E37' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Affichage Grille"
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: viewMode === 'grid' ? '#013E37' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* DOCUMENTS LIST VIEW */}
        {/* ----------------------------------------------------------------- */}
        {viewMode === 'list' ? (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                Inventaire des Pièces Archivées ({filteredDocuments.length})
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Stockage scellé conforme OHADA
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '780px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Pièce / Document</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Dossier Métier</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Taille</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Date d'Archivage</th>
                    <th style={{ padding: '12px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <FolderKanban size={32} style={{ color: '#CBD5E1' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '700' }}>Aucun document ne correspond à vos critères.</span>
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Déposez un nouveau document ou réinitialisez les filtres.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const folderInfo = folderDefinitions[doc.entityType] || folderDefinitions.general;
                      const isImage = doc.mimeType?.includes('image');
                      const isPdf = doc.mimeType?.includes('pdf');

                      return (
                        <tr
                          key={doc.id}
                          style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {/* File Name */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                backgroundColor: '#F1F5F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {getFileIcon(doc.mimeType)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                                  {doc.name}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>
                                  {doc.mimeType || 'Fichier numérisé'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dossier */}
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.6875rem',
                              fontWeight: '700',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: folderInfo.color
                            }}>
                              <folderInfo.icon size={12} />
                              {folderInfo.label}
                            </span>
                          </td>

                          {/* File Size */}
                          <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: '#64748B', fontWeight: '600' }}>
                            {formatBytes(doc.fileSize)}
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 20px', fontSize: '0.8125rem', color: '#64748B' }}>
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              
                              {/* Preview if image or PDF */}
                              {(isImage || isPdf) && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(doc)}
                                  title="Aperçu rapide"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    backgroundColor: '#FFFFFF',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                  }}
                                >
                                  <Eye size={13} /> Aperçu
                                </button>
                              )}

                              {/* Download link */}
                              <a
                                href={getFullFileUrl(doc.fileUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Télécharger le fichier"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: '1px solid #CBD5E1',
                                  backgroundColor: '#F8FAFC',
                                  color: '#013E37',
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: '700',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Download size={13} /> Télécharger
                              </a>

                              {/* Copy Link */}
                              <button
                                type="button"
                                onClick={() => copyFileUrl(doc.fileUrl, doc.id)}
                                title="Copier le lien d'accès"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0',
                                  backgroundColor: '#FFFFFF',
                                  color: copiedId === doc.id ? '#059669' : '#64748B',
                                  cursor: 'pointer'
                                }}
                              >
                                {copiedId === doc.id ? <Check size={13} /> : <Copy size={13} />}
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => setDeleteTargetDoc(doc)}
                                title="Supprimer du coffre-fort"
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #FECACA',
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------------- */
          /* DOCUMENTS GRID VIEW */
          /* ----------------------------------------------------------------- */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            {filteredDocuments.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: '#64748B', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <FolderKanban size={36} style={{ color: '#CBD5E1', margin: '0 auto 10px' }} />
                <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#0F172A' }}>Aucun document trouvé</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>Modifiez vos critères de recherche ou déposez une pièce.</div>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const folderInfo = folderDefinitions[doc.entityType] || folderDefinitions.general;
                const isImage = doc.mimeType?.includes('image');
                const isPdf = doc.mimeType?.includes('pdf');

                return (
                  <div
                    key={doc.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
                  >
                    <div>
                      {/* Card Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {getFileIcon(doc.mimeType, 22)}
                        </div>

                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          color: folderInfo.color
                        }}>
                          {folderInfo.label}
                        </span>
                      </div>

                      {/* Name & Size */}
                      <div style={{ marginTop: '14px' }}>
                        <h4 style={{
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          color: '#0F172A',
                          margin: 0,
                          wordBreak: 'break-word',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {doc.name}
                        </h4>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>
                          {formatBytes(doc.fileSize)} &bull; {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #F1F5F9'
                    }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(isImage || isPdf) && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#475569',
                              cursor: 'pointer'
                            }}
                            title="Aperçu"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyFileUrl(doc.fileUrl, doc.id)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            color: copiedId === doc.id ? '#059669' : '#64748B',
                            cursor: 'pointer'
                          }}
                          title="Copier le lien"
                        >
                          {copiedId === doc.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={getFullFileUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#F8FAFC',
                            color: '#013E37',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Download size={13} /> Télécharger
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetDoc(doc)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: '1px solid #FECACA',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            cursor: 'pointer'
                          }}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: TÉLÉVERSEMENT DANS LE COFFRE-FORT NUMÉRIQUE */}
      {/* ----------------------------------------------------------------- */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Déposer un Document au Coffre-fort
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Fichiers acceptés : PDF, Images (PNG, JPG), Word (DOCX) &bull; Max 10 Mo
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Drag & drop upload area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragActive ? '#013E37' : '#CBD5E1'}`,
                  borderRadius: '12px',
                  backgroundColor: dragActive ? '#F0FDF4' : '#F8FAFC',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => document.getElementById('vaultFileInput')?.click()}
              >
                <input
                  id="vaultFileInput"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  accept="image/*,application/pdf,.doc,.docx"
                />

                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  color: '#013E37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>
                  <Upload size={22} />
                </div>

                {uploadFile ? (
                  <div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#013E37' }}>
                      {uploadFile.name}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                      {formatBytes(uploadFile.size)} &bull; Prêt pour chiffrement
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#0F172A' }}>
                      Glissez-déposez votre document ici ou cliquez pour parcourir
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                      Documents scellés automatiquement par horodatage
                    </div>
                  </div>
                )}
              </div>

              {/* Dossier de classement */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Dossier de Classement (Catégorie) *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="general">Documents Généraux / Divers</option>
                  <option value="contract">Baux & Contrats de Location</option>
                  <option value="property">Titres & Actes Fonciers</option>
                  <option value="tenant_profile">Dossiers & Pièces Locataires</option>
                  <option value="invoice">Factures & Quittances de Loyer</option>
                  <option value="incident">Travaux, Devis & Sinistres</option>
                </select>
              </div>

              {/* Rattachement à un bien (Optionnel) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Rattacher à un Bien Immobilier (Facultatif)
                </label>
                <select
                  value={associatedPropertyId}
                  onChange={(e) => setAssociatedPropertyId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="">Aucun bien particulier / Général</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              {/* Rattachement à un locataire (Optionnel) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Rattacher à un Locataire (Facultatif)
                </label>
                <select
                  value={associatedTenantId}
                  onChange={(e) => setAssociatedTenantId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="">Aucun locataire particulier</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.phone})</option>
                  ))}
                </select>
              </div>

              {/* Encryption badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                <ShieldCheck size={16} />
                <span>Le fichier sera chiffré avant écriture sur le disque de stockage sécurisé.</span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: uploading || !uploadFile ? '#94A3B8' : '#013E37',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: uploading || !uploadFile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(1, 62, 55, 0.2)'
                  }}
                >
                  {uploading ? 'Chiffrement & Dépôt...' : 'Déposer au Coffre-fort'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: APERÇU RAPIDE DE DOCUMENT (LIGHTBOX MODAL) */}
      {/* ----------------------------------------------------------------- */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '850px',
            height: '85vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {getFileIcon(previewDoc.mimeType, 22)}
                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: '800', color: '#0F172A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {previewDoc.name}
                  </h4>
                  <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                    {formatBytes(previewDoc.fileSize)} &bull; Archivé le {new Date(previewDoc.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={getFullFileUrl(previewDoc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#013E37',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} /> Télécharger
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div style={{ flex: 1, backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {previewDoc.mimeType?.includes('image') ? (
                <img
                  src={getFullFileUrl(previewDoc.fileUrl)}
                  alt={previewDoc.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : previewDoc.mimeType?.includes('pdf') ? (
                <iframe
                  src={getFullFileUrl(previewDoc.fileUrl)}
                  title={previewDoc.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
                  <FileText size={48} style={{ margin: '0 auto 12px', color: '#64748B' }} />
                  <p style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: '700' }}>
                    L'aperçu n'est pas disponible pour ce type de document.
                  </p>
                  <a
                    href={getFullFileUrl(previewDoc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#34D399',
                      fontWeight: '700',
                      textDecoration: 'none',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <Download size={14} /> Télécharger pour consulter
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: CONFIRMATION DE SUPPRESSION DÉFINITIVE */}
      {/* ----------------------------------------------------------------- */}
      {deleteTargetDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={18} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                Supprimer définitivement ?
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Êtes-vous certain de vouloir effacer <strong>"{deleteTargetDoc.name}"</strong> ({formatBytes(deleteTargetDoc.fileSize)}) du coffre-fort numérique ? Cette action détruira définitivement le fichier physique et sa preuve d'archivage.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteTargetDoc(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontWeight: '600',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Conserver la pièce
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
