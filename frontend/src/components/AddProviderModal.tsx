import React, { useState, useEffect } from 'react';
import { ApiProvider } from '../types';
import { X, Lock, ShieldCheck } from 'lucide-react';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: string;
    name: string;
    provider: string;
    apiKey: string;
    totalQuota: number;
    alertThreshold: number;
  }) => Promise<void>;
  editingProvider?: ApiProvider | null;
}

export const AddProviderModal: React.FC<AddProviderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProvider,
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('OPENAI');
  const [apiKey, setApiKey] = useState('');
  const [totalQuota, setTotalQuota] = useState(100);
  const [alertThreshold, setAlertThreshold] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProvider) {
      setName(editingProvider.name);
      setProvider(editingProvider.provider);
      setApiKey(''); // Do not preload for security; only provide if changing
      setTotalQuota(editingProvider.totalQuota);
      setAlertThreshold(editingProvider.alertThreshold);
    } else {
      setName('');
      setProvider('OPENAI');
      setApiKey('');
      setTotalQuota(100);
      setAlertThreshold(20);
    }
    setError(null);
  }, [editingProvider, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Provider name is required');
      return;
    }

    if (!editingProvider && !apiKey.trim()) {
      setError('API key is required for registration');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        id: editingProvider?.id,
        name,
        provider,
        apiKey,
        totalQuota: Number(totalQuota),
        alertThreshold: Number(alertThreshold),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">
              {editingProvider ? 'Edit API Provider' : 'Add Monitored API Provider'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-950/30 border-b border-emerald-800/30 px-6 py-2.5 flex items-center space-x-2 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>All API keys are encrypted at rest with AES-256-GCM and never stored in plaintext.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Provider Platform
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="OPENAI">OpenAI (GPT-4o, Embeddings)</option>
              <option value="GEMINI">Google Gemini (1.5 Pro, Flash)</option>
              <option value="ANTHROPIC">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="CUSTOM">Custom Provider API</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Friendly Name / Tag
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Backend Service"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              API Key {editingProvider && <span className="text-slate-500">(Leave blank to keep existing key)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editingProvider ? '••••••••••••••••••••••••' : 'sk-... or AIzaSy...'}
              required={!editingProvider}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              For demo/mocking, you can input dummy keys like <code className="text-emerald-400">sk-test-demo1234</code>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Total Budget / Quota ($)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={totalQuota}
                onChange={(e) => setTotalQuota(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Alert Threshold (% Remaining)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Encrypting & Saving...' : editingProvider ? 'Update Provider' : 'Save Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
