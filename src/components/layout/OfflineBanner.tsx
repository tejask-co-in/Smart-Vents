import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700/80 text-neutral-200 text-xs shadow-lg backdrop-blur-sm">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — All dumps and local AI remain fully operational on this device.</span>
    </div>
  );
};
