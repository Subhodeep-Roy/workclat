const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export type Invoice = {
  id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
};

export async function fetchJson<T>(path: string): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vendorflow-token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
