import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface RecommendedEvent {
  id: number;
  title: string;
  author: string;
  category: string;
  date: string;
  shortText: string;
  image: string;
  event_start_date?: string;
  event_end_date?: string;
  start_time?: string;
  end_time?: string;
}

const RecommendedEventsSlider = () => {
  const [events, setEvents] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecommendedEvents = async () => {
      try {
        const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/blog-posts?limit=10');
        if (!response.ok) {
          throw new Error('Failed to fetch recommended events');
        }
        const data = await response.json();
        const postsData = data.posts || data.articles || [];
        
        const formattedEvents = postsData.map((post: any) => ({
          id: post.id,
          title: post.title,
          author: post.author,
          category: post.category,
          date: post.date,
          shortText: post.short_text || post.shortText || '',
          image: post.image || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80',
          event_start_date: post.event_start_date,
          event_end_date: post.event_end_date,
          start_time: post.start_time,
          end_time: post.end_time,
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
  }, []);

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
            {events.map((event) => (
              <div
                key={event.id}
                className="flex-none w-[300px] snap-center"
              >
                <div className="bg-white rounded-lg shadow-lg overflow-hidden w-[300px] cursor-pointer transition-all duration-200 hover:-translate-y-1">
                  <div className="relative w-full h-[200px] overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    {event.event_start_date && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        {new Date(event.event_start_date).toLocaleDateString('sk-SK')}
                        {event.start_time && ` - ${event.start_time}`}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col min-h-[250px]">
                    <span className={`inline-block text-xs text-white px-2.5 py-0.5 rounded-full w-fit ${getLocationColor(event.author)}`}>
                      {event.author}
                    </span>
                    <h4 className="mt-2.5 text-lg font-semibold line-clamp-2">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-0 mb-10 line-clamp-2">{event.shortText}</p>
                    <div className="mt-auto flex items-center">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(event.author)}&background=random`}
                        alt={event.author}
                        className="w-10 h-10 rounded-full mr-2.5"
                      />
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
    </div>
  );
};

export default RecommendedEventsSlider; 
