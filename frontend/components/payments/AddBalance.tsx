"use client";

import { useState } from "react";
import Script from "next/script";
import { apiFetch } from "@/lib/api";

export default function AddBalance({ serviceType, setServiceType }: any) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on backend
      console.log("Creating order for amount:", numAmount);
      const orderRes = await apiFetch("/payments/order", {
        method: "POST",
        body: JSON.stringify({ amount: numAmount, serviceType }),
      });

      console.log("Order Response Status:", orderRes.status);

      const order = orderRes.data;
      console.log("Order Created Successfully:", order);

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: `${serviceType === 'whatsapp' ? 'WhatsApp' : 'Email'} Bulk Messaging`,
        description: `${serviceType === 'whatsapp' ? 'WhatsApp' : 'Email'} Wallet Recharge`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify payment on backend
          const verifyRes = await apiFetch("/payments/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.status === 'success') {
            alert("Payment Successful! Your wallet has been credited.");
            setAmount("");
            // Trigger balance refresh in Topbar without page reload
            window.dispatchEvent(new Event('walletUpdated'));
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
      };

      console.log("Razorpay Options:", { ...options, key: "HIDDEN_FOR_LOGS" });
      console.log("Razorpay Key ID used:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

      if (typeof (window as any).Razorpay === 'undefined') {
        console.error("Razorpay SDK not loaded yet!");
        alert("Payment gateway is still loading. Please wait a moment.");
        return;
      }

      console.log("Opening Razorpay Checkout...");
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => console.log("Razorpay Script Loaded Successfully")}
        onError={(e) => console.error("Razorpay Script Load Error:", e)}
      />

      <h2 className="font-semibold text-gray-700 mb-2">
        Add Balance
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div 
          onClick={() => setServiceType('whatsapp')}
          className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex items-center justify-center ${
            serviceType === 'whatsapp' 
              ? 'border-[#1f6f5f] bg-[#1f6f5f]/5 shadow-md scale-105' 
              : 'border-gray-100 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <span className={`font-bold text-lg ${serviceType === 'whatsapp' ? 'text-[#1f6f5f]' : 'text-gray-500'}`}>WhatsApp</span>
        </div>

        <div 
          onClick={() => setServiceType('email')}
          className={`cursor-pointer p-5 rounded-xl border-2 transition-all flex items-center justify-center ${
            serviceType === 'email' 
              ? 'border-[#1f6f5f] bg-[#1f6f5f]/5 shadow-md scale-105' 
              : 'border-gray-100 bg-gray-50 hover:border-gray-300'
          }`}
        >
          <span className={`font-bold text-lg ${serviceType === 'email' ? 'text-[#1f6f5f]' : 'text-gray-500'}`}>Email</span>
        </div>
      </div>

      <input
        type="text"
        placeholder="Enter amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#1f6f5f] text-lg"
      />

      <p className="text-sm font-medium mb-2 text-gray-700">
        Quick selection
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[200, 500, 1000, 2000].map(val => (
          <button
            key={val}
            onClick={() => setAmount(val.toString())}
            className="text-xs py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
          >
            ₹ {val}
          </button>
        ))}
      </div>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-[#1f6f5f] hover:bg-[#185a4d] text-white py-2 rounded-md disabled:bg-gray-400"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>

      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Secured by Razorpay. Sandbox mode.
      </p>
    </div>
  );
}