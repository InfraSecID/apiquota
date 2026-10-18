import React, { useState, useEffect } from 'react';
import { NotificationConfig } from '../types';
import { api } from '../services/api';
import { X, Bell, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState('');
  const [defaultThreshold, setDefaultThreshold] = useState(20);
  const [isEnabled, setIsEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const data = await api.getAlertConfig();
      setConfig(data);
      setTelegramChatId(data.telegramChatId || '');
      setWhatsappWebhookUrl(data.whatsappWebhookUrl || '');
      setDefaultThreshold(data.defaultThreshold || 20);
      setIsEnabled(data.isEnabled !== undefined ? data.isEnabled : true);
      setTelegramBotToken(''); // Don't expose token in plaintext
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load config' });
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const payload: any = {
        telegramChatId,
        whatsappWebhookUrl,
        defaultThreshold: Number(defaultThreshold),
        isEnabled,
      };
      if (telegramBotToken.trim()) {
        payload.telegramBotToken = telegramBotToken.trim();
      }

      await api.updateAlertConfig(payload);
      setStatusMessage({ type: 'success', text: 'Alert configuration saved successfully!' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setStatusMessage(null);
    try {
      const res = await api.testAlert({
        channel: 'TELEGRAM',
        telegramBotToken: telegramBotToken || undefined,
        telegramChatId: telegramChatId || undefined,
      });
      setStatusMessage({ type: 'success', text: res.message || 'Telegram test alert delivered successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to deliver Telegram alert' });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleTestWhatsapp = async () => {
    setTestingWhatsapp(true);
    setStatusMessage(null);
    try {
      const res = await api.testAlert({
        channel: 'WHATSAPP',
        whatsappWebhookUrl: whatsappWebhookUrl || undefined,
      });
      setStatusMessage({ type: 'success', text: res.message || 'WhatsApp webhook payload delivered successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to deliver WhatsApp webhook' });
    } finally {
      setTestingWhatsapp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Alert Dispatcher Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`px-6 py-3 border-b flex items-center space-x-2 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Global Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="text-sm font-medium text-white block">Automated Low Quota Alerts</span>
              <span className="text-xs text-slate-400">
                Trigger notifications when remaining quota is &lt; 20%
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Telegram Settings */}
          <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Telegram Bot Integration
              </span>
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="text-xs flex items-center space-x-1 text-sky-400 hover:text-sky-300 transition disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                <span>{testingTelegram ? 'Testing...' : 'Test Telegram'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telegram Bot Token
              </label>
              <input
                type="password"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                placeholder={config?.hasTelegramBotToken ? '•••••••• (Token configured)' : 'e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Telegram Chat ID
              </label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="e.g. -100123456789 or 987654321"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* WhatsApp Webhook Settings */}
          <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                WhatsApp Webhook Gateway
              </span>
              <button
                type="button"
                onClick={handleTestWhatsapp}
                disabled={testingWhatsapp}
                className="text-xs flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                <span>{testingWhatsapp ? 'Testing...' : 'Test Webhook'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Webhook URL (Evolution API / Baileys / Twilio)
              </label>
              <input
                type="url"
                value={whatsappWebhookUrl}
                onChange={(e) => setWhatsappWebhookUrl(e.target.value)}
                placeholder="https://your-whatsapp-gateway.com/webhook"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Default Threshold */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Global Default Alert Threshold (%)
            </label>
            <input
              type="number"
              min="5"
              max="90"
              value={defaultThreshold}
              onChange={(e) => setDefaultThreshold(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
