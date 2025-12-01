import { NextRequest, NextResponse } from 'next/server';
import { SetupService } from '@/lib/setupService';
import { EmailService } from '@/lib/emailService';
import { randomBytes } from 'crypto';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
  });
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!signature) {
      console.error('No stripe-signature header found');
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract customer info
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;
      const customerEmail = session.customer_email || session.customer_details?.email;
      
      if (!customerEmail) {
        console.error('No customer email found in session');
        return NextResponse.json({ error: 'No customer email' }, { status: 400 });
      }

      console.log('Payment successful for:', customerEmail);

      // 1. Create billing account
      const billingAccount = await SetupService.createBillingAccount(
        stripeCustomerId,
        stripeSubscriptionId
      );

      // 2. Start environment provisioning
      await SetupService.startEnvironmentProvisioning(billingAccount.id);

      // 3. Generate temporary admin credentials
      const tempUsername = customerEmail.split('@')[0];
      const tempPassword = randomBytes(16).toString('hex');

      // 4. Create admin account
      await SetupService.createAdminAccount(
        billingAccount.id,
        tempUsername,
        customerEmail,
        tempPassword,
        false
      );

      // 5. Send welcome email with credentials
      try {
        await EmailService.sendWelcomeEmail({
          customerEmail,
          username: tempUsername,
          tempPassword,
          licenseKey: billingAccount.license_key,
          loginUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://komrasec.com',
        });
        console.log('Welcome email sent successfully to:', customerEmail);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the webhook if email fails - credentials are logged
      }

      return NextResponse.json({ 
        received: true,
        billingAccountId: billingAccount.id 
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}