"use client";
import Image from "next/image";

export default function ImageSection() {
  return (
    <div 
      className="fixed top-0 left-0 hidden md:block w-[58%] h-screen bg-[#075E54] z-10 shadow-2xl"
      style={{
        // Slanted shape logic
        clipPath: 'polygon(0 0, 92% 0, 62% 100%, 0% 100%)',
        // WhatsApp green divider line
        borderRight: '12px solid #06584e', 
      }}
    >
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="absolute transition-all duration-500 ease-in-out"
          style={{
            width: '180%', 
            height: '200%',
            left: '-55%', 
            top: '-55%', 
            transform: 'rotate(20.57deg)',
            transformOrigin: 'center center'
          }}
        >
          <Image
            src="/sign-in.png" 
            alt="WhatsApp UI"
            fill
            className="object-contain" 
            priority
          />
        </div>
      </div>
    </div>
  );
}