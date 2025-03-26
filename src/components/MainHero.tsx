import React, { useState, useEffect } from "react";
import Login from "./Registration/Login";
import Register from "./Registration/Register";
// import RainEffect from "./Animations/RainEffect";
// import FallingLeaves from "./Animations/FallingLeaves";
import RainEffect from "./Animations/RainEffect";
import RotatingText from "./Animations/FlopingText";
import { eventEmitter } from '../utils/events';

const MainHero = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Listen for auth changes
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    const unsubscribe = eventEmitter.subscribe('authChange', handleAuthChange);

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleRegisterClick = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleLoginClick = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  return (
    
    <>
      <div
        className="bg-gray-900 min-h-screen flex items-start pt-20 relative"
        style={{
          backgroundImage: "url('../assets/images/background.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <RainEffect />
        {/* <FallingLeaves /> */}
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 lg:w-2/3 md:pr-12">
                <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-bold mb-6">
                <span className="text-[rgb(0,85,161)]"> OKRÚHLY STÔL </span><br className="hidden md:block" />
                <span className="text-red-500">RUSÍNOV </span><br className="hidden md:block" />
                <span className="text-black">SLOVENSKA</span><br className="hidden md:block" />
                </h1>
              <div className="py-20 sm:py-4 bg-indigo-500 rounded-lg">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                      <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl h-14 flex items-center justify-center">
                        <RotatingText words={["44 million", "45 million", "46 million"]} />
                      </dd>
                      <dt className="text-base/7 text-white">Transactions every 24 hours</dt>
                    </div>
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                      <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl h-14 flex items-center justify-center">
                        <RotatingText words={["$119 trillion", "$120 trillion", "$121 trillion"]} />
                      </dd>
                      <dt className="text-base/7 text-white">Assets under holding</dt>
                    </div>
                    <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                      <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl h-14 flex items-center justify-center">
                        <RotatingText words={["46,000", "47,000", "48,000"]} />
                      </dd>
                      <dt className="text-base/7 text-white">Počet členov</dt>
                    </div>
                  </dl>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="flex gap-5 sm:py-20 lg:py-20">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-md"
                  >
                    Prihlásiť sa
                  </button>
                </div>
              )}
            </div>
            <div className="md:w-1/2 lg:w-1/3 mt-8 md:mt-0 md:pl-12">
              <img
                src="../assets/images/osrs.png"
                alt="Hero Image"  
              />
            </div>
          </div>
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login onRegisterClick={handleRegisterClick} onClose={handleCloseLogin} />
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowRegister(false)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800 shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Register onLoginClick={handleLoginClick} />
          </div>
        </div>
      )}
    </>
  );
};

export default MainHero;
