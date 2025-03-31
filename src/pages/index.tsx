import React from 'react';

import BlogCardGrid from '../components/BlogCardGrid';
import Comision from '../components/Comision';
import Contact from '../components/Contact';
import LazyShow from '../components/LazyShow';
import MainHero from '../components/MainHero';
import Membership from '../components/Membership';
import Team from '../components/Team';
import Navbar from '../components/Navbar';
import SimpleBlog from '../components/SimpleBlog';
import MainHeroImage from '../components/MainHeroImage';

const App = () => {
  return (
    <div className={`bg-gradient-to-br from-slate-50 to-slate-100 grid gap-y-0 overflow-hidden`}>
      <Navbar />
      <div className={`relative bg-background`}>
      <MainHero />
        <div className="max-w-7xl mx-auto">
        <MainHeroImage />
        </div>
      </div>
      
      <LazyShow>
        <>
        
        
        </>
      </LazyShow>
      
      <LazyShow>
        <>
          <SimpleBlog />
        </>
      </LazyShow>
      
      <LazyShow>
        <>
          <BlogCardGrid />
        </>
      </LazyShow>
      {/* <LazyShow>
        <>
          <Gallery />
        </>
      </LazyShow> */}
      <LazyShow>
        <>
          {/* <Features /> */}
          <Membership />
        </>
      </LazyShow>
      <LazyShow>
        <>
          {/* <Features /> */}
          <Comision />
        </>
      </LazyShow>

      <LazyShow>
        <>
        <Team />
        </>
      </LazyShow>
      <LazyShow>
        <>
        <Contact />
        </>
      </LazyShow>
      {/* <Analytics /> */}
    </div>
  );
};
export default App;
