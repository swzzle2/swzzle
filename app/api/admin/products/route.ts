import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const PRODUCTS_PATH = path.join(process.cwd(), 'data', 'products.json');

function readProducts() {
  const data = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeProducts(products: unknown[]) {
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const products = readProducts();

  if (id) {
    const product = products.find((p: { id: string }) => p.id === id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updatedProduct = await request.json();
    const products = readProducts();

    const index = products.findIndex(
      (p: { id: string }) => p.id === updatedProduct.id
    );
    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    products[index] = { ...products[index], ...updatedProduct };
    writeProducts(products);

    return NextResponse.json({ success: true, product: products[index] });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
