import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FaHeart, FaRegHeart, FaCheck, FaTimes, FaMapMarkerAlt, FaClock, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import EventModal from './EventModal';
import { eventEmitter } from '../utils/events';

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

const BlogCardGrid = () => {
  // Visual feedback state for like/dislike
  const [feedbackStates, setFeedbackStates] = useState<{ [eventId: number]: 'green' | 'red' | null }>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [category, setCategory] = useState("Všetky kategórie");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([]);
  const [allArticles, setAllArticles] = useState<BlogArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>(["all"]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 8;
  const [selectedEvent, setSelectedEvent] = useState<BlogArticle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<BlogArticle[]>([]);
  const [fadeOutEvents, setFadeOutEvents] = useState<number[]>([]);
  // --- RECOMMENDATIONS ---
  const [recommendedArticles, setRecommendedArticles] = useState<BlogArticle[]>([]);
  const [user, setUser] = useState<any>(null);

  // Helper function to get random events
  const getRandomEvents = (events: BlogArticle[], count: number) => {
    const shuffled = [...events].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const fallbackRecs = useMemo(() => getRandomEvents(allArticles, 10), [allArticles]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    setUser(userData ? JSON.parse(userData) : null);
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.user_id || userData.id;
    
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/recommendations?user_id=${userId}`);
        const data = await res.json();
        setRecommendedArticles(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setRecommendedArticles(getRandomEvents(allArticles, 10));
      }
    };

    if (userId) {
      fetchRecommendations();
    }
  }, [allArticles]);

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

  const toggleFavorite = useCallback((eventId: number) => {
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
  }, [favorites, user]);

  const handleRecommendation = useCallback((eventId: number, isInterested: boolean) => {
    setFeedbackStates(prev => ({ ...prev, [eventId]: isInterested ? "green" : "red" }));
    setFadeOutEvents(prev => [...prev, eventId]);

    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.user_id || userData.id;

    if (!userId) {
      console.error('No user ID found when trying to handle recommendation');
      return;
    }

    const event = recommendedArticles.find(e => e.id === eventId);
    const eventType = event?.category || "Unknown";

    fetch("https://okruhly-stol-web-app-s9d9.onrender.com/api/interactions", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        event_id: eventId,
        action_type: isInterested ? "interested" : "not_interested"
      }),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(() => {
      return fetch("https://okruhly-stol-web-app-s9d9.onrender.com/api/update-weight", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          event_type: eventType,
          liked: isInterested
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });
    })
    .then(res => res.json())
    .then(() => {
      setTimeout(() => {
        // Remove the marked event
        setRecommendedArticles(prev => prev.filter(article => article.id !== eventId));
        setFadeOutEvents(prev => prev.filter(id => id !== eventId));

        // Load new recommendation
        fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/recommendations?user_id=${userId}`)
          .then(res => res.json())
          .then(data => {
            const currentIds = new Set(recommendedArticles.map(article => article.id));
            const newRecommendations = data.filter((rec: any) => !currentIds.has(rec.id) && rec.id !== eventId);

            const TARGET_COUNT = 8; // koľko odporúčaní má byť zobrazených

            setRecommendedArticles(prev => {
              const current = prev.filter(article => article.id !== eventId); // odstránené ohodnotené
              const added = [];

              for (const rec of newRecommendations) {
                if (current.length + added.length >= TARGET_COUNT) break;
                added.push(rec);
              }

              // fallback z allArticles ak chýba
              const currentIds = new Set([...current, ...added].map(a => a.id));
              const missingCount = TARGET_COUNT - (current.length + added.length);
              const fallback = getRandomEvents(
                allArticles.filter(a => !currentIds.has(a.id) && a.id !== eventId),
                missingCount
              );

              return [...current, ...added, ...fallback];
            });
          })
          .catch(error => {
            console.error('Error fetching new recommendation:', error);
            const currentIds = new Set(recommendedArticles.map(article => article.id));
            const available = allArticles.filter(article => !currentIds.has(article.id) && article.id !== eventId);
            const randomEvent = getRandomEvents(available, 1)[0];
            if (randomEvent) {
              setRecommendedArticles(prev => [...prev, randomEvent]);
            }
          });
      }, 500);
    })
    .catch((error: Error) => {
      console.error('Error in recommendation flow:', error);
      setTimeout(() => {
        setRecommendedArticles(prev => prev.filter(article => article.id !== eventId));
        setFadeOutEvents(prev => prev.filter(id => id !== eventId));

        const currentIds = new Set(recommendedArticles.map(article => article.id));
        const available = allArticles.filter(article => !currentIds.has(article.id) && article.id !== eventId);
        const randomEvent = getRandomEvents(available, 1)[0];
        if (randomEvent) {
          setRecommendedArticles(prev => [...prev, randomEvent]);
        }
      }, 500);
    });
  }, [recommendedArticles, allArticles]);

  // Fetch articles on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/blog-posts?limit=1000`);
        if (!response.ok) {
          throw new Error('Failed to fetch articles');
        }
        const data = await response.json();
        
        const postsData = data.posts || data.articles || [];
        
        const formattedArticles = postsData.map((post: any) => {
          // Debug log for map_url
          console.log(`[DEBUG] Received map_url for event "${post.title}": ${post.map_url}`);
          
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

        // Debug table for events
        console.table(formattedArticles.map((event: BlogArticle) => ({
          ID: event.id,
          Title: event.title,
          Category: event.category,
          Date: event.date,
          Event_Start: event.event_start_date,
          Location: event.location
        })));

        // Extract unique locations from the formatted articles
        const uniqueLocations = Array.from(new Set<string>(formattedArticles
          .map((article: BlogArticle) => article.location)
          .filter((loc: string | null | undefined): loc is string => 
            typeof loc === 'string' && loc !== 'null' && loc !== 'undefined')));

        setLocations(["all", ...uniqueLocations]);
        setAllArticles(formattedArticles);
        setError(null);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        const categoryNames = data.map((cat: any) => cat.name);
        setCategories(categoryNames);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Update displayed articles when filters change
  useEffect(() => {
    // Reset to the first page whenever filters change
    setCurrentPage(1);

    const filtered = allArticles.filter(event => {
      const matchesCategory = category === "Všetky kategórie" || event.category.toLowerCase() === category.toLowerCase();
      const matchesLocation = selectedLocation === "all" || event.location === selectedLocation;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.shortText.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesDateRange = true;
      if (dateRange.from && dateRange.to) {
        const eventDate = new Date(event.event_start_date || event.date);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        matchesDateRange = eventDate >= fromDate && eventDate <= toDate;
      }

      return matchesCategory && matchesLocation && matchesSearch && matchesDateRange;
    });

    // Update the filtered articles state
    setFilteredArticles(filtered);

    // Update the displayed articles based on the new current page
    const startIndex = (1 - 1) * eventsPerPage; // Use 1 for the first page
    const endIndex = startIndex + eventsPerPage;
    setBlogArticles(filtered.slice(startIndex, endIndex));
  }, [category, allArticles, selectedLocation, searchQuery, dateRange]);

  // Update the displayed articles when currentPage changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    setBlogArticles(filteredArticles.slice(startIndex, endIndex));
  }, [currentPage, filteredArticles]);

  const filteredEvents = useMemo(() => {
    return blogArticles;
  }, [blogArticles]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    const totalPages = Math.ceil(filteredArticles.length / eventsPerPage);
    if (pageNumber < 1) {
      setCurrentPage(1);
    } else if (pageNumber > totalPages) {
      setCurrentPage(totalPages);
    } else {
      setCurrentPage(pageNumber);
    }
  };

  const handleViewDetails = (event: BlogArticle) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8" id="events">
        <div className="container mx-auto px-2 sm:px-4 md:px-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8" id="events">
        <div className="container mx-auto px-2 sm:px-4 md:px-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-8" id="events">
      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <section className="mb-8 sm:mb-12">
          <h2 className="text-[28px] sm:text-[36px] font-bold mb-4 sm:mb-6">Odporúčané podujatia</h2>
          <div className="relative">
            <button 
              onClick={() => document.querySelector('.scroll-container')?.scrollBy({ left: -372, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors block"
            >
              <FaChevronLeft className="text-[#6D7074]" />
            </button>
            <div className="w-[360px] sm:w-full mx-auto sm:mx-0">
              <div className="flex flex-row overflow-x-auto hide-scrollbar sm:gap-3 gap-3  pb-4 w-full scroll-container">
                {(recommendedArticles.length > 0 ? recommendedArticles : fallbackRecs).map((event) => (
                  <div 
                    key={event.id}
                    className={`w-[360px] sm:w-[320px] flex-none max-w-[400px] mx-auto sm:mx-0 bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col
                      ${fadeOutEvents.includes(event.id) ? 'opacity-0 transform scale-95 transition-all duration-500' : ''}
                      ${feedbackStates[event.id] === 'green' ? 'bg-lime-100' : feedbackStates[event.id] === 'red' ? 'bg-red-100' : ''}
                    `}
                  >
                    <div className="relative h-48">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={() => toggleFavorite(event.id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                      >
                        {favorites.includes(event.id) ? (
                          <FaHeart className="text-[#FF4C4C]" />
                        ) : (
                          <FaRegHeart className="text-[#6D7074]" />
                        )}
                      </button>
                    </div>
                    <div className="p-4 flex flex-col h-[280px]">
                      <h3 className="text-[14px] font-semibold text-[#020817] mb-2">{event.title}</h3>
                      <div className="flex items-center gap-2 text-[#6D7074] mb-2">
                        <FaClock />
                        <span>
                          {format(new Date(event.event_start_date || event.date), "d. MMMM yyyy", { locale: sk })}
                          {event.event_end_date && event.event_end_date !== event.event_start_date && ` - ${format(new Date(event.event_end_date), "d. MMMM yyyy", { locale: sk })}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#6D7074] mb-2">
                        <FaMapMarkerAlt />
                        <span>{event.location}</span>
                      </div>
                      <p className="text-[#020817] text-sm mb-4 line-clamp-2">{event.shortText}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="flex gap-1 sm:gap-2">
                          <button
                            onClick={() => handleRecommendation(event.id, true)}
                            className="p-1.5 sm:p-2 bg-[#4CAF50] text-white rounded-full hover:opacity-90 transition-opacity"
                          >
                            <FaCheck className="text-sm sm:text-base" />
                          </button>
                          <button
                            onClick={() => handleRecommendation(event.id, false)}
                            className="p-1.5 sm:p-2 bg-[#FF4C4C] text-white rounded-full hover:opacity-90 transition-opacity"
                          >
                            <FaTimes className="text-sm sm:text-base" />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleViewDetails(event)}
                          className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Zobraziť detaily
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => document.querySelector('.scroll-container')?.scrollBy({ left: 372, behavior: 'smooth' })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors block"
            >
              <FaChevronRight className="text-[#6D7074]" />
            </button>
          </div>
        </section>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Vyhľadať podujatia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6D7074]" />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto px-4 py-2 bg-[#0D6EFD] text-white rounded-lg flex items-center justify-center gap-2"
            >
              <FaFilter />
              Filtre
            </button>

            {showFilters && (
              <div className="fixed sm:absolute inset-0 sm:inset-auto sm:top-full sm:left-1/2 sm:-translate-x-1/2 top-0 right-0 w-full sm:w-80 bg-white rounded-lg shadow-sm p-4 z-50 sm:z-10 border border-[#E0E0E0] mt-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center sm:hidden">
                    <h3 className="text-lg font-semibold">Filtre</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kategória</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                    >
                      <option value="Všetky kategórie">Všetky kategórie</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Miesto</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc === 'all' ? 'Všetky miesta' : loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Dátum</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                      />
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-[36px] font-bold">Všetky podujatia</h2>
          </div>

          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredEvents.slice(0, 8).map((event) => (
                <div 
                  key={event.id}
                  className="w-full max-w-[400px] mx-auto sm:max-w-none bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="relative h-48">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <button
                      onClick={() => toggleFavorite(event.id)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                      {favorites.includes(event.id) ? (
                        <FaHeart className="text-[#FF4C4C]" />
                      ) : (
                        <FaRegHeart className="text-[#6D7074]" />
                      )}
                    </button>
                  </div>
                  <div className="p-4 flex flex-col h-[280px]">
                    <h3 className="text-[14px] font-semibold text-[#020817] mb-2">{event.title}</h3>
                    <div className="flex items-center gap-2 text-[#6D7074] mb-2">
                      <FaClock />
                      <span>
                        {format(new Date(event.event_start_date || event.date), "d. MMMM yyyy", { locale: sk })}
                        {event.event_end_date && event.event_end_date !== event.event_start_date && ` - ${format(new Date(event.event_end_date), "d. MMMM yyyy", { locale: sk })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6D7074] mb-2">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-[#020817] text-sm mb-4 line-clamp-2">{event.shortText}</p>
                    <div className="flex justify-end items-center mt-auto">
                      <button 
                        onClick={() => handleViewDetails(event)}
                        className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Zobraziť detaily
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredArticles.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg disabled:opacity-50"
              >
                Predchádzajúca
              </button>
              <span className="px-4 py-2">
                Strana {currentPage} z {Math.ceil(filteredArticles.length / eventsPerPage)}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(filteredArticles.length / eventsPerPage)}
                className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg disabled:opacity-50"
              >
                Ďalšia
              </button>
            </div>
          )}
        </section>

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

        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BlogCardGrid;
