import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SimpleBlog from './components/SimpleBlog';
import MainHero from './components/MainHero';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BlogDetail from './pages/BlogDetail';

const App = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<MainHero />} />
            <Route path="/blog" element={<SimpleBlog />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App; 