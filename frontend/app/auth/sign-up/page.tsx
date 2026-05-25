"use client";

import { motion, AnimatePresence } from "framer-motion";
import ImageSection from "@/components/auth/sign-up/ImageSection";
import SignupForm from "@/components/auth/sign-up/SignupForm";
import AuthToggle from "@/components/auth/AuthToggle";

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden relative font-roboto">
      <ImageSection />
      
      <div className="w-full md:w-[50%] ml-auto flex flex-col justify-center items-center pr-10 md:pr-24 py-10 bg-white">
        <div className="w-full max-w-[500px]"> 
          <AnimatePresence mode="wait">
            <motion.div 
              key="signup-content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }} 
            >
              <header className="mb-10 text-left">
                <h1 className="text-[24px] sm:text-[30px] md:text-[34px] font-black text-black leading-tight tracking-tight whitespace-nowrap">
                  Welcome to <span className="text-[#075E54]">WhatsApp Bulk Messaging</span>
                </h1>
                <p className="text-[16px] md:text-[18px] text-gray-500 font-medium mt-3">
                  Send Bulk Messages Easily and Instantly.
                </p>
              </header>

              <div className="mb-8 w-full">
                <AuthToggle />
              </div>
              
              <div className="w-full">
                 <SignupForm />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}