// API Configuration
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.30.142:7080';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7080';

// Types
export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiError {
  message: string;
  error?: string;
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  if (!response.ok) {
    const error: ApiError = isJson 
      ? data 
      : { message: data || `HTTP error! status: ${response.status}` };
    throw error;
  }
  
  return data as T;
}

// API Client
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      return handleResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw { message: error.message };
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/api/auth/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    });
  }

  // Transaction endpoints
  async createTransaction(data: {
    amount: number;
    description?: string;
    category?: string;
    date?: string;
    type: 'income' | 'expense';
  }): Promise<{ success: boolean; message: string; data: Transaction }> {
    return this.request<{ success: boolean; message: string; data: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        description: data.description || null,
        category_name: data.category || null,
        transaction_type: data.type,
        date: data.date || null,
      }),
    });
  }

  async getTransactions(params?: {
    wallet_id?: string;
    category_id?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: Transaction[];
    meta: {
      total: number;
      limit: number;
      offset: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const query = queryParams.toString();
    const url = query ? `/api/transactions?${query}` : '/api/transactions';
    return this.request(url, {
      method: 'GET',
    });
  }

  async getTransaction(id: string): Promise<{ success: boolean; data: Transaction }> {
    return this.request<{ success: boolean; data: Transaction }>(`/api/transactions/${id}`, {
      method: 'GET',
    });
  }

  async updateTransaction(
    id: string,
    data: {
      amount?: number;
      description?: string;
      category?: string;
      date?: string;
      type?: 'income' | 'expense';
    }
  ): Promise<{ success: boolean; message: string; data: Transaction }> {
    return this.request<{ success: boolean; message: string; data: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        category_name: data.category,
        transaction_type: data.type,
        date: data.date,
      }),
    });
  }

  async deleteTransaction(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getMonthlyStats(): Promise<{
    success: boolean;
    data: Array<{
      month: number;
      year: number;
      income: number;
      expense: number;
    }>;
  }> {
    return this.request('/api/dashboard/monthly', {
      method: 'GET',
    });
  }

  async getExpensesByCategory(): Promise<{
    success: boolean;
    data: Array<{
      name: string;
      icon?: string;
      color?: string;
      total: number;
    }>;
  }> {
    return this.request('/api/dashboard/by-category', {
      method: 'GET',
    });
  }
}

// Transaction types
export interface Transaction {
  id: string;
  wallet_id: string;
  category_id?: string;
  category_name?: string;
  transaction_type: string;
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

