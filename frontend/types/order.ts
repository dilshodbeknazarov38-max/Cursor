import type { Lead } from '@/types/lead';

export type OrderStatus = 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED';

export type OrderProductSummary = {
  id: string;
  title: string;
  cpaTargetolog?: string | null;
  cpaOperator?: string | null;
};

export type OrderUserSummary = {
  id: string;
  firstName?: string | null;
  nickname?: string | null;
  phone?: string | null;
} | null;

export type Order = {
  id: string;
  status: OrderStatus;
  amount: string;
  packedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product: OrderProductSummary;
  targetolog: OrderUserSummary;
  operator: OrderUserSummary;
  lead?: Pick<Lead, 'id' | 'phone' | 'name'> | null;
};
