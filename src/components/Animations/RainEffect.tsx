import React, { useEffect, useState } from "react";

interface Drop {
  left: number;
  delay: number;
  duration: number;
}

const RainEffect = () => {
  const [drops, setDrops] = useState<Drop[]>([]);

  useEffect(() => {
    const generateRain = () => {
      let newDrops = [];
      for (let i = 0; i < 50; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 1;
        const duration = 0.5 + Math.random();
        newDrops.push({ left, delay, duration });
      }
      setDrops(newDrops);
    };

    generateRain();
  }, []);

  return (
    <div 
      className="absolute pointer-events-none overflow-hidden" 
      style={{ 
        top: "64px", // Výška navigačnej lišty
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {drops.map((drop, index) => (
        <div
          key={index}
          className="absolute w-[2px] h-16 bg-white opacity-50"
          style={{
            left: `${drop.left}%`,
            animation: `drop ${drop.duration}s linear ${drop.delay}s infinite`,
          }}
        ></div>
      ))}
      <style>{`
        @keyframes drop {
          0% { transform: translateY(-100%); opacity: 1; }
          75% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RainEffect;
