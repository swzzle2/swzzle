export type InvoiceLineItem = {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number; // cents
};

export type WholesaleInvoice = {
  id: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  items: InvoiceLineItem[];
  shippingCost: number; // cents
  subtotal: number; // cents
  total: number; // cents
  currency: string;
  memo?: string;
  daysUntilDue: number;
  status: 'draft' | 'open' | 'paid' | 'void';
  hostedUrl?: string;
  pdfUrl?: string;
  orderId?: string;
  createdAt: string;
  updatedAt: string;
};
