import crypto from "crypto";
import { supabase } from "../../../lib/supabase";

export const config = {
  api: {
    bodyParser: false, // IMPORTANT: raw body chahiye signature verify ke liye
  },
};

const getRawBody = async (req) =>
  await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // 1️⃣ RAW BODY BUFFER LENA HOGA
  const rawBody = await getRawBody(req);

  // 2️⃣ RAZORPAY SIGNATURE VERIFY KARO
  const receivedSignature = req.headers["x-razorpay-signature"];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (receivedSignature !== expectedSignature) {
    console.log("❌ Webhook Signature Mismatch (Possible Fraud)");
    return res.status(400).json({ status: "invalid signature" });
  }

  // 3️⃣ JSON body parse
  const webhookData = JSON.parse(rawBody);
  const event = webhookData.event;

  console.log("✅ Webhook verified:", event);

  // PAYMENT CAPTURED
  if (event === "payment.captured") {
    const payment = webhookData.payload.payment.entity;

    const paymentId = payment.id;
    const orderId = payment.order_id;
    const amount = payment.amount; // paise me hota hai
    const email = payment.email;

    // ⚡ Fetch the order from your DB
    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (!orderData) {
      console.log("⚠️ Order not found in DB");
      return res.status(200).json({ message: "Order missing" });
    }

    const userId = orderData.user_id;

    // 4️⃣ UPDATE PAYMENT AS SUCCESS IN DB
    await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        razorpay_payment_id: paymentId,
        amount_paid: amount / 100,
        updated_at: new Date(),
      })
      .eq("order_id", orderId);

    // 5️⃣ ACTIVATE SUBSCRIPTION
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: orderData.plan_id,
      chapter_id: orderData.chapter_id || null,
      subject_id: orderData.subject_id || null,
      exam_id: orderData.exam_id || null,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log("🎉 Subscription Activated for user:", userId);

    // 6️⃣ OPTIONAL: Update referral
    if (orderData.referral_user_id) {
      await supabase.rpc("increment_referral_count", {
        r_user: orderData.referral_user_id,
      });
      console.log("👥 Referral incremented");
    }

    // 7️⃣ RESPOND OK
    return res.status(200).json({ status: "success" });
  }

  // PAYMENT FAILED
  if (event === "payment.failed") {
    const payment = webhookData.payload.payment.entity;

    await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        updated_at: new Date(),
      })
      .eq("order_id", payment.order_id);

    console.log("❌ Payment Failed Updated in DB");

    return res.status(200).json({ status: "failed updated" });
  }

  // OTHER EVENTS
  console.log("ℹ️ Unhandled event:", event);
  return res.status(200).json({ status: "ignored" });
}
