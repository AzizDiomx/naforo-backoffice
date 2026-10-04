'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />;
      case 'warning':
        return <AlertTriangle size={28} style={{ color: 'var(--warning)' }} />;
      case 'success':
        return <CheckCircle2 size={28} style={{ color: 'var(--success)' }} />;
      default:
        return <Info size={28} style={{ color: 'var(--primary)' }} />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return 'var(--danger-light)';
      case 'warning':
        return 'var(--warning-light)';
      case 'success':
        return 'var(--success-light)';
      default:
        return 'rgba(1, 62, 55, 0.1)';
    }
  };

  const getConfirmBtnClass = () => {
    switch (type) {
      case 'danger':
        return 'btn btn-danger';
      case 'warning':
        return 'btn btn-primary';
      case 'success':
        return 'btn btn-primary';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(2, 6, 23, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        animation: 'modalSlideIn 0.2s ease-out',
      }}>
        {/* Header with icon */}
        <div style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          backgroundColor: getHeaderBg(),
          position: 'relative'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {getIcon()}
          </div>

          <div style={{ flex: 1, paddingRight: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text)' }}>
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'var(--background)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{ padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={getConfirmBtnClass()}
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '8px 20px', fontSize: '0.875rem', fontWeight: '600' }}
          >
            {loading ? 'Traitement en cours...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

