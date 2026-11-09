export interface CatalogCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface Product {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  type: 'product' | 'service';
  unit: string;
  stock?: number;
  isActive: boolean;
  images?: string[];
}
