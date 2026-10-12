import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-[#92400E] px-4 py-2 text-xs font-medium text-white shadow-lg animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>Chế độ ngoại tuyến (Offline) — Dữ liệu được lưu trữ trên điện thoại của bạn.</span>
    </div>
  );
};
