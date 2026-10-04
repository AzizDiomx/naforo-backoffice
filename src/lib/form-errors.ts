import toast from 'react-hot-toast';
import { ApiError } from './api';

export interface FormErrorResult {
  message: string;
  fieldErrors: Record<string, string>;
  status?: number;
}

/**
 * Extrait les erreurs d'une requête API (validation Zod, contraintes d'intégrité, quotas, etc.)
 * et déclenche un toast précis tout en associant les messages aux champs correspondants.
 */
export function handleFormError(err: unknown, fallbackMessage = "Une erreur est survenue lors de l'enregistrement."): FormErrorResult {
  let message = fallbackMessage;
  const fieldErrors: Record<string, string> = {};
  let status: number | undefined;

  if (err instanceof ApiError) {
    message = err.message || fallbackMessage;
    status = err.status;

    // 1. Erreurs de champs retournées par le backend (ex: Zod 422 ou Prisma 409)
    if (Array.isArray(err.errors)) {
      err.errors.forEach((item: any) => {
        if (item && item.field) {
          const cleanField = String(item.field).replace(/^(body|query|params)\./, '');
          fieldErrors[cleanField] = item.message;
        }
      });
    } else if (err.errors && typeof err.errors === 'object') {
      Object.entries(err.errors).forEach(([k, v]) => {
        const cleanField = k.replace(/^(body|query|params)\./, '');
        fieldErrors[cleanField] = typeof v === 'string' ? v : (v as any)?.message || String(v);
      });
    }

    // 2. Détection contextuelle d'après le message pour les cas métier
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('email') && !fieldErrors.email) {
      fieldErrors.email = message;
    }
    if (lowerMsg.includes('téléphone') || lowerMsg.includes('telephone') || lowerMsg.includes('phone')) {
      if (!fieldErrors.phone) {
        fieldErrors.phone = message;
      }
    }
    if (lowerMsg.includes('ville') && !fieldErrors.city) {
      fieldErrors.city = message;
    }
    if (lowerMsg.includes('nom du bien') && !fieldErrors.name) {
      fieldErrors.name = message;
    }
    if (lowerMsg.includes('adresse physique') && !fieldErrors.address) {
      fieldErrors.address = message;
    }
    if ((lowerMsg.includes('titre') || lowerMsg.includes('title')) && !fieldErrors.title) {
      fieldErrors.title = message;
    }
    if ((lowerMsg.includes('bien immobilier') || lowerMsg.includes('logement')) && !fieldErrors.propertyId) {
      fieldErrors.propertyId = message;
    }
    if ((lowerMsg.includes('type') || lowerMsg.includes('catégorie')) && !fieldErrors.type) {
      fieldErrors.type = message;
    }
    if ((lowerMsg.includes('priorité') || lowerMsg.includes('urgence')) && !fieldErrors.priority) {
      fieldErrors.priority = message;
    }
    if ((lowerMsg.includes('résolution') || lowerMsg.includes('rapport')) && !fieldErrors.resolutionNotes) {
      fieldErrors.resolutionNotes = message;
    }
    if ((lowerMsg.includes('contrat') || lowerMsg.includes('bail')) && !fieldErrors.contractId) {
      fieldErrors.contractId = message;
    }
    if ((lowerMsg.includes('loyer') || lowerMsg.includes('montant')) && !fieldErrors.rentAmount) {
      fieldErrors.rentAmount = message;
    }
    if ((lowerMsg.includes('échéance') || lowerMsg.includes('echeance')) && !fieldErrors.dueDate) {
      fieldErrors.dueDate = message;
    }
    if ((lowerMsg.includes('motif') || lowerMsg.includes('raison') || lowerMsg.includes('annulation')) && !fieldErrors.reason) {
      fieldErrors.reason = message;
    }
  } else if (err instanceof Error) {
    message = err.message || fallbackMessage;
  }

  // 3. Affichage d'un toast d'erreur ultra-précis
  const fieldErrorList = Object.values(fieldErrors);
  if (fieldErrorList.length === 1) {
    toast.error(fieldErrorList[0], { id: 'form-error' });
  } else if (fieldErrorList.length > 1) {
    toast.error(message, { id: 'form-error' });
  } else {
    toast.error(message, { id: 'form-error' });
  }

  return {
    message,
    fieldErrors,
    status,
  };
}

/**
 * Affiche un toast de confirmation de succès
 */
export function showFormSuccess(message: string): void {
  toast.success(message, { id: 'form-success' });
}
