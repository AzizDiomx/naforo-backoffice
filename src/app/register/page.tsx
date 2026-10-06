'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Lock, Mail, Building, User, Phone, Eye, EyeOff, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [otp, setOtp] = useState('');
  
  const [organizationName, setOrganizationName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      return;
    }
    setLoading(true);

    try {
      const data = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        phone,
        password,
        organizationName,
        role: 'owner',
      });

      if (data && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      toast.success("Compte créé ! Veuillez vérifier votre email.");
      setStep('verify');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Une erreur de création de compte est survenue");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, token: otp });
      toast.success("Email vérifié avec succès !");
      window.location.href = '/dashboard';
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Code invalide ou expiré");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* Formulaire à gauche */}
      <div className="auth-form-section">
        <div className="auth-form-inner">
          <div className="auth-form-container" style={{ maxWidth: '440px' }}>
            
            <div style={{ marginBottom: '32px' }}>
            <img 
              src="/images/logo.png" 
              alt="Naforo Logo" 
              style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '16px' }} 
            />
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Créer votre espace Naforo
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              Rejoignez-nous et commencez à digitaliser votre gestion.
            </p>
          </div>

          {step === 'register' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* SSO Buttons for Register */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <button type="button" className="sso-btn" onClick={() => toast("Prochainement", { icon: "⏳" })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button type="button" className="sso-btn" onClick={() => toast("Prochainement", { icon: "⏳" })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.69-1.1 1.77-.97 2.84 1.08.09 2.16-.58 2.75-1.4z"/>
                  </svg>
                  Apple
                </button>
              </div>

              <div className="auth-divider">
                <span>Ou inscrivez-vous avec un email</span>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Nom de l'agence ou du bailleur</label>
                <div className="modern-input-wrapper">
                  <Building className="input-icon" size={18} />
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Ex: Immo Diaspora, Résidence Mayé..."
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="modern-form-group">
                  <label className="modern-label">Prénom</label>
                  <div className="modern-input-wrapper">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      className="modern-input"
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modern-form-group">
                  <label className="modern-label">Nom</label>
                  <div className="modern-input-wrapper">
                    <input
                      type="text"
                      className="modern-input"
                      placeholder="Koffi"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ paddingLeft: '14px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Adresse email</label>
                <div className="modern-input-wrapper">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    className="modern-input"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Numéro de téléphone</label>
                <div className="modern-input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    className="modern-input"
                    placeholder="+225 0700000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Mot de passe</label>
                <div className="modern-input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="modern-input"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span>
                  J'accepte les <Link href="/terms" style={{ color: 'var(--primary)', fontWeight: 600 }}>conditions d'utilisation</Link> et la <Link href="/privacy" style={{ color: 'var(--primary)', fontWeight: 600 }}>politique de confidentialité</Link>.
                </span>
              </label>

              <button
                type="submit"
                className="modern-btn-primary"
                disabled={loading}
              >
                {loading ? 'Création de l\'espace...' : 'Créer mon espace gratuit'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                  Un code de vérification à 6 chiffres a été envoyé à <strong>{email}</strong>.
                </p>
              </div>
              
              <div className="modern-form-group">
                <label className="modern-label" style={{ textAlign: 'center' }}>CODE DE VÉRIFICATION</label>
                <div className="modern-input-wrapper">
                  <KeyRound className="input-icon" size={20} style={{ left: '20px' }} />
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ paddingLeft: '50px', letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="modern-btn-primary"
                disabled={loading || otp.length < 6}
              >
                {loading ? 'Vérification...' : 'Valider mon compte'}
              </button>
            </form>
          )}

          <p style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </p>
        </div>
        </div>
      </div>

      {/* Visuel à droite */}
      <div className="auth-visual-section">
        <div className="auth-visual-content">
          <div className="visual-badge">100% Numérique</div>
          <h2 className="visual-title">Pilotez vos locations<br/>depuis votre smartphone.</h2>
          <p className="visual-desc">
            Créez votre compte en 2 minutes et commencez à digitaliser vos baux, vos quittances et vos paiements avec la solution leader en Afrique de l'Ouest.
          </p>
          
          <div className="visual-testimonial">
            <div className="stars">★★★★★</div>
            <p>"La plateforme m'a fait gagner un temps précieux. Tout est au même endroit, de l'état des lieux au paiement du loyer."</p>
            <div className="author">— Aminata C., Gérante d'agence immobilière</div>
          </div>
        </div>
      </div>

      {/* Styles (same as login) */}
      <style>{`
        .auth-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background-color: #ffffff;
        }

        .auth-form-section {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .auth-form-inner {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100%;
          padding: 40px 24px;
        }

        .auth-form-container {
          width: 100%;
        }

        .sso-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #0f172a;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .sso-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .auth-divider span {
          padding: 0 16px;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .modern-form-group {
          margin-bottom: 4px;
        }

        .modern-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .modern-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
        }

        .modern-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 0.95rem;
          color: #0f172a;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .modern-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(1, 62, 55, 0.1);
        }

        .modern-input::placeholder {
          color: #94a3b8;
        }

        .toggle-password-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
        }
        
        .toggle-password-btn:hover {
          color: #475569;
          background: #f1f5f9;
        }

        .modern-btn-primary {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: var(--primary);
          font-weight: 700;
          font-size: 0.95rem;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          margin-top: 12px;
        }

        .modern-btn-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }
        
        .modern-btn-primary:active {
          transform: translateY(0);
        }
        
        .modern-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .auth-visual-section {
          display: none;
        }

        @media (min-width: 1024px) {
          .auth-visual-section {
            flex: 1.2;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--primary) 0%, #011f1c 100%);
            padding: 60px;
            position: relative;
            overflow: hidden;
          }

          .auth-visual-section::before {
            content: '';
            position: absolute;
            top: -10%;
            right: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(255, 239, 179, 0.1) 0%, transparent 70%);
            border-radius: 50%;
          }

          .auth-visual-content {
            max-width: 520px;
            z-index: 1;
            color: #ffffff;
          }

          .visual-badge {
            display: inline-block;
            background: rgba(255, 239, 179, 0.15);
            color: var(--accent);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8125rem;
            font-weight: 700;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 239, 179, 0.3);
          }

          .visual-title {
            font-size: 2.75rem;
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 24px;
            letter-spacing: -0.02em;
          }

          .visual-desc {
            font-size: 1.1rem;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 48px;
          }

          .visual-testimonial {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 24px;
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }

          .visual-testimonial .stars {
            color: var(--accent);
            letter-spacing: 2px;
            margin-bottom: 12px;
          }

          .visual-testimonial p {
            font-size: 0.95rem;
            line-height: 1.5;
            font-style: italic;
            margin-bottom: 12px;
          }

          .visual-testimonial .author {
            font-size: 0.875rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.7);
          }
        }
      `}</style>
    </div>
  );
}
