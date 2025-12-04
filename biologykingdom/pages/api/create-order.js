// /pages/api/create-order.js
import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Environment check:', {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? 'Present' : 'Missing',
      keySecret: process.env.RAZORPAY_KEY_SECRET ? 'Present' : 'Missing',
    });

    // Debug: Log environment variables (without revealing full values)
    const keyIdPrefix = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID 
      ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.substring(0, 8)}...` 
      : 'Missing';
    
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID starts with:', keyIdPrefix);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);

    // Validate environment variables FIRST
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Missing Razorpay credentials in environment variables');
      return res.status(500).json({ 
        error: 'Payment configuration error',
        message: 'Payment service is not properly configured'
      });
    }

    const { plan_id, amount } = req.body;
    
    // Validate input
    if (!plan_id || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: plan_id and amount' 
      });
    }

    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Verify plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found or inactive' });
    }

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan_id', plan_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription for this plan' 
      });
    }

    // Initialize Razorpay with validation
    const Razorpay = require('razorpay');
    
    // Trim and validate keys
    const key_id = process.env.RAZORPAY_KEY_ID.trim();
    const key_secret = process.env.RAZORPAY_KEY_SECRET.trim();
    
    if (!key_id.startsWith('rzp_')) {
      console.error('Invalid Razorpay key format:', key_id.substring(0, 10));
      return res.status(500).json({ 
        error: 'Invalid payment configuration' 
      });
    }

    console.log('Initializing Razorpay with key:', key_id.substring(0, 12) + '...');
    
    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    // Create Razorpay order
    const orderOptions = {
      amount: parseInt(amount), // Ensure it's a number
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user.id.substring(0, 8)}`,
      notes: {
        plan_id: plan_id,
        user_id: user.id,
        plan_name: plan.name
      }
    };

    console.log('Creating Razorpay order with options:', {
      ...orderOptions,
      amount: orderOptions.amount
    });

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    console.log('Razorpay order created:', razorpayOrder.id);

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        exam_id: plan.exam_id,
        amount_in_paise: amount,
        currency: 'INR',
        status: 'created',
        provider: 'razorpay',
        provider_order_id: razorpayOrder.id,
        idempotency_key: `order_${razorpayOrder.id}`,
        net_amount_in_paise: amount,
        metadata: {
          plan_name: plan.name,
          billing_interval: plan.billing_interval,
          user_email: user.email
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the whole process if DB save fails
      console.warn('Payment created in Razorpay but failed to save in DB');
    }

    // Log payment event
    if (payment) {
      await supabase
        .from('payment_events')
        .insert({
          payment_id: payment.id,
          event_type: 'order_created',
          payload: {
            razorpay_order_id: razorpayOrder.id,
            amount: amount,
            currency: 'INR'
          }
        });
    }

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      payment_id: payment?.id || null
    });

  } catch (error) {
    console.error('Error creating order:', error);
    
    // More detailed error logging
    if (error.error) {
      console.error('Razorpay API Error:', {
        code: error.error.code,
        description: error.error.description,
        field: error.error.field,
        source: error.error.source,
        step: error.error.step,
        reason: error.error.reason,
        metadata: error.error.metadata
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create payment order',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        fullError: error
      } : undefined
    });
  }
}