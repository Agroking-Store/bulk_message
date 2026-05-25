import Image from "next/image";

export default function ImageSection() {
  return (
    <div 
      className="fixed top-0 left-0 hidden md:block w-[58%] h-screen bg-black z-10 shadow-2xl"
      style={{
        clipPath: 'polygon(0 0, 92% 0, 62% 100%, 0% 100%)',
        borderRight: '12px solid #075E54', 
      }}
    >
      <div className="relative w-full h-full overflow-hidden">
        <div 
          className="absolute transition-all duration-500 ease-in-out"
          style={{
            width: '160%', 
            height: '165%',
            left: '-40%', 
            top: '-36%', 
            transform: 'rotate(20.57deg)',
            transformOrigin: 'center center'
          }}
        >
          <Image
            src="/sign-up.png" 
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