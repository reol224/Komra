'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = async () => {
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'starter' }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create checkout session');
        return null;
      }
      
      return data.clientSecret;
    } catch (err: any) {
      setError(err.message || 'Failed to create checkout session');
      return null;
    }
  };

  const options = { fetchClientSecret };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/homepage">
          <Button variant="ghost" className="mb-6 text-slate-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-white mb-6">
              Complete Your Purchase
            </h1>
            
            {error ? (
              <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4">
                <p className="font-semibold mb-2">Error</p>
                <p>{error}</p>
              </div>
            ) : (
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}