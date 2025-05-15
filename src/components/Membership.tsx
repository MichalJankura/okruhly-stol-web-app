export default function Membership() {
  const handleClick = (fileName: string) => {
    const filePath = `/assets/documents/${fileName}`;
    window.open(filePath, '_blank');
  };

  return (
    <div
      className="relative isolate px-6 py-10 sm:py-32 lg:px-8 animate-fade-in bg-cover bg-center min-h-screen"
      style={{
        backgroundImage: "url('/assets/images/topánky.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
      id="features"
    >
      {/* Add a dark overlay to improve text readability over the image */}
      <div className="absolute inset-0 bg-black opacity-60 z-[-5]"></div>
      <div
        className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl"
        aria-hidden="true"
      ></div>
      <div className="mx-auto max-w-4xl text-center relative z-10">
        <p className="mt-2 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
          Staňte sa členom ešte dnes
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-6 sm:mt-20 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {/* Hobby Plan */}
        <div className="rounded-3xl bg-white/80 p-8 ring-1 ring-gray-900/10 sm:p-10 animate-slide-up backdrop-blur-sm h-auto">
          <h3 className="text-base text-center font-semibold text-indigo-600">
            Individuálny člen
          </h3>
          <div className="mt-6 flex justify-center">
            <img
              src="/assets/images/use.png"
              alt="Individuálny člen"
              className="h-48 w-auto object-contain"
            />
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleClick('zz-prihlaska-individualny-clen.doc');
            }}
            className="mt-8 block rounded-md text-center text-sm font-semibold text-white relative overflow-hidden bg-indigo-500 px-3.5 py-2.5 transition-all before:absolute before:h-0 before:w-0 before:rounded-full before:bg-indigo-600 before:duration-500 before:ease-out hover:shadow-lg hover:before:h-56 hover:before:w-56"
            style={{ textDecoration: 'none' }}
          >
            <span className="relative z-10">Vyplniť prihlášku</span>
          </a>
        </div>
        {/* Kolektivny clen */}
        <div className="rounded-3xl bg-yellow-400/90   p-8 ring-1 shadow-2xl ring-gray-900/10 sm:p-10 animate-slide-up backdrop-blur-sm h-auto">
          <h3 className="text-base text-center font-semibold text-black">
            Kolektívny člen
          </h3>
          <div className="mt-6 flex justify-center">
            <img
              src="/assets/images/group.svg"
              alt="Individuálny člen"
              className="h-48 w-auto object-contain"
            />
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleClick('zz-prihlaska-kolektivny-clen.doc');
            }}
            className="mt-8 block rounded-md text-center text-sm font-semibold text-white relative overflow-hidden bg-indigo-500 px-3.5 py-2.5 transition-all before:absolute before:h-0 before:w-0 before:rounded-full before:bg-indigo-600 before:duration-500 before:ease-out hover:shadow-lg hover:before:h-56 hover:before:w-56"
            style={{ textDecoration: 'none' }}
          >
            <span className="relative z-10">Vyplniť prihlášku</span>
          </a>
        </div>

        {/* Rokovací poraidok */}
        <div className="rounded-3xl bg-white/80 p-8 ring-1 ring-gray-900/10 sm:p-10 animate-slide-up backdrop-blur-sm h-auto">
          <h3 className="text-base text-center font-semibold text-black">
            Rokovací poriadok
          </h3>
          <div className="mt-6 flex justify-center">
            <img
              src="/assets/images/policy.svg"
              alt="Individuálny člen"
              className="h-48 w-auto object-contain"
            />
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleClick('Stanovy-OSRS_po_zminach-1.pdf');
            }}
            className="mt-8 block rounded-md text-center text-sm font-semibold text-white relative overflow-hidden bg-indigo-500 px-3.5 py-2.5 transition-all before:absolute before:h-0 before:w-0 before:rounded-full before:bg-indigo-600 before:duration-500 before:ease-out hover:shadow-lg hover:before:h-56 hover:before:w-56"
            style={{ textDecoration: 'none' }}
          >
            <span className="relative z-10">Stiahnuť Rokovací poriadok</span>
          </a>
        </div>
      </div>
    </div>
  );
}
