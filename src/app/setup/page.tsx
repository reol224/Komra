'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SetupFlow from '@/components/setup/SetupFlow';
import { Loader2 } from 'lucide-react';

function SetupContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      // Simulate Stripe session verification
      setTimeout(() => {
        setVerifying(false);
      }, 1500);
    } else {
      setError('No session ID found');
      setVerifying(false);
    }
  }, [sessionId]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <p className="text-red-500 text-lg font-semibold">Setup Error</p>
            <p className="text-slate-300 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return <SetupFlow licenseKey={sessionId || undefined} />;
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}