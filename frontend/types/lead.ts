export type LeadStatus = 'NEW' | 'ASSIGNED' | 'CALLBACK' | 'CONFIRMED' | 'CANCELLED';

export type LeadOperatorSummary = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
} | null;

export type LeadFlowSummary = {
  id: string;
  title: string;
  slug: string;
} | null;

export type LeadProductSummary = {
  id: string;
  title: string;
  price?: string | null;
  cpaTargetolog?: string | null;
  cpaOperator?: string | null;
} | null;

export type Lead = {
  id: string;
  status: LeadStatus;
  phone: string;
  name?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  targetologId: string;
  operatorId?: string | null;
  flow: LeadFlowSummary;
  product: LeadProductSummary;
  operator: LeadOperatorSummary;
};
