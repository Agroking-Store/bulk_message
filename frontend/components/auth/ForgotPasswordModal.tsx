import { useState } from "react";
import { Mail, Key, ShieldCheck, Loader2, X, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api/auth";

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset states on exit
    setStep("email");
    setEmail("");
    setOtp("");
    setNewPassword("");
    setResetToken("");
    setError(null);
    setSuccess(null);
    onClose();
  };

  const validatePasswordStrength = (password: string) => {
    return /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(password) && password.length >= 8;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only @gmail.com addresses are supported right now.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword({ email });
      setSuccess("If the email exists, a reset code has been sent.");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await authApi.verifyOtp({ email, otp });
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep("reset");
      } else {
        setError("Invalid response from server.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordStrength(newPassword)) {
      setError(
        "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number or special character."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ email, resetToken, newPassword });
      setSuccess("Your password has been changed successfully!");
      // Briefly show success before closing and redirecting to login
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] w-full max-w-md p-8 relative shadow-2xl relative overflow-hidden transition-all">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-800 transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="bg-[#075E54]/10 w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4">
            {step === "email" && <Mail className="text-[#075E54]" size={32} />}
            {step === "otp" && <Key className="text-[#075E54]" size={32} />}
            {step === "reset" && <ShieldCheck className="text-[#075E54]" size={32} />}
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {step === "email" && "Forgot Password?"}
            {step === "otp" && "Verify OTP"}
            {step === "reset" && "Create New Password"}
          </h2>
          <p className="text-gray-500 font-medium mt-2 text-sm px-2">
            {step === "email" && "Enter your registered email address and we'll send you a 6-digit verification code."}
            {step === "otp" && `We've sent a 6-digit code to ${email}. The code expires in 15 minutes.`}
            {step === "reset" && "Please create a strong, new password that you haven't used before."}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold border border-red-100/50">
            {error}
          </div>
        )}

        {success && step === "otp" && (
          <div className="mb-6 bg-green-50 text-green-600 p-3 rounded-xl text-sm font-semibold border border-green-100/50">
            {success}
          </div>
        )}

        {/* --- STEP 1: EMAIL INPUT --- */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[14px] font-bold text-gray-800 mb-2 ml-1 transition-colors group-focus-within:text-[#075E54]">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="you@company.com"
                className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-[15px] font-medium text-gray-700 outline-none transition-all bg-white hover:border-[#075E54]/30 focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/5 shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={loading || !email}
              type="submit"
              className="w-full bg-[#1AD263] text-black font-black py-4 rounded-2xl shadow-xl shadow-[#1AD263]/20 text-[16px] tracking-wide active:scale-[0.98] hover:bg-[#15b354] transition-all h-[56px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* --- STEP 2: OTP INPUT --- */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-[14px] font-bold text-gray-800 mb-2 ml-1 transition-colors group-focus-within:text-[#075E54]">
                6-Digit Code
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-[24px] tracking-[0.5em] text-center font-bold text-gray-800 outline-none transition-all bg-white hover:border-[#075E54]/30 focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/5 shadow-sm uppercase"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <button
              disabled={loading || otp.length < 6}
              type="submit"
              className="w-full bg-[#1AD263] text-black font-black py-4 rounded-2xl shadow-xl shadow-[#1AD263]/20 text-[16px] tracking-wide active:scale-[0.98] hover:bg-[#15b354] transition-all h-[56px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify Code"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleEmailSubmit}
                disabled={loading}
                className="text-[13px] font-bold text-gray-500 hover:text-[#075E54] transition-colors"
              >
                Didn't receive a code? Resend
              </button>
            </div>
          </form>
        )}

        {/* --- STEP 3: RESET PASSWORD INPUT --- */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-6">
            {success ? (
              <div className="flex flex-col items-center py-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-[#1AD263]/20 rounded-full flex items-center justify-center mb-4 text-[#1AD263]">
                  <ShieldCheck size={36} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Success!</h3>
                <p className="text-gray-500 font-medium">Your password has been reset.</p>
              </div>
            ) : (
              <>
                <div className="group relative">
                  <label className="block text-[14px] font-bold text-gray-800 mb-2 ml-1 transition-colors group-focus-within:text-[#075E54]">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full border-2 border-gray-100 rounded-2xl px-5 py-3.5 text-[15px] font-medium text-gray-700 outline-none transition-all bg-white hover:border-[#075E54]/30 focus:border-[#075E54] focus:ring-4 focus:ring-[#075E54]/5 shadow-sm pr-12"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#075E54] transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-400 mt-2 font-medium ml-1">
                    Must be at least 8 chars, 1 uppercase, 1 lowercase and 1 number/symbol.
                  </p>
                </div>

                <button
                  disabled={loading || !newPassword}
                  type="submit"
                  className="w-full bg-[#1AD263] text-black font-black py-4 rounded-2xl shadow-xl shadow-[#1AD263]/20 text-[16px] tracking-wide active:scale-[0.98] hover:bg-[#15b354] transition-all h-[56px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
