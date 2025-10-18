import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Configure web-push with VAPID keys only if they exist
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:security@komrasec.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Push notifications not configured. VAPID keys missing.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { action, subscription, notification } = body;

    switch (action) {
      case 'subscribe':
        return await handleSubscribe(subscription);
      
      case 'unsubscribe':
        return await handleUnsubscribe(subscription);
      
      case 'send':
        return await handleSendNotification(notification);
      
      case 'trigger-security':
        return await handleSecurityNotification(notification);
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleSubscribe(subscription: any) {
  try {
    // Store subscription in database
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: subscription.userAgent || 'unknown',
        is_active: true
      }, {
        onConflict: 'endpoint'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subscription: ${error.message}`);
    }

    console.log('✅ Push subscription saved:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      subscriptionId: data.id
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save subscription'
    }, { status: 500 });
  }
}

async function handleUnsubscribe(subscription: any) {
  try {
    const { error } = await supabase
      .from("push_subscriptions")
      .update({ is_active: false })
      .eq("endpoint", subscription.endpoint);

    if (error) {
      throw new Error(`Failed to unsubscribe: ${error.message}`);
    }

    console.log("✅ Unsubscribed:", subscription.endpoint);

    return NextResponse.json({
      success: true,
      message: "Unsubscribed successfully",
    });
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unsubscribe",
      },
      { status: 500 },
    );
  }
}

async function handleSendNotification(notification: any) {
  try {
    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions',
        stats: { total: 0, successful: 0, failed: 0 }
      });
    }

    console.log(`📤 Sending notification to ${subscriptions.length} subscribers...`);

    const payload = JSON.stringify({
      title: notification.title || 'Komra Security',
      body: notification.body || 'New security alert',
      icon: notification.icon || '/images/icon-rounded-corners.png',
      badge: '/images/icon-rounded-corners.png',
      tag: notification.tag || 'komra-notification',
      data: notification.data || {},
      timestamp: Date.now()
    });

    let successful = 0;
    let failed = 0;

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        successful++;
        console.log(`✅ Sent to: ${sub.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        failed++;
        console.error(`❌ Failed to send to ${sub.endpoint.substring(0, 50)}:`, error.message);
        
        // If subscription is invalid, mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('endpoint', sub.endpoint);
          console.log(`🗑️  Removed invalid subscription: ${sub.endpoint.substring(0, 50)}`);
        }
      }
    });

    await Promise.all(sendPromises);

    console.log(`📊 Notification stats: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      stats: {
        total: subscriptions.length,
        successful,
        failed
      }
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notifications'
    }, { status: 500 });
  }
}

async function handleSecurityNotification(notification: any) {
  const { type, details } = notification;

  // Map notification types to user-friendly messages
  const notificationMap: Record<
    string,
    { title: string; body: string; icon: string }
  > = {
    critical_vulnerability: {
      title: "🚨 Critical Security Alert",
      body: `Critical vulnerability detected: ${details.cve || details.name || "Unknown CVE"}`,
      icon: "/images/icon-rounded-corners.png",
    },
    high_severity_threat: {
      title: "⚠️ High Severity Threat",
      body: `High severity threat on ${details.endpoint || "unknown endpoint"}`,
      icon: "/images/icon-rounded-corners.png",
    },
    system_offline: {
      title: "📴 System Offline",
      body: `System ${details.endpoint || "unknown"} has gone offline`,
      icon: "/images/icon-rounded-corners.png",
    },
    new_endpoint: {
      title: "🔍 New Endpoint Discovered",
      body: `New endpoint: ${details.endpoint || "unknown"}`,
      icon: "/images/icon-rounded-corners.png",
    },
    compliance_alert: {
      title: "📋 Compliance Alert",
      body: `Compliance violation: ${details.violation || "unknown violation"}`,
      icon: "/images/icon-rounded-corners.png",
    },
  };

  const notificationData = notificationMap[type] || {
    title: "Komra Security Alert",
    body: "New security event detected",
    icon: "/images/icon-rounded-corners.png",
  };

  // Send the notification
  return await handleSendNotification({
    ...notificationData,
    tag: type,
    data: details,
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Komra Notifications API",
    version: "1.0.0",
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    endpoints: {
      POST: {
        subscribe: "Subscribe to push notifications",
        unsubscribe: "Unsubscribe from push notifications",
        send: "Send notification to all subscribers",
        "trigger-security": "Trigger security notification",
      },
    },
  });
}