import { ApiProvider, DashboardSummary, NotificationConfig } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    return handleResponse<DashboardSummary>(res);
  },

  // Providers
  async getProviders(): Promise<ApiProvider[]> {
    const res = await fetch(`${API_BASE}/providers`);
    return handleResponse<ApiProvider[]>(res);
  },

  async createProvider(payload: {
    name: string;
    provider: string;
    apiKey: string;
    totalQuota: number;
    alertThreshold: number;
  }): Promise<ApiProvider> {
    const res = await fetch(`${API_BASE}/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiProvider>(res);
  },

  async updateProvider(
    id: string,
    payload: {
      name?: string;
      apiKey?: string;
      totalQuota?: number;
      alertThreshold?: number;
      isActive?: boolean;
    }
  ): Promise<ApiProvider> {
    const res = await fetch(`${API_BASE}/providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<ApiProvider>(res);
  },

  async deleteProvider(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/providers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  async syncProvider(id: string): Promise<ApiProvider> {
    const res = await fetch(`${API_BASE}/providers/${id}/sync`, {
      method: 'POST',
    });
    return handleResponse<ApiProvider>(res);
  },

  // Alert Settings
  async getAlertConfig(): Promise<NotificationConfig> {
    const res = await fetch(`${API_BASE}/alerts/config`);
    return handleResponse<NotificationConfig>(res);
  },

  async updateAlertConfig(payload: {
    telegramBotToken?: string;
    telegramChatId?: string;
    whatsappWebhookUrl?: string;
    defaultThreshold?: number;
    isEnabled?: boolean;
  }): Promise<NotificationConfig> {
    const res = await fetch(`${API_BASE}/alerts/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<NotificationConfig>(res);
  },

  async testAlert(payload: {
    channel: 'TELEGRAM' | 'WHATSAPP';
    telegramBotToken?: string;
    telegramChatId?: string;
    whatsappWebhookUrl?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/alerts/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to send test alert');
    }
    return json;
  },
};
