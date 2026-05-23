"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Wallet, X } from "lucide-react";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount?: number;
  availableBalance?: number;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  isOpen,
  onClose,
  requiredAmount,
  availableBalance,
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Background Pattern */}
        <div className="bg-[#075E54] p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 p-3 rounded-full mb-4 ring-4 ring-white/10">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Insufficient Balance</h2>
            <p className="text-white/80 text-sm mt-1">Transaction could not be processed</p>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6 text-center">
            <p className="text-gray-600 leading-relaxed">
              You don't have enough funds in your wallet to complete this request. 
              Please recharge your account to continue sending messages.
            </p>

            {(availableBalance !== undefined || requiredAmount !== undefined) && (
              <div className="bg-gray-50 rounded-xl p-4 flex justify-around border border-gray-100">
                {availableBalance !== undefined && (
                  <div className="text-center">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Available</span>
                    <span className="text-lg font-bold text-gray-700">₹{availableBalance.toFixed(2)}</span>
                  </div>
                )}
                <div className="w-[1px] h-10 bg-gray-200"></div>
                {requiredAmount !== undefined && (
                  <div className="text-center">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Required</span>
                    <span className="text-lg font-bold text-red-500">₹{requiredAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  router.push("/payments");
                  onClose();
                }}
                className="w-full bg-[#075E54] hover:bg-[#065A4C] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#075E54]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Recharge Wallet Now
              </button>
              
              <button
                onClick={onClose}
                className="w-full bg-white hover:bg-gray-50 text-gray-500 font-semibold py-3 rounded-xl border border-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium">
            SECURED WALLET SYSTEM • WHATSAPP BULK SOLUTIONS
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsufficientBalanceModal;
