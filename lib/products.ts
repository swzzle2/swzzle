import productsData from '@/data/products.json';

export type Product = {
  id: string;
  name: string;
  descriptor: string;
  price: number;
  status: 'active' | 'inactive';
  mainPageDisplay?: boolean;
  shortDescription: string;
  longDescription: string;
  ingredients: string;
  directions: string;
  warnings: string;
  image: string;
  images?: string[];
  color: string;
  stripeProductId?: string;
  stripePriceId?: string;
};

export function getProducts(): Product[] {
  return productsData as Product[];
}

export function getActiveProducts(): Product[] {
  return getProducts().filter((p) => p.status === 'active');
}

export function getProduct(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}
