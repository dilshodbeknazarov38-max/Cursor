export type FlowStatus = 'ACTIVE' | 'PAUSED';

export type FlowProductSummary = {
  id: string;
  title: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type Flow = {
  id: string;
  title: string;
  slug: string;
  trackingUrl: string;
  url: string;
  clicks: number;
  leads: number;
  orders: number;
  status: FlowStatus;
  productId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  product?: FlowProductSummary | null;
};
