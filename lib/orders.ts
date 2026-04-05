export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  unitAmount: number;
};

export type Order = {
  id: string;
  stripeSessionId: string;
  customerEmail: string;
  customerName: string;
  customerId?: string;
  items: OrderItem[];
  amountTotal: number;
  currency: string;
  status: 'paid' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  trackingCarrier?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};
