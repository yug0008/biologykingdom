import { supabase } from '../../lib/supabase';
// crypto is now a built-in Node.js module, no need to install

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let paymentId = null;

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan_id
    } = req.body;

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !plan_id) {
      return res.status(400).json({ 
        error: 'Missing required payment parameters' 
      });
    }

    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify payment signature using built-in crypto module
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    paymentId = payment.id;

    // Check if already processed
    if (payment.status === 'paid') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Update payment status to paid
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'paid',
        provider_payment_id: razorpay_payment_id,
        provider_signature: razorpay_signature,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updateError) {
      throw new Error('Failed to update payment status');
    }

    // Calculate subscription expiry
    let expiresAt = new Date();
    if (plan.billing_interval === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.billing_interval === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else if (plan.billing_interval === 'once' && plan.duration_days) {
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);
    } else {
      // Lifetime access
      expiresAt = null;
    }

    // Create or update user subscription
    const { data: existingSubscription, error: subCheckError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan_id', plan_id)
      .single();

    let subscription;
    
    if (existingSubscription) {
      // Update existing subscription
      const { data: updatedSub, error: updateSubError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          auto_renew: plan.billing_interval !== 'once',
          razorpay_subscription_id: razorpay_payment_id,
          updated_at: new Date().toISOString(),
          metadata: {
            ...payment.metadata,
            last_payment_id: payment.id,
            payment_method: 'razorpay'
          }
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateSubError) throw updateSubError;
      subscription = updatedSub;
    } else {
      // Create new subscription
      const { data: newSub, error: createSubError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: plan_id,
          exam_id: plan.exam_id,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          auto_renew: plan.billing_interval !== 'once',
          razorpay_subscription_id: razorpay_payment_id,
          metadata: {
            payment_id: payment.id,
            payment_method: 'razorpay',
            initial_payment_amount: payment.amount_in_paise
          }
        })
        .select()
        .single();

      if (createSubError) throw createSubError;
      subscription = newSub;
    }

    // Create enrollment if exam_id exists
    if (plan.exam_id) {
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .upsert({
          user_id: user.id,
          exam_id: plan.exam_id,
          source: 'subscription',
          source_id: subscription.id,
          valid_from: new Date().toISOString(),
          valid_until: expiresAt ? expiresAt.toISOString() : null,
          active: true
        }, {
          onConflict: 'user_id,exam_id,source,source_id'
        });

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        // Don't fail the whole process if enrollment fails
      }
    }

    // Create invoice
    const invoiceNumber = `INV-${Date.now()}-${user.id.slice(0, 8)}`;
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        payment_id: payment.id,
        invoice_number: invoiceNumber,
        issued_at: new Date().toISOString(),
        metadata: {
          plan_name: plan.name,
          billing_interval: plan.billing_interval,
          user_email: user.email
        }
      });

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      // Don't fail the whole process if invoice creation fails
    }

    // Log successful payment event
    await supabase
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        event_type: 'payment_verified',
        payload: {
          razorpay_payment_id,
          razorpay_order_id,
          plan_id,
          subscription_id: subscription.id,
          amount: payment.amount_in_paise
        }
      });

    res.status(200).json({
      success: true,
      payment_id: payment.id,
      subscription_id: subscription.id,
      invoice_number: invoiceNumber,
      expires_at: subscription.expires_at,
      message: 'Payment verified and subscription activated successfully'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);

    // Update payment status to failed if we have the payment ID
    if (paymentId) {
      try {
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        // Log failure event
        await supabase
          .from('payment_events')
          .insert({
            payment_id: paymentId,
            event_type: 'payment_verification_failed',
            payload: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
      } catch (dbError) {
        console.error('Error updating failed payment status:', dbError);
      }
    }

    res.status(500).json({ 
      error: 'Payment verification failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}