'use client';

import { Menu, Bell, User, AlertCircle, ChevronDown, LogOut, Clock } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [userName, setUserName] = useState('Utilisateur');
  const [userRole, setUserRole] = useState('Collaborateur');
  const [userEmail, setUserEmail] = useState('');
  const [subAlert, setSubAlert] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Récupérer l'utilisateur courant
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(`${user.firstName} ${user.lastName}`);
        setUserRole(user.role.toUpperCase());
        setUserEmail(user.email);
      } catch {}
    }

    // Récupérer le statut d'abonnement pour la bannière d'alerte
    const fetchSubStatus = () => {
      api.get('/dashboard/owner')
        .then(res => {
          if (res.subscription) {
            setSubAlert(res.subscription.alert);
            setDaysLeft(res.subscription.daysLeft);
            setIsSuspended(!!res.subscription.isSuspended);
            setIsDeactivated(!!res.subscription.isDeactivated);
            setHasPendingPayment(!!res.subscription.hasPendingPayment);
          }
        })
        .catch(() => {});
    };

    fetchSubStatus();
    window.addEventListener('subscription-updated', fetchSubStatus);

    // Fermer le dropdown si clic à l'extérieur
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener('subscription-updated', fetchSubStatus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {} // Ignorer si le token est déjà expiré côté serveur
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* 1. Bannière ROUGE : Compte Suspendu (Mode Lecture Seule) */}
      {isSuspended && (
        <div style={{
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '12px 16px',
          fontSize: '0.85rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(220, 38, 38, 0.25)',
          borderBottom: '1px solid #b91c1c'
        }}>
          <AlertCircle size={18} />
          <span>
            <strong>Compte Suspendu (Mode Lecture Seule) :</strong> Votre abonnement a expiré. Toutes les modifications sont bloquées.
          </span>
          <Link 
            href="/subscription" 
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#dc2626', 
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.8rem',
              textDecoration: 'none',
              marginLeft: '4px'
            }}
          >
            Régulariser mon abonnement
          </Link>
        </div>
      )}

      {/* 2. Bannière BLEUE : Preuve de paiement soumise en attente de validation */}
      {hasPendingPayment && !isSuspended && (
        <div style={{
          backgroundColor: '#0284c7',
          color: '#ffffff',
          padding: '10px 16px',
          fontSize: '0.825rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Clock size={16} />
          <span>
            Votre preuve de paiement d'abonnement est en cours de validation par le Super Admin. Vos droits complets seront activés dès validation.
          </span>
          <Link 
            href="/subscription" 
            style={{ 
              color: '#ffffff', 
              textDecoration: 'underline', 
              fontWeight: 'bold',
              marginLeft: '6px'
            }}
          >
            Détails
          </Link>
        </div>
      )}

      {/* 3. Bannière ORANGE : Alerte échéance proche (J-5 à J0) */}
      {subAlert && !isSuspended && !hasPendingPayment && (
        <div style={{
          backgroundColor: '#ea580c',
          color: '#ffffff',
          padding: '10px 16px',
          fontSize: '0.825rem',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertCircle size={16} />
          <span>
            {daysLeft <= 0 
              ? "Votre abonnement expire aujourd'hui ! Pensez à renouveler dès maintenant pour éviter le passage en lecture seule." 
              : `Votre abonnement expire dans ${daysLeft} jour(s). Pensez à renouveler dès maintenant pour éviter l'interruption de vos accès.`
            }
          </span>
          <Link 
            href="/subscription" 
            style={{ 
              color: '#ffffff', 
              textDecoration: 'underline', 
              fontWeight: 'bold',
              marginLeft: '8px'
            }}
          >
            Renouveler mon forfait
          </Link>
        </div>
      )}

      {/* 2. Barre d'outils Header principale */}
      <div className="header">
        {/* Burger Button (Mobile Only) */}
        <button 
          onClick={onMenuToggle}
          className="menu-toggle"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Menu size={22} />
        </button>

        {/* Fil d'ariane / Titre (vide ou contextuel) */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '400', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Naforo</span>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: '500' }}>Backoffice Propriétaire</span>
        </div>

        {/* Profil & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Composant Notifications Temps Réel */}
          <NotificationBell />

          {/* Fiche Profil & Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="profile-btn" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginLeft: '8px',
                padding: '6px 12px 6px 6px', 
                cursor: 'pointer', 
                borderRadius: '30px',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                backgroundColor: showDropdown ? '#f8fafc' : 'transparent',
                borderColor: showDropdown ? '#e2e8f0' : 'transparent',
                outline: 'none'
              }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), #012b26)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                fontWeight: '700',
                fontSize: '0.85rem',
                boxShadow: '0 2px 6px rgba(1, 62, 55, 0.25)',
                border: '2px solid #ffffff'
              }}>
                {userName !== 'Utilisateur' ? userName.substring(0, 2).toUpperCase() : <User size={16} />}
              </div>
              <div style={{ display: 'none', flexDirection: 'column', gap: '2px', textAlign: 'left' }} className="user-details">
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>{userName}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>{userRole}</span>
              </div>
              <div className="user-details" style={{ display: 'none', color: '#94a3b8', marginLeft: '4px', transition: 'transform 0.2s ease', transform: showDropdown ? 'rotate(180deg)' : 'none' }}>
                <ChevronDown size={16} />
              </div>
            </button>

            {/* Le Menu Dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '0',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                width: '240px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                padding: '8px'
              }}>
                <div style={{ padding: '8px 12px 12px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text)' }}>{userName}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</span>
                </div>
                
                <Link href="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                  <User size={16} /> Paramètre profil
                </Link>
                
                <button onClick={handleLogout} className="dropdown-item dropdown-item-danger" style={{ outline: 'none' }}>
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rendre le profil visible sur écrans larges via CSS inline */}
      <style jsx>{`
        .profile-btn:hover {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
          transition: background-color 0.15s ease, color 0.15s ease;
          width: 100%;
        }
        .dropdown-item:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .dropdown-item-danger {
          color: #ef4444;
          margin-top: 4px;
        }
        .dropdown-item-danger:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }
        @media (min-width: 640px) {
          .user-details {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}

