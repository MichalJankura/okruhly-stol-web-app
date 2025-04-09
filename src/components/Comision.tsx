import React from 'react';

export default function Comision() {
  const timelineData = [
    {
      side: 'left',
      title: '1. Historická komisia',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Mgr. Alexander Hričko</li>
          <li>členovia komisie</li>
        </ul>
      ),
    },
    {
      side: 'right',
      title: '2. Kultúrna komisia',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Ing. Peter Štefaňák, PhD.</li>
          <li>členovia komisie</li>
          <li>oblasť tradičnej ľudovej kultúry</li>
          <li>oblasť profesionálneho umenia – divadelné, tanečné</li>
          <li>oblasť pre múzeá</li>
        </ul>
      ),
    },
    {
      side: 'left',
      title: '3. Komisia pre oblasť samosprávy a regionálneho rozvoja',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Michal Sekerák</li>
          <li>členovia komisie</li>
        </ul>
      ),
    },
    {
      side: 'right',
      title: '4. Legislatívna komisia',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Mgr. Jozef Badida</li>
          <li>členovia komisie</li>
        </ul>
      ),
    },
    {
      side: 'left',
      title: '5. Komisia pre oblasť školstva a jazyka',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Mgr. Kvetoslava Koporová</li>
          <li>členovia komisie</li>
          <li>
            zlúčená s jazykovou komisiou zriadenou pri Inštitúte rusínskeho
            jazyka
          </li>
        </ul>
      ),
    },
    {
      side: 'right',
      title: '6. Komisia pre cirkevnú oblasť',
      text: (
        <ul className="list-disc pl-5 text-left">
          <li>koordinátor – Mgr. Igor Pančák</li>
          <li>členovia komisie</li>
        </ul>
      ),
    },
  ];

  // useEffect(() => {
  //   const handleScroll = () => {
  //     const elements = document.querySelectorAll('.animate-on-scroll');
  //     elements.forEach((element) => {
  //       const rect = element.getBoundingClientRect();
  //       if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
  //         element.classList.add('animate-slide-up');
  //       } else {
  //         element.classList.remove('animate-slide-up');
  //       }
  //     });
  //   };

  //   window.addEventListener('scroll', handleScroll);
  //   return () => window.removeEventListener('scroll', handleScroll);
  // }, []);

  return (
    <div
      className="relative bg-cover bg-center py-16"
      style={{ backgroundImage: "url('/assets/images/komisia.jpg')" }}
      id="komisie"
    >
      {/* Add a dark overlay to improve text readability over the background image */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <div className="container mx-auto max-w-4xl px-4 animate-fade-in relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mt-2 text-5xl font-semibold tracking-wide text-white sm:text-6xl">
            Odborní garanti a zriadené komisie
          </p>
        </div>
        <div className="flex flex-col md:grid grid-cols-9 mx-auto p-2 text-blue-50">
          {timelineData.map((item, index) => (
            <div
              key={index}
              className={`flex ${
                item.side === 'right'
                  ? 'md:contents'
                  : 'flex-row-reverse md:contents'
              } animate-on-scroll`}
              style={{ animationDelay: `${index * 2}s` }}
            >
              {item.side === 'right' && (
                <div className="col-start-5 col-end-6 mr-10 md:mx-auto relative">
                  <div className="h-full w-6 flex items-center justify-center">
                    <div className="h-full w-1 bg-yellow-500 pointer-events-none"></div>
                  </div>
                  <div className="w-6 h-6 absolute top-1/2 -mt-3 rounded-full bg-yellow-500 shadow"></div>
                </div>
              )}
              <div
                className={`p-4 rounded-xl my-4 shadow-md hover:bg-opacity-75 transition-colors duration-300 ${
                  item.side === 'right'
                    ? 'bg-yellow-500/90 col-start-6 col-end-10 mr-auto backdrop-blur-sm'
                    : 'bg-blue-500/90 col-start-1 col-end-5 ml-auto backdrop-blur-sm'
                }`}
              >
                <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                <div className="leading-tight text-justify">{item.text}</div>
              </div>
              {item.side === 'left' && (
                <div className="col-start-5 col-end-6 md:mx-auto relative mr-10">
                  <div className="h-full w-6 flex items-center justify-center">
                    <div className="h-full w-1 bg-blue-800 pointer-events-none"></div>
                  </div>
                  <div className="w-6 h-6 absolute top-1/2 -mt-3 rounded-full bg-blue-500 shadow"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
