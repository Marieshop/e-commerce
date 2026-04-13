export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  description: string;
  images: string[];
  stock: number;
}

export interface Order {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  customer_info: {
    name: string;
    phone: string;
    address: string;
  };
  total_amount?: number;
  date: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Income {
  id: number;
  source: string;
  amount: number;
  description: string;
  date: string;
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  stockValue: number;
  potentialRevenue: number;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
}

export interface Analytics {
  totalSales: number;
  lowStockCount: number;
  totalRevenue: number;
}
