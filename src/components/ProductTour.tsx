'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  Building2,
  FileText,
  Users2,
  CreditCard,
  Bell,
  User,
  LayoutDashboard,
} from 'lucide-react';

export interface TourStep {
  id: string;
  target?: string; // CSS selector or data-tour attribute
  title: string;
  category: string;
  icon: any;
  content: string;
  tip?: string;
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    category: 'Bienvenue',
    icon: Sparkles,
    title: 'Bienvenue sur Naforo !',
    content:
      'Naforo est votre plateforme tout-en-un pour gérer votre patrimoine immobilier, automatiser la collecte des loyers, signer des baux électroniques et sécuriser vos encaissements.',
    tip: 'Cette visite guidée rapide (1 min) vous présente les outils clés pour bien démarrer.',
    placement: 'center',
  },
  {
    id: 'sidebar-nav',
    target: '[data-tour="sidebar-nav"]',
    category: 'Navigation',
    icon: LayoutDashboard,
    title: 'Votre barre de navigation',
    content:
      'Retrouvez ici tous vos modules organisés par domaine : Gestion Locative (Biens, Locataires, Baux), Finances (Factures, Paiements, Bilans), et Services Pro (GED, Messagerie sécurisée).',
    tip: 'Le menu s\'adapte automatiquement aux fonctionnalités activées dans votre formule d\'abonnement.',
    placement: 'right',
  },
  {
    id: 'properties',
    target: '[data-tour="menu-properties"]',
    category: 'Patrimoine',
    icon: Building2,
    title: 'Biens Immobiliers & Lots',
    content:
      'Ajoutez vos immeubles, villas, appartements et commerces. Vous pouvez subdiviser un immeuble en plusieurs lots indépendants avec leurs propres loyers et surfaces.',
    tip: 'Commencez par ajouter votre premier bien pour pouvoir y rattacher vos baux et locataires.',
    placement: 'right',
  },
  {
    id: 'tenants',
    target: '[data-tour="menu-tenants"]',
    category: 'Locataires',
    icon: Users2,
    title: 'Dossiers Locataires & CNI',
    content:
      'Conservez les coordonnées de vos locataires, téléversez leurs pièces d\'identité (CNI ou Passeport) archivées dans le coffre-fort numérique, et suivez leur score de ponctualité de paiement.',
    tip: 'Chaque locataire dispose aussi de son propre espace web pour consulter ses quittances.',
    placement: 'right',
  },
  {
    id: 'contracts',
    target: '[data-tour="menu-contracts"]',
    category: 'Contrats',
    icon: FileText,
    title: 'Contrats de Bail & Signature Électronique',
    content:
      'Générez des contrats de bail complets conformes à la réglementation. Faites-les signer électroniquement à distance par code OTP sécurisé (Naforo Secure Sign), avec possibilité de validation directe pour l\'administrateur.',
    tip: 'Les échéances et avis d\'échéance seront générés automatiquement selon la date convenue.',
    placement: 'right',
  },
  {
    id: 'payments',
    target: '[data-tour="menu-payments"]',
    category: 'Finances',
    icon: CreditCard,
    title: 'Paiements & Quittances avec QR Code',
    content:
      'Validez les règlements déclarés par vos locataires (Wave, Orange Money, virement bancaire, espèces). Dès validation, une quittance officielle infalsifiable avec QR Code de certification est envoyée automatiquement.',
    tip: 'L\'historique comptable et les exports Excel sont accessibles en un clic dans la section Comptabilité.',
    placement: 'right',
  },
  {
    id: 'notifications',
    target: '[data-tour="notification-bell"]',
    category: 'Alertes',
    icon: Bell,
    title: 'Notifications en temps réel',
    content:
      'Soyez prévenu instantanément dès qu\'un locataire déclare un paiement, signale un incident technique ou valide un contrat de bail.',
    tip: 'La pastille rouge vous signale immédiatement les actions en attente de votre validation.',
    placement: 'bottom',
  },
  {
    id: 'profile',
    target: '[data-tour="header-profile"]',
    category: 'Espace & Compte',
    icon: User,
    title: 'Votre profil, Forfait & Aide',
    content:
      'Accédez à vos paramètres, suivez vos quotas d\'utilisation (nombre de biens et lots restants) et relancez cette visite guidée à tout moment depuis ce menu.',
    tip: 'Félicitations, vous avez fait le tour ! Cliquez sur « Commencer » pour piloter votre patrimoine.',
    placement: 'bottom',
  },
];

export default function ProductTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // Vérifier au premier chargement si la visite guidée doit être suggérée
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasSeenTour = localStorage.getItem('naforo_tour_completed');
    if (!hasSeenTour) {
      // Petite temporisation pour laisser le DOM et les polices se charger
      const timer = setTimeout(() => {
        setShowWelcomePrompt(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Écouter l'événement global pour relancer la visite guidée n'importe quand
  useEffect(() => {
    const handleStartTour = () => {
      setShowWelcomePrompt(false);
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('start-product-tour', handleStartTour);
    return () => window.removeEventListener('start-product-tour', handleStartTour);
  }, []);

  const startTour = () => {
    setShowWelcomePrompt(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  const closeTour = (markAsCompleted = true) => {
    setIsOpen(false);
    setShowWelcomePrompt(false);
    if (markAsCompleted) {
      localStorage.setItem('naforo_tour_completed', 'true');
    }
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      closeTour(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Mettre à jour la boîte englobante de l'élément cible et la position du popover
  const updatePosition = useCallback(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    if (!step.target || step.placement === 'center') {
      setTargetRect(null);
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '460px',
        width: '90vw',
      });
      return;
    }

    const element = document.querySelector(step.target);
    if (!element) {
      // Si l'élément n'est pas trouvé (ex: sidebar masquée sur mobile), centrer avec élégance
      setTargetRect(null);
      setPopoverStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '420px',
        width: '90vw',
      });
      return;
    }

    // Scroll doux vers l'élément si nécessaire
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = element.getBoundingClientRect();
    setTargetRect(rect);

    const popoverWidth = 380;
    const margin = 16;
    const placement = step.placement || 'bottom';

    let top = 0;
    let left = 0;

    if (placement === 'right') {
      top = rect.top + rect.height / 2 - 120;
      left = rect.right + margin;
      // Empêcher de déborder à droite
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2 - 120;
      left = rect.left - popoverWidth - margin;
      if (left < margin) left = margin;
    } else if (placement === 'bottom') {
      top = rect.bottom + margin;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      if (left < margin) left = margin;
    } else {
      // top
      top = rect.top - 240 - margin;
      left = rect.left + rect.width / 2 - popoverWidth / 2;
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - margin;
      }
      if (left < margin) left = margin;
    }

    // Garder le popover dans l'écran verticalement
    if (top < margin) top = margin;
    if (top + 280 > window.innerHeight) {
      top = Math.max(margin, window.innerHeight - 300);
    }

    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${popoverWidth}px`,
      width: '90vw',
      transform: 'none',
    });
  }, [isOpen, currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  // Raccourcis clavier (Flèches & Échap)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTour(true);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const StepIcon = step?.icon || Sparkles;

  return (
    <>
      {/* 1. Modale d'accueil (Proposition de visite guidée à la première connexion) */}
      {showWelcomePrompt && !isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            backgroundColor: 'rgba(1, 20, 18, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '480px',
              width: '100%',
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(1, 62, 55, 0.35)',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              position: 'relative',
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => closeTour(true)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
              title="Passer"
            >
              <X size={18} />
            </button>

            {/* Illustration / Badge Naforo */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#013E37',
                color: '#FFEFB3',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 8px 20px rgba(1, 62, 55, 0.3)',
              }}
            >
              <Compass size={32} />
            </div>

            <h3
              style={{
                fontSize: '1.4rem',
                fontWeight: '800',
                color: '#013E37',
                letterSpacing: '-0.02em',
                marginBottom: '10px',
              }}
            >
              Bienvenue sur Naforo !
            </h3>

            <p
              style={{
                fontSize: '0.925rem',
                color: '#475569',
                lineHeight: 1.55,
                marginBottom: '24px',
              }}
            >
              Votre espace de gestion locative est prêt. Souhaitez-vous suivre une courte visite guidée interactive pour découvrir les outils essentiels en 1 minute ?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={startTour}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#013E37',
                  color: '#FFEFB3',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '13px 20px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(1, 62, 55, 0.25)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#012b26')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#013E37')}
              >
                <Sparkles size={18} />
                <span>Démarrer la visite guidée</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => closeTour(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                Découvrir par moi-même
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Visite Guidée Active (Spotlight + Popover Tooltip) */}
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'auto' }}>
          {/* Spotlight d'éclairage autour de l'élément cible */}
          {targetRect ? (
            <div
              style={{
                position: 'fixed',
                top: `${targetRect.top - 6}px`,
                left: `${targetRect.left - 6}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 12}px`,
                borderRadius: '12px',
                boxShadow:
                  '0 0 0 9999px rgba(1, 20, 18, 0.72), 0 0 20px rgba(255, 239, 179, 0.55)',
                border: '2px solid #FFEFB3',
                pointerEvents: 'none',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 99999,
              }}
            />
          ) : (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(1, 20, 18, 0.72)',
                backdropFilter: 'blur(3px)',
                zIndex: 99999,
              }}
            />
          )}

          {/* Carte Popover explicative */}
          <div
            ref={popoverRef}
            style={{
              ...popoverStyle,
              zIndex: 100000,
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '22px 24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 239, 179, 0.4)',
              animation: 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* En-tête de l'étape */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(1, 62, 55, 0.08)',
                    color: '#013E37',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <StepIcon size={13} style={{ color: '#013E37' }} />
                  {step.category}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    fontWeight: '600',
                  }}
                >
                  Étape {currentStep + 1} / {TOUR_STEPS.length}
                </span>
              </div>

              <button
                onClick={() => closeTour(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                }}
                title="Quitter la visite (Échap)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Titre & Contenu */}
            <h4
              style={{
                fontSize: '1.125rem',
                fontWeight: '800',
                color: '#013E37',
                marginBottom: '8px',
                letterSpacing: '-0.015em',
              }}
            >
              {step.title}
            </h4>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#334155',
                lineHeight: 1.5,
                marginBottom: step.tip ? '12px' : '18px',
              }}
            >
              {step.content}
            </p>

            {/* Astuce optionnelle */}
            {step.tip && (
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderLeft: '3px solid #013E37',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#475569',
                  marginBottom: '18px',
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: '#013E37' }}>💡 Astuce : </strong>
                {step.tip}
              </div>
            )}

            {/* Barre de navigation / Progression */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid #f1f5f9',
                gap: '12px',
              }}
            >
              {/* Indicateurs de progression (Points) */}
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {TOUR_STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => setCurrentStep(idx)}
                    style={{
                      width: idx === currentStep ? '16px' : '6px',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: idx === currentStep ? '#013E37' : '#cbd5e1',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    title={`Aller à l'étape ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Boutons Suivant / Précédent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontSize: '0.8125rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Précédent</span>
                  </button>
                )}

                <button
                  onClick={nextStep}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#013E37',
                    color: '#FFEFB3',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(1, 62, 55, 0.2)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#012b26')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#013E37')}
                >
                  <span>{isLastStep ? 'Commencer 🎉' : 'Suivant'}</span>
                  {!isLastStep && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles d'animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
