'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { handleFormError, showFormSuccess } from '@/lib/form-errors';
import Pagination from '@/components/Pagination';
import Link from 'next/link';
import {
  ClipboardCheck,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  GitCompare,
  CheckCircle2,
  Clock,
  Building,
  User,
  ArrowRight,
  FileCheck,
  FileSpreadsheet,
  AlertTriangle,
  X
} from 'lucide-react';

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Comparison Modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search: search.trim(),
        type: typeFilter,
        status: statusFilter,
      }).toString();

      const res = await api.get(`/inspections?${query}`);
      const items = Array.isArray(res) ? res : (res as any)?.data || [];
      const meta = (res as any)?.meta || {};
      setInspections(items);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || items.length);
    } catch (err) {
      handleFormError(err, 'Erreur lors du chargement des états des lieux.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Confirmez-vous la suppression définitive de l'état des lieux ${number} ?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await api.delete(`/inspections/${id}`);
      showFormSuccess('État des lieux supprimé avec succès.');
      loadData();
    } catch (err) {
      handleFormError(err, 'Impossible de supprimer cet état des lieux.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCompareModal = async () => {
    setShowCompareModal(true);
    setComparisonResult(null);
    try {
      const contractsRes = await api.get('/contracts?limit=100');
      const list = Array.isArray(contractsRes) ? contractsRes : (contractsRes as any)?.data || [];
      setContracts(list);
    } catch (_) {}
  };

  const handleRunComparison = async () => {
    if (!selectedContractId) {
      showFormSuccess('Veuillez sélectionner un contrat de bail.');
      return;
    }
    setComparing(true);
    try {
      const res = await api.get(`/inspections/compare/${selectedContractId}`);
      setComparisonResult(res);
    } catch (err) {
      handleFormError(err, 'Impossible de générer le comparatif (assurez-vous qu’un état des lieux d’entrée existe).');
    } finally {
      setComparing(false);
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
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'signed':
        return (
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <CheckCircle2 size={12} /> Signé (Certifié)
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-warning" style={{ gap: '4px' }}>
            <Clock size={12} /> En attente signature
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ gap: '4px' }}>
            Brouillon
          </span>
        );
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardCheck size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  États des Lieux Numériques (EDL)
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Constats d’entrée et de sortie, relevés CIE/SODECI, photos horodatées et comparatif de caution
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={openCompareModal}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GitCompare size={16} /> Comparer Entrée / Sortie
            </button>
            <Link
              href="/inspections/create"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Nouvel État des Lieux
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher par N° constat, bien, locataire..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '38px', height: '42px', borderRadius: '8px' }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="form-control"
              style={{ width: '180px', height: '42px', borderRadius: '8px' }}
            >
              <option value="">Tous types</option>
              <option value="entry">Entrée des lieux</option>
              <option value="exit">Sortie des lieux</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-control"
              style={{ width: '190px', height: '42px', borderRadius: '8px' }}
            >
              <option value="">Tous statuts</option>
              <option value="draft">Brouillon</option>
              <option value="completed">Complété</option>
              <option value="signed">Signé & Certifié</option>
            </select>

            <button type="submit" className="btn btn-secondary" style={{ height: '42px', padding: '0 18px', borderRadius: '8px' }}>
              Filtrer
            </button>
          </form>
        </div>

        {/* Inspections Table */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>N° Constat & Type</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Bien Immobilier</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Locataire</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Constat</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Statut</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Chargement des états des lieux...
                    </td>
                  </tr>
                ) : inspections.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Aucun état des lieux enregistré pour le moment.
                      </div>
                      <Link href="/inspections/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={15} /> Réaliser un premier état des lieux
                      </Link>
                    </td>
                  </tr>
                ) : (
                  inspections.map((edl) => {
                    const isEntry = edl.type === 'entry';
                    return (
                      <tr key={edl.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {edl.inspectionNumber}
                          </div>
                          <span
                            className="badge"
                            style={{
                              marginTop: '4px',
                              backgroundColor: isEntry ? '#ecfdf5' : '#fef2f2',
                              color: isEntry ? '#059669' : '#dc2626',
                              borderColor: isEntry ? '#a7f3d0' : '#fecaca',
                            }}
                          >
                            {isEntry ? '🟢 Constat d’Entrée' : '🔴 Constat de Sortie'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} color="var(--text-secondary)" />
                            {edl.property?.name || 'Bien non renseigné'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {edl.property?.address || '-'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={14} color="var(--text-secondary)" />
                            {edl.tenantProfile ? `${edl.tenantProfile.firstName} ${edl.tenantProfile.lastName}` : 'Non assigné'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {edl.tenantProfile?.phone || '-'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {formatDate(edl.inspectionDate || edl.createdAt)}
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          {renderStatusBadge(edl.status)}
                        </td>

                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              href={`/inspections/${edl.id}`}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                              title="Consulter et signer"
                            >
                              <Eye size={13} /> Consulter
                            </Link>

                            {edl.pdfUrl && (
                              <a
                                href={api.getFileUrl(edl.pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                                title="Télécharger le constat officiel PDF"
                              >
                                <Download size={13} /> PDF
                              </a>
                            )}

                            <button
                              onClick={() => handleDelete(edl.id, edl.inspectionNumber)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#dc2626' }}
                              title="Supprimer"
                              disabled={actionLoading}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          )}
        </div>

        {/* Modal Comparatif Entrée vs Sortie */}
        {showCompareModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
                maxWidth: '750px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowCompareModal(false)}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <GitCompare size={24} color="#0284c7" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  Comparatif Automatique Entrée vs Sortie
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Sélectionnez le contrat de bail pour comparer l’état initial du logement avec l’état de sortie et calculer les retenues sur caution.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="form-control"
                  style={{ flex: 1, height: '42px', borderRadius: '8px' }}
                >
                  <option value="">Sélectionner un contrat de bail...</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.property?.name} — {c.tenantProfile ? `${c.tenantProfile.firstName} ${c.tenantProfile.lastName}` : 'Locataire'}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleRunComparison}
                  disabled={comparing || !selectedContractId}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', padding: '0 18px', borderRadius: '8px' }}
                >
                  <GitCompare size={15} />
                  {comparing ? 'Analyse...' : 'Comparer'}
                </button>
              </div>

              {comparisonResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="card" style={{ padding: '14px', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>
                        Constat d’Entrée
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                        {comparisonResult.entryInspection?.inspectionNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                        Date : {formatDate(comparisonResult.entryInspection?.inspectionDate)}
                      </div>
                    </div>

                    <div className="card" style={{ padding: '14px', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>
                        Constat de Sortie
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '4px' }}>
                        {comparisonResult.exitInspection?.inspectionNumber || 'Non encore réalisé'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>
                        Date : {formatDate(comparisonResult.exitInspection?.inspectionDate)}
                      </div>
                    </div>
                  </div>

                  {/* Summary Deductions */}
                  <div
                    className="card"
                    style={{
                      padding: '16px',
                      backgroundColor: comparisonResult.degradationCount > 0 ? '#fffbeb' : '#f8fafc',
                      borderColor: comparisonResult.degradationCount > 0 ? '#fde68a' : 'var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Dégradations constatées : {comparisonResult.degradationCount} élément(s)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Estimation des réparations locatives imputables
                        </div>
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: comparisonResult.degradationCount > 0 ? '#d97706' : '#166534' }}>
                        {formatFcfa(comparisonResult.totalEstimatedDeduction)}
                      </div>
                    </div>
                  </div>

                  {/* Degraded elements table */}
                  {comparisonResult.comparisonDetails?.length > 0 && (
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Pièce & Élément</th>
                            <th style={{ padding: '8px' }}>État Entrée</th>
                            <th style={{ padding: '8px' }}>État Sortie</th>
                            <th style={{ padding: '8px' }}>Observation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparisonResult.comparisonDetails.map((det: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>
                                {det.room} — {det.element}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <span className="badge badge-success">{det.entryCondition}</span>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <span className={`badge ${det.isDegraded ? 'badge-danger' : 'badge-neutral'}`}>
                                  {det.exitCondition}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                                {det.comment || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
