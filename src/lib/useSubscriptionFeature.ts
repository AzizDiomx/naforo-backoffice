'use client';

import { useEffect, useState } from 'react';
import { api } from './api';

export interface PlanQuotas {
  lots: { used: number; max: number; reached: boolean };
  properties: { used: number; max: number; reached: boolean };
  tenants: { used: number; max: number; reached: boolean };
}

export function useSubscriptionFeature() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = () => {
    api.get('/subscriptions/me')
      .then(res => {
        setSubscription(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubscription();

    const handleUpdate = () => fetchSubscription();
    window.addEventListener('subscription-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('subscription-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const hasFeature = (featureCode: string): boolean => {
    if (!subscription || !subscription.planCode) return false;
    
    const pCode = subscription.planCode.toLowerCase();
    // Expert / Agence inclut toutes les fonctionnalités
    if (pCode.includes('expert') || pCode.includes('agency')) return true;

    let features: string[] = [];
    try {
      features = typeof subscription.features === 'string'
        ? JSON.parse(subscription.features)
        : (Array.isArray(subscription.features) ? subscription.features : []);
    } catch {
      features = [];
    }

    // Default fallback features by plan code
    const defaultProFeatures = [
      'dashboard',
      'standard_pdf',
      'email_reminders',
      'sms_whatsapp',
      'mobile_money_autovalidate',
      'qr_code_verification',
      'excel_export',
      'ged_vault',
      'chat_encrypted',
      'incident_management',
      'expense_workflow',
      'risk_scoring',
      'advanced_stats',
    ];
    const defaultStarterFeatures = [
      'dashboard',
      'standard_pdf',
      'email_reminders',
      'incident_management',
      'basic_support',
    ];

    if (features.includes(featureCode)) return true;
    if (pCode.includes('pro') && defaultProFeatures.includes(featureCode)) return true;
    if (pCode.includes('starter') && defaultStarterFeatures.includes(featureCode)) return true;

    return false;
  };

  return {
    subscription,
    loading,
    planCode: subscription?.planCode || 'starter',
    planName: subscription?.planName || 'Starter',
    hasFeature,
    refetch: fetchSubscription,
    quotas: subscription?.quotas as PlanQuotas | undefined,
  };
}
