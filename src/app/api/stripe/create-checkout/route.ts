import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const { plan = 'starter' } = await req.json();

    // Map plans to price IDs
    const priceIds: Record<string, string | undefined> = {
      starter: process.env.STRIPE_STARTER_PRICE_ID,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const priceId = priceIds[plan];

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan: ${plan}. Please add STRIPE_${plan.toUpperCase()}_PRICE_ID to environment variables.` },
        { status: 400 }
      );
    }

    // Get the app URL from the request origin
    const origin = req.headers.get('origin') || 'https://04d80375-79b7-4d72-ace8-b4d0e83910fa.canvases.tempo.build';

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      return_url: `${origin}/setup?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        plan: plan,
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}