import { Product, Order, StockMovement, Analytics, Expense, Income, LedgerSummary } from '../types';

const API_BASE = '../api';

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorMsg = 'An error occurred';
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch (e) {
      // If not JSON, use status text
      errorMsg = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  
  // If we expected JSON but got something else (like HTML)
  const text = await res.text();
  if (text.trim().startsWith('<!doctype html>') || text.trim().startsWith('<html')) {
    throw new Error('Server returned HTML instead of JSON. This usually means a route was not found or the server crashed.');
  }
  
  return text;
}

export const api = {
  products: {
    getAll: async (): Promise<Product[]> => {
      const res = await fetch(`${API_BASE}/products`);
      return handleResponse(res);
    },
    getOne: async (id: number): Promise<Product> => {
      const res = await fetch(`${API_BASE}/products/${id}`);
      return handleResponse(res);
    },
    create: async (formData: FormData): Promise<{ id: number }> => {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        body: formData,
      });
      return handleResponse(res);
    },
    update: async (id: number, data: Partial<Product> | FormData): Promise<void> => {
      const isFormData = data instanceof FormData;
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? data : JSON.stringify(data),
      });
      return handleResponse(res);
    },
    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      return handleResponse(res);
    },
  },
  orders: {
    create: async (data: { product_id: number; quantity: number; customer_info: any }): Promise<void> => {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    getAll: async (): Promise<Order[]> => {
      const res = await fetch(`${API_BASE}/orders`);
      return handleResponse(res);
    },
    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
      return handleResponse(res);
    },
  },
  stock: {
    getMovements: async (): Promise<StockMovement[]> => {
      const res = await fetch(`${API_BASE}/stock`);
      return handleResponse(res);
    },
    addStock: async (product_id: number, quantity: number): Promise<void> => {
      const res = await fetch(`${API_BASE}/stock/in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, quantity }),
      });
      return handleResponse(res);
    },
  },
  analytics: {
    get: async (): Promise<Analytics> => {
      const res = await fetch(`${API_BASE}/analytics`);
      return handleResponse(res);
    },
  },
  ledger: {
    getSummary: async (): Promise<LedgerSummary> => {
      const res = await fetch(`${API_BASE}/ledger/summary`);
      return handleResponse(res);
    },
    expenses: {
      getAll: async (): Promise<Expense[]> => {
        const res = await fetch(`${API_BASE}/expenses`);
        return handleResponse(res);
      },
      create: async (data: Partial<Expense>): Promise<void> => {
        const res = await fetch(`${API_BASE}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return handleResponse(res);
      },
      delete: async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE' });
        return handleResponse(res);
      },
    },
    income: {
      getAll: async (): Promise<Income[]> => {
        const res = await fetch(`${API_BASE}/income`);
        return handleResponse(res);
      },
      create: async (data: Partial<Income>): Promise<void> => {
        const res = await fetch(`${API_BASE}/income`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return handleResponse(res);
      },
      delete: async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/income/${id}`, { method: 'DELETE' });
        return handleResponse(res);
      },
    },
  },
};
