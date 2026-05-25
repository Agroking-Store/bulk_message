import { useState } from "react";
import { Eye, EyeOff, Facebook, Linkedin, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useUser } from "@/lib/context/UserContext";
import ForgotPasswordModal from "../ForgotPasswordModal";

import { apiFetch } from "@/lib/api";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const router = useRouter();
  const { refreshUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await authApi.login({ email, password });
      localStorage.setItem("access_token", access_token);
      
      // Force refresh user context immediately after setting token
      if (typeof window !== 'undefined' && (window as any).refreshUserContext) {
        await (window as any).refreshUserContext();
      } else {
        // Fallback to context refresh
        await refreshUser();
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      // Show generic error message for any authentication failure
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="group">
        <label className="block text-[15px] font-bold text-black mb-2 ml-1 transition-colors group-focus-within:text-[#075E54]">
          Email Address
        </label>
        <input
          required
          type="email"
          placeholder="rahulkumar54@gmail.com"
          className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-[15px] font-medium text-gray-700 outline-none transition-all bg-white hover:border-[#075E54]/30 focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/5 shadow-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password Field */}
      <div className="group relative">
        <div className="flex justify-between items-center mb-2 px-1">
          <label className="text-[15px] font-bold text-black transition-colors group-focus-within:text-[#075E54]">
            Password
          </label>
          <button 
            type="button" 
            onClick={() => setIsForgotModalOpen(true)}
            className="text-[13px] font-black text-[#075E54] hover:underline transition-all"
          >
            Forgot Password?
          </button>
        </div>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-[15px] font-medium text-gray-700 outline-none transition-all bg-white hover:border-[#075E54]/30 focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/5 shadow-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075E54] transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

{/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          disabled={loading}
          type="submit"
          className="w-full max-w-[420px] bg-[#1AD263] text-black font-black py-4 rounded-2xl shadow-xl text-[16px] tracking-wide active:scale-[0.97] hover:bg-[#15b354] transition-all h-[58px] flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
        </button>
      </div>
    </form>
    
    <ForgotPasswordModal 
      isOpen={isForgotModalOpen} 
      onClose={() => setIsForgotModalOpen(false)} 
    />
    </>
  );
}
