import React, { useState, useEffect } from "react";
import { FaUsers, FaCalendarAlt, FaClock } from "react-icons/fa";
import Login from "./Registration/Login";
import Register from "./Registration/Register";
import { eventEmitter } from '../utils/events';

const MainHero = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for token on component mount
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    // Initial check
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
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

  const handleClose = () => {
    setShowLogin(false);
  };

  const stats = [
    { id: 1, number: "1000+", label: "Total Members", icon: <FaUsers /> },
    { id: 2, number: "15", label: "Years Active", icon: <FaClock /> },
    { id: 3, number: "500+", label: "Events Hosted", icon: <FaCalendarAlt /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Column */}
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight">
              OKRÚHLY STÔL RUSÍNOV <br /> SLOVENSKA
            </h1>

            <div className="relative w-48 h-48 mx-auto lg:mx-0">
              <img
                src="../assets/images/osrs_clean.png"
                alt="Company Logo"
                className="rounded-full w-full h-full object-cover transform transition-transform hover:scale-105"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat) => (
                <div key={stat.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center text-indigo-600 mb-3 text-2xl">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 text-center mb-1">{stat.number}</div>
                  <div className="text-sm text-slate-500 text-center">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {!isLoggedIn && (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  Prihlásiť sa
                </button>
              )}
              <button className="px-8 py-3 bg-emerald-600 text-white rounded-lg shadow-lg hover:bg-emerald-700 transition-colors font-semibold">
                Prezrieť udalosti
              </button>
            </div>
          </div>

          {/* Right Column with Parallelogram */}
          <div className="flex-1 relative h-[700px] w-full overflow-hidden ml-auto">
            <div className="absolute top-0 right-0 bottom-0 left-0 transform skew-x-[-12deg] translate-x-20 overflow-hidden">
            </div>
          </div>
        </div>
      </div>

      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800 shadow-lg z-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login onRegisterClick={handleRegisterClick} onClose={handleClose} />
          </div>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowRegister(false)}
              className="absolute -top-4 -right-4 bg-white rounded-full p-2 text-gray-600 hover:text-gray-800 shadow-lg z-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Register onLoginClick={handleLoginClick} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MainHero;
