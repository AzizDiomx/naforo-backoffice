'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div style={{
      padding: '12px 20px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      backgroundColor: '#ffffff',
      fontSize: '0.8125rem',
      color: '#64748b'
    }}>
      {/* Total Items Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>
          Affichage de <strong>{startItem}</strong> à <strong>{endItem}</strong> sur <strong>{totalItems}</strong> élément{totalItems > 1 ? 's' : ''}
        </span>

        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Afficher</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage <= 1 ? '#f1f5f9' : '#ffffff',
            color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={15} style={{ marginRight: '2px' }} /> Précédent
        </button>

        <span style={{ padding: '0 8px', fontWeight: '600', color: '#0f172a' }}>
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            backgroundColor: currentPage >= totalPages ? '#f1f5f9' : '#ffffff',
            color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.78rem',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
        >
          Suivant <ChevronRight size={15} style={{ marginLeft: '2px' }} />
        </button>
      </div>
    </div>
  );
}
