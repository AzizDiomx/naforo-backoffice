'use client';

import { useEffect, useState } from 'react';
import { api } from './api';

export interface PlanQuotas {
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

    // Default fallback features by plan code if features array is empty
    if (features.length === 0) {
      if (pCode.includes('pro')) {
        features = ['email_reminders', 'sms_whatsapp', 'mobile_money_autovalidate', 'qr_code_verification', 'excel_export', 'ged_vault', 'chat_encrypted', 'incident_management'];
      } else if (pCode.includes('starter')) {
        features = ['email_reminders', 'standard_pdf', 'basic_support'];
      }
    }

    return features.includes(featureCode);
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
