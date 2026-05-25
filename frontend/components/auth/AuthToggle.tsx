"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AuthToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSignIn = pathname.includes("sign-in");

  if (!mounted) {
    return <div className="flex justify-center mb-10 h-[70px]" />; // Placeholder to avoid layout shift
  }

  return (
    <div className="flex justify-center mb-10">
      <div className="relative flex p-1.5 bg-gray-100 border-2 border-[#1AD263]/30 rounded-2xl w-full max-w-[420px]">
        <div
          className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#075E54] rounded-xl transition-all duration-300 ease-in-out shadow-lg ${isSignIn ? 'translate-x-full' : 'translate-x-0'
            }`}
        />

        <button
          type="button"
          onClick={() => router.push("/auth/sign-up")}
          className={`relative z-10 w-1/2 py-3.5 font-bold text-[16px] transition-colors duration-300 ${!isSignIn ? 'text-white' : 'text-gray-500'
            }`}
        >
          Sign Up
        </button>

        <button
          type="button"
          onClick={() => router.push("/auth/sign-in")}
          className={`relative z-10 w-1/2 py-3.5 font-bold text-[16px] transition-colors duration-300 ${isSignIn ? 'text-white' : 'text-gray-500'
            }`}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}