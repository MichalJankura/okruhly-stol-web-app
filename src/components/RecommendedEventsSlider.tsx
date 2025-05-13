import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import EventModal from './EventModal';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { eventEmitter } from '../utils/events';

interface RecommendedEvent {
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
  location?: string;
  map_url?: string;
  tickets?: string;
  link_to?: string;
  price?: number;
}

const RecommendedEventsSlider = () => {
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<RecommendedEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    const fetchRecommendedEvents = async () => {
      try {
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const userId = user?.user_id || user?.id || '';
        const response = await fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/recommendations?user_id=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recommended events');
        }
        const data = await response.json();
        const postsData = Array.isArray(data) ? data : (data.posts || data.articles || []);
        
        const formattedEvents = postsData.map((post: any) => ({
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
          location: post.location || 'Miesto Neznáme',
          map_url: post.map_url,
          tickets: post.tickets,
          link_to: post.link_to,
          price: post.price
        }));

        setEvents(formattedEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching recommended events:', err);
        setError('Failed to load recommended events');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedEvents();
  }, [user?.user_id, user?.id]); 

  // Listen for user changes (login/logout)
  useEffect(() => {
    const updateUser = () => {
      const userData = localStorage.getItem('user');
      setUser(userData ? JSON.parse(userData) : null);
    };
    if (eventEmitter && eventEmitter.subscribe) {
      const unsubscribe = eventEmitter.subscribe('authChange', updateUser);
      return () => unsubscribe();
    } else {
      window.addEventListener('storage', updateUser);
      return () => window.removeEventListener('storage', updateUser);
    }
  }, []);

  // Listen for favorites changes
  useEffect(() => {
    const handleFavoritesChange = (data: { type: string, eventId: number }) => {
      if (data.type === 'remove') {
        setFavorites(prev => prev.filter(id => id !== data.eventId));
      } else if (data.type === 'add') {
        setFavorites(prev => [...prev, data.eventId]);
      }
    };

    if (eventEmitter && eventEmitter.subscribe) {
      const unsubscribe = eventEmitter.subscribe('favoritesChange', handleFavoritesChange);
      return () => unsubscribe();
    }
    return () => {}; // Return empty cleanup function if eventEmitter is not available
  }, []);

  // Fetch favorites when user changes
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    const userId = user.user_id || user.id;
    if (!userId) {
      setFavorites([]);
      return;
    }
    fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/favorites?user_id=${userId}`)
      .then(res => res.json())
      .then((data) => {
        setFavorites(Array.isArray(data) ? data.map((fav: any) => fav.id) : []);
      })
      .catch(() => setFavorites([]));
  }, [user]);

  const toggleFavorite = (eventId: number) => {
    if (!user) return;
    const userId = user.user_id || user.id;
    if (!userId) return;
    if (favorites.includes(eventId)) {
      // Remove favorite
      fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, event_id: eventId })
      })
        .then(res => {
          if (res.ok) setFavorites(prev => prev.filter(id => id !== eventId));
        });
    } else {
      // Add favorite
      fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, event_id: eventId })
      })
        .then(res => {
          if (res.ok) setFavorites(prev => [...prev, eventId]);
        });
    }
  };

  const nextSlide = () => {
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth;
      const scrollAmount = containerWidth;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const prevSlide = () => {
    if (sliderRef.current) {
      const containerWidth = sliderRef.current.clientWidth;
      const scrollAmount = -containerWidth;
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const slider = sliderRef.current;
    if (!slider) return;
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const slider = sliderRef.current;
    if (!slider) return;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const slider = sliderRef.current;
    if (!slider) return;
    setStartX(e.touches[0]!.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const slider = sliderRef.current;
    if (!slider) return;
    const x = e.touches[0]!.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2;
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleViewDetails = (event: RecommendedEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Function to get tag color based on author/location
  const getLocationColor = (author: string) => {
    // Generate a consistent color based on the author string
    const hash = author.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-cyan-500'
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  // Function to get tag color based on category

  // Deduplicate events by id
  const uniqueEvents = Array.from(new Map(events.map(e => [e.id, e])).values());

  if (loading) {
    return (
      <div className="w-full h-64 bg-white bg-opacity-90 rounded-lg flex items-center justify-center">
        <p>Loading recommended events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-white bg-opacity-90 rounded-lg flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full mb-8" id="events">
      <h3 className="text-2xl font-bold text-white mb-4">Odporúčané pre teba</h3>
      <div className="relative">
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-80 p-2 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-800" />
        </button>
        <div 
          ref={sliderRef}
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div className="flex gap-4 px-2">
            {uniqueEvents.map((event) => (
              <div
                key={event.id}
                className="flex-none w-[300px] snap-center"
                onClick={() => handleViewDetails(event)}
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden w-[300px] cursor-pointer transition-all duration-200 hover:-translate-y-1">
                  <div className="relative w-full h-[200px] overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={e => { e.stopPropagation(); toggleFavorite(event.id); }}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors z-10"
                    >
                      {favorites.includes(event.id) ? (
                        <FaHeart className="text-[#FF4C4C]" />
                      ) : (
                        <FaRegHeart className="text-[#6D7074]" />
                      )}
                    </button>
                    {event.event_start_date && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        {format(new Date(event.event_start_date), "d. MMMM yyyy", { locale: sk })}
                        {event.event_end_date && event.event_end_date !== event.event_start_date && ` - ${format(new Date(event.event_end_date), "d. MMMM yyyy", { locale: sk })}`}
                        {event.start_time && ` - ${event.start_time}`}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col min-h-[250px]">
                    <span className={`inline-block text-xs text-white px-2.5 py-0.5 rounded-full w-fit ${getLocationColor(event.location || '')}`}>
                      {event.location}
                    </span>
                    <h4 className="mt-2.5 text-lg font-semibold line-clamp-2">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-0 mb-10 line-clamp-2">{event.shortText}</p>
                    <div className="mt-auto flex items-center">
                      <div>
                        <h5 className="text-sm font-medium">{event.category}</h5>
                        <small className="text-gray-500">{event.date}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default RecommendedEventsSlider; 
