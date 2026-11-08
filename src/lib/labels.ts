import type { DeliveryStatus, OrderStatus, PaymentMethod, PaymentStatus } from './types';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cash_on_delivery: 'Paiement à la livraison',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Paiement en attente',
  paid: 'Payée',
  refunded: 'Remboursée',
  failed: 'Paiement échoué',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Pas encore expédiée',
  in_transit: 'En cours de livraison',
  delivered: 'Livrée',
  failed: 'Livraison échouée',
  returned: 'Retournée',
};

export const CONTACT_SUBJECTS = {
  general: 'Question générale',
  produit: 'Question sur un produit',
  commande: 'Suivi de commande',
  gros: 'Commande en gros / revendeur',
  autre: 'Autre',
} as const;
