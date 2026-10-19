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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#111111] border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-semibold">
                SECURITY VAULT
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingProvider ? 'Edit API Provider' : 'Register New API Provider'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="bg-emerald-500/5 border-b border-emerald-500/20 px-6 py-2.5 flex items-center space-x-2 text-xs text-emerald-400 font-mono">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="text-[11px]">Credentials encrypted via AES-256-GCM. Plaintext is never stored.</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              PLATFORM TYPE
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono"
            >
              <option value="OPENAI">OpenAI (GPT-4o, Embeddings)</option>
              <option value="GEMINI">Google Gemini (1.5 Pro, Flash)</option>
              <option value="ANTHROPIC">Anthropic (Claude 3.5 Sonnet)</option>
              <option value="CUSTOM">Custom Provider Endpoint</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              FRIENDLY NAME / TAG
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Backend Service"
              required
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              API KEY {editingProvider && <span className="text-neutral-500">(Leave blank to keep existing key)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={editingProvider ? '••••••••••••••••••••••••' : 'sk-... or AIzaSy...'}
              required={!editingProvider}
              className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                BUDGET / QUOTA ($)
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={totalQuota}
                onChange={(e) => setTotalQuota(Number(e.target.value))}
                required
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">
                ALERT AT (% SISA)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                required
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-medium border border-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Encrypting...' : editingProvider ? 'Update Provider' : 'Save & Encrypt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
