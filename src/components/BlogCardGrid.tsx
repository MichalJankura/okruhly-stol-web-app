import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FaHeart, FaRegHeart, FaCheck, FaTimes, FaMapMarkerAlt, FaClock, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { format } from "date-fns";

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
}

const BlogCardGrid = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [category, setCategory] = useState("All Categories");
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

  const toggleFavorite = useCallback((eventId: number) => {
    setFavorites(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  }, []);

  const handleRecommendation = useCallback((eventId: number, isInterested: boolean) => {
    console.log(`User ${isInterested ? "interested in" : "not interested in"} event ${eventId}`);
  }, []);

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
        
        const formattedArticles = postsData.map((post: any) => ({
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
          location: post.location || 'Miesto Neznáme'
        }));

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
    const filtered = allArticles.filter(event => {
      const matchesCategory = category === "All Categories" || event.category.toLowerCase() === category.toLowerCase();
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

    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    setBlogArticles(filtered.slice(startIndex, endIndex));
  }, [category, allArticles, selectedLocation, searchQuery, dateRange, currentPage]);

  const filteredEvents = useMemo(() => {
    return blogArticles;
  }, [blogArticles]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full bg-[#E5E7EB] pb-8">
      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <section className="mb-8 sm:mb-12">
          <h2 className="text-[28px] sm:text-[36px] font-bold mb-4 sm:mb-6">Recommended Events</h2>
          <div className="relative">
            <button 
              onClick={() => document.querySelector('.scroll-container')?.scrollBy({ left: -372, behavior: 'smooth' })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors block"
            >
              <FaChevronLeft className="text-[#6D7074]" />
            </button>
            <div className="w-[360px] sm:w-full mx-auto sm:mx-0">
              <div className="flex flex-row overflow-x-auto hide-scrollbar sm:gap-3 gap-3  pb-4 w-full scroll-container">
                {allArticles.slice(0, 10).map((event) => (
                  <div 
                    key={event.id}
                    className="w-[360px] sm:w-[320px] flex-none max-w-[400px] mx-auto sm:mx-0 bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
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
                        <span>{format(new Date(event.event_start_date || event.date), "MMM d, yyyy")}</span>
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
                        <button className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg hover:opacity-90 transition-opacity">
                          View Details
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
              placeholder="Search events..."
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
              Filters
            </button>

            {showFilters && (
              <div className="fixed sm:absolute inset-0 sm:inset-auto sm:top-full sm:left-1/2 sm:-translate-x-1/2 top-0 right-0 w-full sm:w-80 bg-white rounded-lg shadow-sm p-4 z-50 sm:z-10 border border-[#E0E0E0] mt-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center sm:hidden">
                    <h3 className="text-lg font-semibold">Filters</h3>
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
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                    >
                      <option value="All Categories">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F0F1F3] text-[#020817] border border-[#E0E0E0]"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc === 'all' ? 'All Locations' : loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date Range</label>
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
            <h2 className="text-[36px] font-bold">All Events</h2>
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
                      <span>{format(new Date(event.event_start_date || event.date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#6D7074] mb-2">
                      <FaMapMarkerAlt />
                      <span>{event.location}</span>
                    </div>
                    <p className="text-[#020817] text-sm mb-4 line-clamp-2">{event.shortText}</p>
                    <div className="flex justify-end items-center mt-auto">
                      <button className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg hover:opacity-90 transition-opacity">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredEvents.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {Math.ceil(allArticles.length / eventsPerPage)}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(allArticles.length / eventsPerPage)}
                className="px-4 py-2 bg-[#0D6EFD] text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>

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
