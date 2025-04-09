import React, { useState, useEffect } from 'react';

const MainHeroImage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const backgroundImages = ["titulna fotka.jpg","tanec.jpeg" , "topánky.jpg"];

  useEffect(() => {
    // Slideshow efekt
    const intervalId = setInterval(() => {
      // Začiatok prechodu
      setIsTransitioning(true);
      
      // Po 500ms zmeň obrázok a reštartuj animáciu
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        setIsTransitioning(false);
      }, 1000);
    }, 7000);

    // Cleanup interval pri odmontovaní komponenty
    return () => clearInterval(intervalId);
  }, []);

  const imageUrl = `../assets/images/${backgroundImages[currentImageIndex]}`;

  return (
    <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 skew-x-[-10deg] translate-x-20 overflow-hidden">
      <div className="relative w-full h-full">
        <img
          className={`h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full 
                    absolute inset-0 transition-all duration-500
                    ${isTransitioning ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}
          src={imageUrl}
          alt="slideshow image"
        />
      </div>
    </div>
  );
};

export default MainHeroImage;
