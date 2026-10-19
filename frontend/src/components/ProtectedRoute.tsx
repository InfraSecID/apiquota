import React from 'react';
import { User } from '../types';
import { LoginPage } from './LoginPage';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  user: User | null;
  loading: boolean;
  onLoginSuccess: (user: User) => void;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  user,
  loading,
  onLoginSuccess,
  children,
}) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono text-neutral-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onSuccess={onLoginSuccess} />;
  }

  return <>{children}</>;
};
