import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", agree: true });
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) {
      setError("Please agree to the Terms & Privacy Policy");
      return;
    }

    // Email validation
    if (!formData.email.endsWith("@gmail.com")) {
      setError("Only gmail.com emails are allowed");
      return;
    }
    if (/[A-Z]/.test(formData.email)) {
      setError("Email must be in lowercase only");
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&#)");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await authApi.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      router.push("/auth/sign-in");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <div className="min-h-[400px]" />; // Placeholder
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Full Name Field */}
      <div className="group">
        <label className="block text-[15px] font-bold text-black mb-2 ml-1">Full Name</label>
        <input
          required
          type="text"
          placeholder="Rahul Kumar"
          className="w-full border-2 border-[#075E54]/10 rounded-2xl px-5 py-4 text-[15px] font-medium text-gray-700 focus:outline-none focus:border-[#075E54] focus:ring-8 focus:ring-[#075E54]/5 bg-white transition-all shadow-sm hover:border-[#075E54]/30"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Email Field */}
      <div className="group">
        <label className="block text-[15px] font-bold text-black mb-2 ml-1">Email Address</label>
        <input
          required
          type="email"
          placeholder="rahulkumar54@gmail.com"
          className="w-full border-2 border-[#075E54]/10 rounded-2xl px-5 py-4 text-[15px] font-medium text-gray-700 focus:outline-none focus:border-[#075E54] focus:ring-8 focus:ring-[#075E54]/5 bg-white transition-all shadow-sm hover:border-[#075E54]/30"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      {/* Password Field */}
      <div className="group relative">
        <label className="block text-[15px] font-bold text-black mb-2 ml-1">Create Password</label>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full border-2 border-[#075E54]/10 rounded-2xl px-5 py-4 text-[15px] font-medium text-gray-700 focus:outline-none focus:border-[#075E54] focus:ring-8 focus:ring-[#075E54]/5 bg-white transition-all shadow-sm hover:border-[#075E54]/30"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
      <div className="flex items-center space-x-3 pt-1 ml-1">
        <input
          type="checkbox"
          id="terms"
          className="w-5 h-5 accent-[#075E54] cursor-pointer rounded-lg"
          checked={formData.agree}
          onChange={() => setFormData({ ...formData, agree: !formData.agree })}
        />
        <label htmlFor="terms" className="text-[14px] font-semibold text-gray-600 cursor-pointer select-none">
  I agree to the{" "}
  <a
    href="/Terms_And_Conditions.pdf"
    target="_blank"
    className="text-[#075E54] hover:underline font-bold"
  >
    Terms & Conditions
  </a>{" "}
  &{" "}
  <a
    href="/Privacy Policy.pdf"
    target="_blank"
    className="text-[#075E54] hover:underline font-bold"
  >
    Privacy Policy
  </a>
</label>
      </div>
      <div className="flex flex-col items-center space-y-4 pt-4">
        <button
          disabled={loading}
          type="submit"
          className="w-full max-w-[420px] bg-[#1AD263] text-black font-black py-4.5 rounded-2xl shadow-xl text-[16px] tracking-wide active:scale-[0.97] transition-all hover:bg-[#15b354] h-[60px] uppercase flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Get Started"}
        </button>
        <p className="text-[15px] font-semibold text-gray-500">
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-[#075E54] font-black hover:underline underline-offset-4 transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </form>
  );
}
