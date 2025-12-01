import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
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
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription for this plan' 
      });
    }

    // Create Razorpay order
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const orderOptions = {
      amount: amount, // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${user.id.slice(0, 8)}`,
      notes: {
        plan_id: plan_id,
        user_id: user.id,
        plan_name: plan.name
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

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
        net_amount_in_paise: amount
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ error: 'Failed to create payment record' });
    }

    // Log payment event
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

    res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      payment_id: payment.id
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}