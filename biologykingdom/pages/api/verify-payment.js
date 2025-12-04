// pages/api/verify-payment.js
import { supabase } from '../../lib/supabase';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('=== Payment Verification Started ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan_id
    } = req.body;

    // Get user from auth token
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Token present:', !!token);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Auth error:', authError);
      console.log('User:', user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('User authenticated:', user.id);

    // 1. Get plan details first
    console.log('Fetching plan:', plan_id);
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*, exams(*)')
      .eq('id', plan_id)
      .single();

    if (planError) {
      console.log('Plan error:', planError);
      return res.status(404).json({ error: 'Plan not found' });
    }

    console.log('Plan found:', plan.name);
    console.log('Exam ID:', plan.exam_id);

    // 2. Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isSignatureValid = expectedSignature === razorpay_signature;
    
    if (!isSignatureValid) {
      console.error('Invalid signature!');
      return res.status(400).json({ 
        error: 'Invalid payment signature',
        message: 'Payment verification failed'
      });
    }

    console.log('Signature verified successfully');

    // 3. Check if payment already exists
    console.log('Checking existing payment for order:', razorpay_order_id);
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_order_id', razorpay_order_id)
      .maybeSingle();  // Use maybeSingle instead of single to handle no results

    console.log('Existing payment check result:', { 
      exists: !!existingPayment, 
      error: checkError?.message 
    });

    if (existingPayment) {
      console.log('Payment already exists:', existingPayment.id);
      
      // If payment is already marked as paid, just return success
      if (existingPayment.status === 'paid') {
        console.log('Payment already marked as paid');
        return res.status(200).json({ 
          success: true, 
          message: 'Payment already verified',
          payment: existingPayment
        });
      }
      
      // If payment exists but not paid, update it
      if (existingPayment.status !== 'paid') {
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            provider_payment_id: razorpay_payment_id,
            provider_signature: razorpay_signature,
            updated_at: new Date().toISOString(),
            raw_response: req.body
          })
          .eq('id', existingPayment.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating payment:', updateError);
          throw updateError;
        }
        
        console.log('Payment updated to paid status:', updatedPayment.id);
        
        // Continue to subscription creation
        return await createSubscription(res, user.id, plan, updatedPayment);
      }
    }

    // 4. Create new payment record
    const paymentData = {
      user_id: user.id,
      plan_id: plan_id,
      exam_id: plan.exam_id,
      amount_in_paise: plan.price_in_paise,
      currency: 'INR',
      status: 'paid',
      provider: 'razorpay',
      provider_order_id: razorpay_order_id,
      provider_payment_id: razorpay_payment_id,
      provider_signature: razorpay_signature,
      idempotency_key: `payment_${razorpay_payment_id}`,
      net_amount_in_paise: plan.price_in_paise,
      raw_response: req.body,
      metadata: {
        plan_name: plan.name,
        billing_interval: plan.billing_interval,
        duration_days: plan.duration_days,
        verified_at: new Date().toISOString(),
        exam_name: plan.exams?.name || 'Unknown'
      }
    };

    console.log('Creating payment record:', {
      ...paymentData,
      raw_response: '...' // Don't log full raw_response
    });

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insertion error:', paymentError);
      throw paymentError;
    }

    console.log('Payment record created:', payment.id);

    // 5. Create subscription
    return await createSubscription(res, user.id, plan, payment);

  } catch (error) {
    console.error('=== Payment Verification Failed ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Payment verification failed',
      code: error.code,
      message: 'Please contact support if this persists'
    });
  }
}

// Helper function to create/update subscription
async function createSubscription(res, userId, plan, payment) {
  try {
    const expiresAt = new Date();
    
    if (plan.duration_days) {
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);
    } else {
      // Default to 1 year if no duration specified
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    console.log('Subscription expires at:', expiresAt);

    // Check for existing subscription
    const { data: existingSubscription, error: subCheckError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', plan.id)
      .maybeSingle();

    console.log('Existing subscription check:', { 
      exists: !!existingSubscription, 
      error: subCheckError?.message 
    });

    let subscription;
    
    if (existingSubscription && !subCheckError) {
      // Update existing subscription
      console.log('Updating existing subscription:', existingSubscription.id);
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'active',
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          payment_id: payment?.id || null,
          metadata: {
            ...existingSubscription.metadata,
            renewed_at: new Date().toISOString(),
            payment_id: payment?.id
          }
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
      subscription = updatedSubscription;
      console.log('Subscription updated:', subscription.id);
    } else {
      // Create new subscription
      console.log('Creating new subscription...');
      const subscriptionData = {
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: payment?.id || null,
        metadata: {
          purchased_at: new Date().toISOString(),
          razorpay_payment_id: payment?.provider_payment_id,
          razorpay_order_id: payment?.provider_order_id,
          exam_id: plan.exam_id,
          exam_name: plan.exams?.name
        }
      };

      console.log('Subscription data:', subscriptionData);

      const { data: newSubscription, error: createError } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (createError) {
        console.error('Subscription creation error:', createError);
        throw createError;
      }
      subscription = newSubscription;
      console.log('Subscription created:', subscription.id);
    }

    // 6. Optional: Update user profile or send email
    try {
      // Update user metadata with premium status
      await supabase.auth.updateUser({
        data: {
          is_premium: true,
          premium_since: new Date().toISOString(),
          active_plan: plan.name
        }
      });
    } catch (userUpdateError) {
      console.log('User update non-critical error:', userUpdateError.message);
      // Continue even if user update fails
    }

    console.log('=== Payment Verification Successful ===');
    
    // 7. Send success response
    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      payment: payment,
      subscription,
      redirectUrl: '/dashboard'
    });

  } catch (error) {
    console.error('Subscription creation failed:', error);
    throw error;
  }
}