'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success("Un code de vérification à 6 chiffres (OTP) a été envoyé à votre adresse email.");
      setStep('reset');
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Erreur lors de l'envoi du code de réinitialisation.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
      toast.success("Mot de passe réinitialisé ! Redirection...");
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Le code OTP est invalide ou a expiré.");
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
          <div className="auth-form-container" style={{ maxWidth: '400px' }}>
            
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), #011f1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(1, 62, 55,0.3)'
            }}>
              <KeyRound size={24} color="#ffffff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              {step === 'request' ? 'Mot de passe oublié ?' : 'Nouveau mot de passe'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              {step === 'request'
                ? 'Saisissez votre email pour recevoir votre code de récupération.'
                : 'Entrez le code reçu et votre nouveau mot de passe.'}
            </p>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              <button type="submit" className="modern-btn-primary" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer le code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modern-form-group">
                <label className="modern-label">Code OTP à 6 chiffres</label>
                <div className="modern-input-wrapper">
                  <ShieldCheck className="input-icon" size={18} />
                  <input
                    type="text"
                    className="modern-input"
                    placeholder="Ex: 123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    style={{ letterSpacing: '2px', fontWeight: 'bold' }}
                    required
                  />
                </div>
              </div>

              <div className="modern-form-group">
                <label className="modern-label">Nouveau mot de passe</label>
                <div className="modern-input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="modern-input"
                    placeholder="Minimum 8 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="modern-form-group">
                <label className="modern-label">Confirmer le mot de passe</label>
                <div className="modern-input-wrapper">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="modern-input"
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modern-btn-primary" disabled={loading}>
                {loading ? 'Réinitialisation...' : 'Valider'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <Link
              href="/login"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <ArrowLeft size={16} /> Retour à la connexion
            </Link>
          </div>
        </div>
        </div>
      </div>

      {/* Visuel à droite */}
      <div className="auth-visual-section">
        <div className="auth-visual-content">
          <div className="visual-badge">Sécurité optimale</div>
          <h2 className="visual-title">Vos données, chiffrées<br/>et protégées.</h2>
          <p className="visual-desc">
            Chez Naforo, la sécurité de vos informations financières et de celles de vos locataires est notre priorité absolue. Nous utilisons les standards de chiffrement les plus stricts.
          </p>
        </div>
      </div>

      {/* Styles */}
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
          }
        }
      `}</style>
    </div>
  );
}
