// import { Popover } from '@headlessui/react';
// import { Disclosure } from '@headlessui/react';
// import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from '@heroicons/react/24/outline';
// import { Link } from 'react-scroll';

// import config from '../config/index.json';

// const Menu = () => {
//   const { navigation, company } = config;
//   const { name: companyName, logo } = company;

//   return (
//     <>
//       <svg
//         className={`hidden lg:block absolute right-0 inset-y-0 h-full w-48 text- transform translate-x-1/2`}
//         fill="#ffd700"
//         viewBox="0 0 100 100"
//         preserveAspectRatio="none"
//         aria-hidden="true"
//       >
//         <polygon points="50,0 100,0 50,100 0,100" />
//       </svg>

//       <Popover>
//         <div className="relative pt-6 px-4 sm:px-6 lg:px-8">
//           <nav
//             className="relative flex items-center justify-between sm:h-10 lg:justify-start"
//             aria-label="Global"
//           >
//             <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
//               <div className="flex items-center justify-between w-full md:w-auto">
//                 <a href="#">
//                   <span className="sr-only">{companyName}</span>
//                   <img alt="logo" className="h-auto w-auto sm:h-16" src={logo} />
//                 </a>
//                 <div className="-mr-2 flex items-center md:hidden">
//                   <Popover.Button
//                     className={`bg-yellow-300 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}
//                   >
//                     <span className="sr-only">Open main menu</span>
//                     <MenuIcon className="h-6 w-6" aria-hidden="true" />
//                   </Popover.Button>
//                 </div>
//               </div>
//             </div>
//             <div className="hidden md:block md:ml-10 md:pr-4 md:space-x-8">
//               {navigation.map((item) => (
//                 <Link
//                   spy={true}
//                   active="active"
//                   smooth={true}
//                   duration={1000}
//                   key={item.name}
//                   to={item.href}
//                   className="font-medium text-gray-500 hover:text-gray-900"
//                 >
//                   {item.name}
//                 </Link>
//               ))}
//             </div>
//           </nav>
//         </div>
//         <Popover.Panel
//           focus
//           className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
//         >
//           <div
//             className={`rounded-lg shadow-md bg-yellow-400 ring-1 ring-black ring-opacity-5 overflow-hidden`}
//           >
//             <div className="px-5 pt-4 flex items-center justify-between">
//               <div>
//                 <img className="h-8 w-auto" src={logo} alt="" />
//               </div>
//               <div className="-mr-2">
//                 <Popover.Button
//                   className={`bg-yellow-400 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-secondary`}
//                 >
//                   <span className="sr-only">Close main menu</span>
//                   <XIcon className="h-6 w-6" aria-hidden="true" />
//                 </Popover.Button>
//               </div>
//             </div>
//             <div className="px-2 pt-2 pb-3 space-y-1">
//               {navigation.map((item) => (
//                 <Link
//                   spy={true}
//                   active="active"
//                   smooth={true}
//                   duration={1000}
//                   key={item.name}
//                   to={item.href}
//                   className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
//                 >
//                   {item.name}
//                 </Link>
//               ))}
//             </div>
//           </div>
//         </Popover.Panel>
//       </Popover>
//     </>
//   );
// };

// export default Menu;
