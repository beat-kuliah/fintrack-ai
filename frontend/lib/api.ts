// API Configuration
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://172.20.30.142:7080';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7080';
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.11:7080';

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
    wallet_id?: string;
  }): Promise<{ success: boolean; message: string; data: Transaction }> {
    return this.request<{ success: boolean; message: string; data: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        description: data.description || null,
        category_name: data.category || null,
        transaction_type: data.type,
        date: data.date || null,
        wallet_id: data.wallet_id || null,
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
      wallet_id?: string;
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
        wallet_id: data.wallet_id,
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

  // Category endpoints
  async getCategories(): Promise<{
    success: boolean;
    data: Category[];
  }> {
    return this.request<{ success: boolean; data: Category[] }>('/api/categories', {
      method: 'GET',
    });
  }

  async createCategory(data: {
    name: string;
    icon?: string;
    color?: string;
    category_type: string;
  }): Promise<{ success: boolean; message: string; data: Category }> {
    return this.request<{ success: boolean; message: string; data: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(
    id: string,
    data: {
      name: string;
      icon?: string;
      color?: string;
      category_type: string;
    }
  ): Promise<{ success: boolean; message: string; data: Category }> {
    return this.request<{ success: boolean; message: string; data: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Wallet endpoints
  async getWallets(): Promise<{
    success: boolean;
    data: Wallet[];
  }> {
    return this.request<{ success: boolean; data: Wallet[] }>('/api/wallets', {
      method: 'GET',
    });
  }

  async createWallet(data: {
    name: string;
    wallet_type: string;
    balance?: number;
    icon?: string;
    color?: string;
    credit_limit?: number;
    is_default?: boolean;
  }): Promise<{ success: boolean; message: string; data: Wallet }> {
    return this.request<{ success: boolean; message: string; data: Wallet }>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWallet(
    id: string,
    data: {
      name?: string;
      wallet_type?: string;
      balance?: number;
      icon?: string;
      color?: string;
      credit_limit?: number;
      is_default?: boolean;
    }
  ): Promise<{ success: boolean; message: string; data: Wallet }> {
    return this.request<{ success: boolean; message: string; data: Wallet }>(`/api/wallets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWallet(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/wallets/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget endpoints
  async getBudgets(params?: {
    month?: number;
    year?: number;
  }): Promise<{
    success: boolean;
    data: Budget[];
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
    const url = query ? `/api/budgets?${query}` : '/api/budgets';
    return this.request<{ success: boolean; data: Budget[] }>(url, {
      method: 'GET',
    });
  }

  async createBudget(data: {
    category_id?: string;
    amount: number;
    month: number;
    year: number;
    is_active?: boolean;
    alert_threshold?: number;
  }): Promise<{ success: boolean; message: string; data: Budget }> {
    // Clean up data: remove category_id if it's empty string or invalid
    const cleanData: any = {
      amount: data.amount,
      month: data.month,
      year: data.year,
    };
    
    // Only include category_id if it's a valid non-empty UUID string
    // Don't include it at all if it's empty/undefined/null
    if (data.category_id && 
        data.category_id.trim() !== '' && 
        data.category_id !== 'null' && 
        data.category_id !== 'undefined' &&
        data.category_id !== 'None') {
      // Validate it's a valid UUID format before including
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(data.category_id.trim())) {
        cleanData.category_id = data.category_id.trim();
      }
      // If not valid UUID, just don't include it (will be null in DB)
    }
    // If category_id is not provided or invalid, don't include it in the request
    // Backend will treat missing field as None
    
    if (data.is_active !== undefined) {
      cleanData.is_active = data.is_active;
    }
    
    if (data.alert_threshold !== undefined) {
      cleanData.alert_threshold = data.alert_threshold;
    }
    
    return this.request<{ success: boolean; message: string; data: Budget }>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(cleanData),
    });
  }

  async getBudget(id: string): Promise<{ success: boolean; data: Budget }> {
    return this.request<{ success: boolean; data: Budget }>(`/api/budgets/${id}`, {
      method: 'GET',
    });
  }

  async updateBudget(
    id: string,
    data: {
      category_id?: string | null;
      amount?: number;
      month?: number;
      year?: number;
      is_active?: boolean;
      alert_threshold?: number;
    }
  ): Promise<{ success: boolean; message: string; data: Budget }> {
    // Clean category_id: convert empty string to null
    const cleanedData = {
      ...data,
      category_id: data.category_id === '' || data.category_id === undefined ? null : data.category_id,
    };
    return this.request<{ success: boolean; message: string; data: Budget }>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanedData),
    });
  }

  async deleteBudget(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  async copyBudget(data: {
    source_month: number;
    source_year: number;
    target_month: number;
    target_year: number;
  }): Promise<{ success: boolean; message: string; data: Budget[] }> {
    return this.request<{ success: boolean; message: string; data: Budget[] }>('/api/budgets/copy', {
      method: 'POST',
      body: JSON.stringify(data),
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

// Wallet types
export interface Wallet {
  id: string;
  name: string;
  wallet_type: string;
  balance: number;
  icon?: string;
  color?: string;
  credit_limit?: number;
  is_default: boolean;
  created_at: string;
}

// Budget types
export interface Budget {
  id: string;
  category_id?: string;
  category_name?: string;
  amount: number;
  month: number;
  year: number;
  is_active: boolean;
  alert_threshold?: number;
  used_amount?: number;
  remaining_amount?: number;
  usage_percentage?: number;
  is_over_budget?: boolean;
  should_alert?: boolean;
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  category_type: string;
  is_default: boolean;
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

