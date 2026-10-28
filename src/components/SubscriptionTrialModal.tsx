'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  X,
  ChevronRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Lock,
  Headphones
} from 'lucide-react';

interface SubscriptionTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: any;
}

export default function SubscriptionTrialModal({
  isOpen,
  onClose,
  subscription,
}: SubscriptionTrialModalProps) {
  const [showContactDetails, setShowContactDetails] = useState(false);

  if (!isOpen) return null;

  const support = subscription?.supportContact || {
    email: 'contact@naforo.company',
    supportEmail: 'support@naforo.company',
    phone: '+225 07 00 00 00 00',
    whatsapp: '+225 07 00 00 00 00',
    whatsappUrl: 'https://wa.me/2250700000000',
  };

  const whatsappPrefilledMessage = encodeURIComponent(
    `Bonjour l'équipe Naforo,\n\nMa période d'essai de 60 jours pour l'offre Starter est arrivée à son terme sur mon espace de gestion. Je souhaite être guidé(e) pour choisir et souscrire à une formule d'abonnement adaptée à mon patrimoine.`
  );

  const whatsappDirectUrl = `https://wa.me/${support.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappPrefilledMessage}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(1, 30, 26, 0.72)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-modal-title"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(1, 62, 55, 0.35), 0 0 0 1px rgba(1, 62, 55, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Subtle decorative top border */}
        <div
          style={{
            height: '6px',
            background: 'linear-gradient(90deg, #D97706 0%, #013E37 50%, #22C55E 100%)',
            width: '100%',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Body */}
        <div style={{ padding: '28px 24px 24px 24px' }}>
          {/* Header Badge & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FCD34D',
                }}
              >
                Offre Découverte Starter · 60 jours
              </span>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                Période de test achevée
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2
            id="trial-modal-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.3,
              margin: '0 0 8px 0',
            }}
          >
            Votre période d'essai gratuit est terminée
          </h2>

          <p
            style={{
              fontSize: '0.9125rem',
              color: '#475569',
              lineHeight: 1.55,
              margin: '0 0 20px 0',
            }}
          >
            Vos <strong>60 jours d’évaluation</strong> de la formule Starter sont arrivés à échéance.
            Votre espace passe temporairement en <strong>mode consultation sécurisée</strong>.
          </p>

          {/* Guarantees Box */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <ShieldCheck size={18} style={{ color: '#16A34A', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.45 }}>
                <strong style={{ color: '#0f172a' }}>Vos données sont 100% préservées :</strong> Vos appartements, contrats, historiques de loyers et quittances restent sauvegardés et consultables en toute sécurité.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Zap size={18} style={{ color: '#013E37', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.45 }}>
                <strong style={{ color: '#0f172a' }}>Passez à la formule supérieure :</strong> Débloquez l’édition illimitée de quittances, les relances automatiques et les paiements Wave & Mobile Money sans interruption.
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Primary Action Button */}
            <Link
              href="/subscription"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 20px',
                borderRadius: '12px',
                backgroundColor: '#FFEFB3',
                color: '#013E37',
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(1, 62, 55, 0.15)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFE480';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFEFB3';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Zap size={18} style={{ color: '#013E37' }} />
              <span>Découvrir les offres &amp; S'abonner</span>
              <ChevronRight size={18} />
            </Link>

            {/* Contact Drawer Toggle */}
            <button
              onClick={() => setShowContactDetails(!showContactDetails)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#013E37';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <Headphones size={16} style={{ color: '#013E37' }} />
              <span>{showContactDetails ? 'Masquer les contacts' : 'Contacter les Administrateurs'}</span>
            </button>

            {/* Contact Details Expandable Box */}
            {showContactDetails && (
              <div
                style={{
                  marginTop: '4px',
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animation: 'fadeIn 0.2s ease-out',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                  Équipe Support &amp; Relations Administrateurs Naforo :
                </div>

                {/* WhatsApp */}
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    color: '#15803d',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} />
                    <span>Échanger sur WhatsApp ({support.whatsapp})</span>
                  </div>
                  <ExternalLink size={14} />
                </a>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Phone */}
                  <a
                    href={`tel:${support.phone.replace(/[^0-9+]/g, '')}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <Phone size={14} style={{ color: '#013E37' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {support.phone}
                    </span>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${support.email}?subject=Demande%20de%20renouvellement%20abonnement%20Starter`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      textDecoration: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <Mail size={14} style={{ color: '#013E37' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {support.email}
                    </span>
                  </a>
                </div>
              </div>
            )}

            {/* Read-only Dismiss Action */}
            <button
              onClick={onClose}
              style={{
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontWeight: 500,
                textDecoration: 'underline',
              }}
            >
              <Eye size={14} />
              <span>Continuer en mode consultation seule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
