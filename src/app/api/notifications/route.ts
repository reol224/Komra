import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// In production, store these securely in environment variables
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKUrXK5acbva7akSSJ88RcGfHeyGWyUzjgGpXYM2EM90MI';
const VAPID_PRIVATE_KEY = 'your-vapid-private-key-here'; // This should be in env variables

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  priority?: 'high' | 'normal' | 'low';
}

export async function POST(request: NextRequest) {
  try {
    const { action, subscription, notification } = await request.json();

    switch (action) {
      case 'subscribe':
        return handleSubscribe(subscription, request);
      
      case 'unsubscribe':
        return handleUnsubscribe(subscription);
      
      case 'send':
        return handleSendNotification(notification);
      
      case 'broadcast':
        return handleBroadcastNotification(notification);
      
      case 'trigger-security':
        return handleTriggerSecurityNotification(notification.type, notification.details);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Push notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'vapid-key':
      return NextResponse.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
      });
    
    case 'subscriptions':
      try {
        const { count, error } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (error) throw error;

        return NextResponse.json({
          success: true,
          count: count || 0
        });
      } catch (error) {
        console.error('Error fetching subscription count:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch subscriptions' },
          { status: 500 }
        );
      }
    
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
  }
}

async function handleSubscribe(subscription: PushSubscription, request: NextRequest) {
  try {
    // Validate subscription
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Extract user agent from request headers
    const userAgent = request.headers.get('user-agent') || '';

    // TODO: Extract user_id from authentication context
    // For now, we'll use null, but this should be updated when auth is implemented
    const userId = null; // This should come from JWT token or session

    // Upsert subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'endpoint'
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    console.log('Push subscription saved to database:', subscription.endpoint, 'User Agent:', userAgent);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('Error handling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

async function handleUnsubscribe(subscription: PushSubscription) {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', subscription.endpoint);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to remove subscription' },
        { status: 500 }
      );
    }

    console.log('Push subscription deactivated:', subscription.endpoint);

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully'
    });
  } catch (error) {
    console.error('Error handling unsubscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

async function handleSendNotification(notification: NotificationPayload) {
  try {
    // Fetch active subscriptions from database
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        stats: { successful: 0, failed: 0, total: 0 }
      });
    }

    console.log('Sending notification:', notification);
    
    // Simulate sending to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        // In production, use web-push library:
        // return webpush.sendNotification(subscription, JSON.stringify(notification));
        
        // For demo, just log
        console.log('Notification sent to:', subscription.endpoint);
        return { success: true };
      })
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${successful} subscribers`,
      stats: { successful, failed, total: subscriptions.length }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

async function handleBroadcastNotification(notification: NotificationPayload) {
  try {
    // Broadcast to all subscriptions
    return await handleSendNotification(notification);
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to broadcast notification' },
      { status: 500 }
    );
  }
}

// Helper function to trigger security notifications (now internal to the route)
async function handleTriggerSecurityNotification(
  type: 'critical_vulnerability' | 'high_severity_threat' | 'system_offline' | 'new_endpoint' | 'compliance_alert',
  details: any
) {
  const notifications = {
    critical_vulnerability: {
      title: '🚨 Critical Security Alert',
      body: `Critical vulnerability detected: ${details.cve || 'Unknown CVE'}`,
      tag: 'critical-vulnerability',
      priority: 'high' as const
    },
    high_severity_threat: {
      title: '⚠️ High Severity Threat',
      body: `High severity threat detected on ${details.endpoint || 'unknown endpoint'}`,
      tag: 'high-severity-threat',
      priority: 'normal' as const
    },
    system_offline: {
      title: '📴 System Offline',
      body: `System ${details.endpoint || 'unknown'} has gone offline`,
      tag: 'system-offline',
      priority: 'normal' as const
    },
    new_endpoint: {
      title: '🔍 New Endpoint Discovered',
      body: `New endpoint discovered: ${details.endpoint || 'unknown'}`,
      tag: 'new-endpoint',
      priority: 'low' as const
    },
    compliance_alert: {
      title: '📋 Compliance Alert',
      body: `Compliance violation detected: ${details.violation || 'unknown violation'}`,
      tag: 'compliance-alert',
      priority: 'normal' as const
    }
  };

  const notification = {
    ...notifications[type],
    icon: '/images/icon rounded corners.png',
    badge: '/images/icon rounded corners.png',
    data: details
  };

  return handleSendNotification(notification);
}