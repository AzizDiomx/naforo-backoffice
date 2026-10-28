'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSubscriptionFeature } from '@/lib/useSubscriptionFeature';
import SubscriptionTrialModal from './SubscriptionTrialModal';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const { subscription } = useSubscriptionFeature();

  useEffect(() => {
    setMounted(true);
    // Vérification de l'authentification client-side
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
    }

    const handleOpenModal = () => setShowTrialModal(true);
    window.addEventListener('show-starter-trial-modal', handleOpenModal);

    return () => {
      window.removeEventListener('show-starter-trial-modal', handleOpenModal);
    };
  }, []);

  // Détection automatique à l'arrivée si la période d'essai 60j est expirée (une fois par session)
  useEffect(() => {
    if (subscription?.isStarterTrialExpired) {
      const alreadyShown = sessionStorage.getItem('starter_trial_modal_shown');
      if (!alreadyShown) {
        setShowTrialModal(true);
        sessionStorage.setItem('starter_trial_modal_shown', 'true');
      }
    }
  }, [subscription?.isStarterTrialExpired]);

  if (!mounted) return null;

  const isStarterExpired = Boolean(subscription?.isStarterTrialExpired);
  const isStarterExpiringSoon =
    Boolean(subscription?.isStarter) &&
    !isStarterExpired &&
    subscription?.starterTrialDaysLeft !== null &&
    subscription?.starterTrialDaysLeft !== undefined &&
    subscription.starterTrialDaysLeft <= 7;

  return (
    <div className="app-container">
      {/* Modal d'alerte élégante fin d'essai Starter */}
      <SubscriptionTrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        subscription={subscription}
      />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header onMenuToggle={() => setSidebarOpen(true)} />

        {/* Bannière Alerte Top : Fin d'essai Starter */}
        {isStarterExpired && (
          <div
            style={{
              backgroundColor: '#FEF3C7',
              borderBottom: '1px solid #FCD34D',
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: '#D97706',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={16} />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#92400E' }}>
                <strong>Période d'essai Starter terminée :</strong> Vos 60 jours d'essai gratuit sont arrivés à échéance. Vos données sont préservées en mode consultation.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowTrialModal(true)}
                style={{
                  backgroundColor: '#013E37',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#012b26'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#013E37'; }}
              >
                <span>Souscrire ou Contacter</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Bannière Alerte Top : Compte à rebours Starter (<= 7 jours) */}
        {isStarterExpiringSoon && (
          <div
            style={{
              backgroundColor: '#F0FDF4',
              borderBottom: '1px solid #BBF7D0',
              padding: '8px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#16A34A', flexShrink: 0 }} />
              <div style={{ fontSize: '0.825rem', color: '#166534' }}>
                <strong>Offre Starter :</strong> Il vous reste <strong>{subscription.starterTrialDaysLeft} jour(s)</strong> d'évaluation gratuite avant la fin de l'essai.
              </div>
            </div>
            <Link
              href="/subscription"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #86EFAC',
                color: '#166534',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.775rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Choisir un forfait</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
}
