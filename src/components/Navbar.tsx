import { Disclosure as HeadlessDisclosure, Menu as HeadlessMenu } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import config from '../config/index.json'
import { useState, useEffect } from 'react'
import { eventEmitter } from '../utils/events'
import { useRouter } from 'next/router'
import Login from './Registration/Login'
import { FaHeart, FaClock, FaMapMarkerAlt, FaTimes as FaClose } from "react-icons/fa";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import EventModal from '../components/EventModal';

// Updated downloadItems to use real document files
const downloadItems = [
  { name: 'Dizajn manuál', fileName: 'Dizajn-manuál.pdf' },
  { name: 'Narodnostný zákon', fileName: 'Narodnostny-zakon.pdf' },
  { name: 'Program rozvoja', fileName: 'Narodnostny-zakon.pdf' },
  { name: 'Rusynska symbolika', fileName: 'Rusynska symbolika.pdf' },
  { name: 'Symboly', fileName: 'Symboly-subory.zip'},
  { name: 'Hymna', fileName: 'Hymna.mp3'},
  { name: 'Príručka o jazykových právach', fileName: 'Language-guide_Ruthenian-in-Slovakia.pdf' },
  { name: 'Štatút Radu Adolfa Dobrianskeho', fileName: 'Štatút Radu Adolfa Dobrianskeho.pdf' },
]

const navigation = config.navigation.map(item => ({
  ...item,
  href: `#${item.href}`,
  current: false
}))

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Add this interface for TypeScript
interface User {
  firstName?: string;
  lastName?: string;
  email: string;
  user_id?: string;
  id?: number;
}

// BlogArticle interface (copy from BlogCardGrid)
interface BlogArticle {
  id: number;
  title: string;
  category: string;
  date: string;
  month: string;
  shortText: string;
  fullText: string;
  image: string;
  event_start_date?: string;
  event_end_date?: string;
  start_time?: string;
  end_time?: string;
  tickets?: string;
  link_to?: string;
  price?: number;
  location?: string;
  map_url?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BlogArticle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const [favorites, setFavorites] = useState<BlogArticle[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  // Add a function to handle document downloads
  const handleDocumentDownload = (e: React.MouseEvent<HTMLAnchorElement>, fileName: string) => {
    e.preventDefault();
    const filePath = `/assets/pdfs/${fileName}`;
    window.open(filePath, '_blank');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href')?.slice(1);
    
    // Check if we're on the profile page
    if (window.location.pathname !== '/') {
      // If on profile page, navigate to home page first
      router.push('/');
      return;
    }
    
    const element = document.getElementById(targetId || '');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    // Check for user data in localStorage when component mounts
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Loaded user data:', parsedUser);
      setUser(parsedUser);
    }

    // Subscribe to auth changes
    const unsubscribe = eventEmitter.subscribe('authChange', () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Updated user data:', parsedUser);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    eventEmitter.emit('authChange');
  };

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const handleRegisterClick = () => {
    setShowLogin(false);
    // You can add register modal functionality here if needed
  };

  const handleClose = () => {
    setShowLogin(false);
  };

  const fetchFavorites = async () => {
    const userId = user?.user_id || user?.id;
    if (!userId) {
      console.log("No user_id or id available, skipping fetch");
      return;
    }

    try {
      setLoadingFavorites(true);
      const response = await fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/favorites?user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      
      // Format the data to match BlogCardGrid's format
      const formattedFavorites = data.map((post: any) => {
        console.log(`[DEBUG] Processing favorite event "${post.title}" with map_url: ${post.map_url}`);
        return {
          id: post.id,
          title: post.title,
          category: post.category || 'Unknown',
          date: post.date,
          month: post.month,
          shortText: post.short_text || post.shortText || '',
          fullText: post.full_text || post.fullText || '',
          image: post.image || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80',
          event_start_date: post.event_start_date,
          event_end_date: post.event_end_date,
          start_time: post.start_time,
          end_time: post.end_time,
          tickets: post.tickets,
          link_to: post.link_to,
          price: post.price || 0,
          location: post.location || 'Miesto Neznáme',
          map_url: post.map_url
        };
      });
      
      console.log('[DEBUG] Formatted favorites:', formattedFavorites);
      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Add debug logging for user state
  useEffect(() => {
    console.log('Current user state:', user);
  }, [user]);

  const handleViewDetails = (event: BlogArticle) => {
    console.log(`[DEBUG] Opening modal for event "${event.title}" with map_url: ${event.map_url}`);
    setSelectedEvent(event);
    setShowModal(true);
  };

  const removeFavorite = async (eventId: number) => {
    const userId = user?.user_id || user?.id;
    if (!userId) return;
    setLoadingFavorites(true);
    try {
      const res = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, event_id: eventId })
      });
      if (res.ok) {
        setFavorites(prev => prev.filter(fav => fav.id !== eventId));
        // Emit event to notify other components
        eventEmitter.emit('favoritesChange', { type: 'remove', eventId });
      }
    } finally {
      setLoadingFavorites(false);
    }
  };

  return (
    <HeadlessDisclosure as="nav" 
      className="relative bg-cover bg-center"
      >
      <div className="absolute inset-0 bg-[#0055a1] opacity-85 z-0"></div>
      
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 relative z-10">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <HeadlessDisclosure.Button className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Otvoriť menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </HeadlessDisclosure.Button>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => 
                  item.name === "Na stiahnutie" ? (
                    <HeadlessMenu as="div" key={item.name} className="relative">
                      <HeadlessMenu.Button 
                        className={classNames(
                          'text-white hover:bg-gray-700 hover:text-white',
                          'inline-flex items-center rounded-md px-3 py-2 text-base font-medium'
                        )}
                      >
                        {item.name}
                        <ChevronDownIcon className="ml-1 -mr-1 h-5 w-5" aria-hidden="true" />
                      </HeadlessMenu.Button>
                      <HeadlessMenu.Items
                        className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                      >
                        {downloadItems.map((downloadItem) => (
                          <HeadlessMenu.Item key={downloadItem.name}>
                            {({ active }: { active: boolean }) => (
                              <a
                                href="#"
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleDocumentDownload(e, downloadItem.fileName)}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                {downloadItem.name}
                              </a>
                            )}
                          </HeadlessMenu.Item>
                        ))}
                      </HeadlessMenu.Items>
                    </HeadlessMenu>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={scrollToSection}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-700 hover:text-white',
                        'rounded-md px-3 py-2 text-base font-medium',
                      )}
                    >
                      {item.name}
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Favorites Dropdown - Only show if user is logged in */}
            {user && (
              <HeadlessMenu as="div" className="relative ml-3">
                <div>
                  <HeadlessMenu.Button 
                    className="relative flex rounded-full bg-white/80 p-2 hover:bg-white transition-colors"
                    onClick={fetchFavorites}
                  >
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">View favorites</span>
                    <FaHeart className="text-[#FF4C4C]" />
                  </HeadlessMenu.Button>
                </div>
                <HeadlessMenu.Items className="fixed sm:absolute left-0 sm:left-1/2 sm:-translate-x-1/2 z-10 mt-2 w-[90vw] sm:w-80 lg:w-96 origin-top-center rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Obľúbené podujatia</h3>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {loadingFavorites ? (
                      <div className="px-4 py-2 text-gray-500">Načítavam...</div>
                    ) : favorites.length === 0 ? (
                      <div className="px-4 py-2 text-gray-500">Nemáte žiadne obľúbené podujatia</div>
                    ) : (
                      favorites.map((event, index) => (
                        <HeadlessMenu.Item key={`${event.id}-${index}`}>
                          {({ active }: { active: boolean }) => (
                            <div 
                              className={`${active ? 'bg-gray-100' : ''} px-4 py-2 cursor-pointer flex items-center`}
                              onClick={() => handleViewDetails(event)}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <img 
                                  src={event.image} 
                                  alt={event.title} 
                                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-cover rounded"
                                />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <h4 className="text-sm font-medium text-gray-900 break-words line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <FaClock />
                                    <span>
                                      {format(new Date(event.event_start_date || event.date), "d. MMMM yyyy", { locale: sk })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <FaMapMarkerAlt />
                                    <span className="block line-clamp-1 break-words overflow-hidden">{event.location}</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="ml-2 p-1 rounded-full hover:bg-gray-200 z-10"
                                onClick={e => { e.stopPropagation(); removeFavorite(event.id); }}
                                title="Odstrániť z obľúbených"
                              >
                                <FaClose className="text-red-500" />
                              </button>
                            </div>
                          )}
                        </HeadlessMenu.Item>
                      ))
                    )}
                  </div>
                </HeadlessMenu.Items>
              </HeadlessMenu>
            )}

            {/* Add user name display */}
            {user && (
              <span className="ml-3 text-white font-medium flex items-center">
                Ahoj, {user.firstName || 'User'} 👋
              </span>
            )}

            {/* Profile dropdown */}
            <HeadlessMenu as="div" className="relative ml-3">
              <div>
                <HeadlessMenu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  <img
                    alt=""
                    src={user ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                    className="size-8 rounded-full"
                  />
                </HeadlessMenu.Button>
              </div>
              <HeadlessMenu.Items
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                {user ? (
                  <>
                    <HeadlessMenu.Item>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          navigateToProfile();
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:outline-hidden"
                      >
                        Tvoj účet
                      </a>
                    </HeadlessMenu.Item>
                    {/* <HeadlessMenu.Item>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:outline-hidden"
                      >
                        Settings
                      </a>
                    </HeadlessMenu.Item> */}
                    <HeadlessMenu.Item>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:outline-hidden"
                      >
                        Odhlásiť sa
                      </button>
                    </HeadlessMenu.Item>
                  </>
                ) : (
                  <HeadlessMenu.Item>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowLogin(true);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 data-focus:outline-hidden"
                    >
                      Prihlásiť sa
                    </a>
                  </HeadlessMenu.Item>
                )}
              </HeadlessMenu.Items>
            </HeadlessMenu>
          </div>
        </div>
      </div>

      <HeadlessDisclosure.Panel className="sm:hidden relative z-10">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => 
            item.name === "Na stiahnutie" ? (
              <div key={item.name}>
                <HeadlessDisclosure.Button
                  as="a"
                  href="#"
                  className={classNames(
                    'text-white hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-lg font-medium'
                  )}
                >
                  {item.name}
                </HeadlessDisclosure.Button>
                <div className="pl-4">
                  {downloadItems.map((downloadItem) => (
                    <HeadlessDisclosure.Button
                      key={downloadItem.name}
                      as="a"
                      href="#"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleDocumentDownload(e, downloadItem.fileName)}
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {downloadItem.name}
                    </HeadlessDisclosure.Button>
                  ))}
                </div>
              </div>
            ) : (
              <HeadlessDisclosure.Button
                key={item.name}
                as="a"
                href={item.href}
                onClick={scrollToSection}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-700 hover:text-white',
                  'block rounded-md px-3 py-2 text-lg font-medium',
                )}
              >
                {item.name}
              </HeadlessDisclosure.Button>
            )
          )}
        </div>
      </HeadlessDisclosure.Panel>

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

      {/* Event Modal */}
      {showModal && selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }} 
        />
      )}
    </HeadlessDisclosure>
  )
}
