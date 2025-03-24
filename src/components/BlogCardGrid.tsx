import React, { useState, useEffect } from 'react';

interface BlogCardProps {
  title: string;
  author: string;
  category: string;
  date: string;
  shortText: string;
  fullText: string;
  image: string;
}

interface BlogArticle {
  id: number;
  title: string;
  author: string;
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
}

interface MonthOption {
  name: string;
  value: string;
  hasEvents: boolean;
  count: number;
}

interface CategoryOption {
  name: string;
  value: string;
  count: number;
}

// interface ApiResponse {
//   posts: Array<{
//     id: number;
//     title: string;
//     author: string;
//     category: string;
//     date: string;
//     month: string;
//     short_text: string;
//     full_text: string;
//     image: string;
//     event_start_date?: string;
//     event_end_date?: string;
//     start_time?: string;
//     end_time?: string;
//     tickets?: string;
//     link_to?: string;
//   }>;
//   total: number;
//   page: number;
//   pages: number;
// }

const BlogCard = ({
                    title,
                    author,
                    category,
                    date,
                    shortText,
                    fullText,
                    image,
                  }: BlogCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80';

  const handleImageError = () => {
    setImageError(true);
  };

  return (
      <div className="h-full flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
        <a
            className="group cursor-pointer flex flex-col h-full"
            onClick={() => setIsOpen(true)}
        >
          <div className="relative w-full h-48 overflow-hidden">
            <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                src={imageError ? fallbackImage : image}
                alt={title}
                onError={handleImageError}
            />
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-600 line-clamp-2 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {author} - {category} - {date}
            </p>
            <p className="mt-1 text-gray-600 line-clamp-3 flex-grow">
              {shortText}
            </p>
            <div className="mt-4 text-blue-600 text-sm font-medium">
              Čítať viac
            </div>
          </div>
        </a>
        {isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
              <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {author} - {category} - {date}
                </p>
                <div className="relative w-full h-64 overflow-hidden rounded mb-4">
                  <img
                      className="w-full h-full object-cover"
                      src={imageError ? fallbackImage : image}
                      alt={title}
                      onError={handleImageError}
                  />
                </div>
                <div className="text-gray-700 prose max-w-none">{fullText}</div>
                <button
                    className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                  Zavrieť
                </button>
              </div>
            </div>
        )}
      </div>
  );
};

const BlogCardGrid = () => {
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAuthor, setSelectedAuthor] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [articlesPerPage, setArticlesPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);

  // API data state
  const [blogArticles, setBlogArticles] = useState<BlogArticle[]>([]);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter options state
  const [years, setYears] = useState<string[]>(['All']);
  const [months, setMonths] = useState<MonthOption[]>([{ name: 'All', value: 'All', hasEvents: true, count: 0 }]);
  const [categories, setCategories] = useState<CategoryOption[]>([{ name: 'All', value: 'All', count: 0 }]);
  const [authors, setAuthors] = useState<string[]>(['All']);

  // Mock data for development/fallback
  const mockArticles: BlogArticle[] = [
    {
      id: 1,
      title: 'Sample Article 1',
      author: 'John Doe',
      category: 'News',
      date: '2023-01-15',
      month: 'January',
      shortText: 'This is a sample article for testing purposes when the API is not available.',
      fullText: 'This is the full text of the sample article. It contains more detailed information about the topic.',
      image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80'
    },
    {
      id: 2,
      title: 'Sample Article 2',
      author: 'Jane Smith',
      category: 'Events',
      date: '2023-02-20',
      month: 'February',
      shortText: 'Another sample article for testing the blog card grid component.',
      fullText: 'This is the full text of another sample article. It provides more information about the event.',
      image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&auto=format&fit=crop&w=320&q=80'
    }
  ];

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [yearsRes, monthsRes, categoriesRes, authorsRes] = await Promise.all([
          fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/years').then(res => res.json()),
          fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/months').then(res => res.json()),
          fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/categories').then(res => res.json()),
          fetch('https://okruhly-stol-web-app-s9d9.onrender.com/api/authors').then(res => res.json())
        ]);

        console.log('Categories Response:', categoriesRes);

        // Set default values if API returns undefined
        setYears(Array.isArray(yearsRes) && yearsRes.length > 0 ? yearsRes : ['All']);
        
        // Handle months response with new format
        if (Array.isArray(monthsRes) && monthsRes.length > 0) {
          setMonths(monthsRes);
        } else {
          setMonths([{ name: 'All', value: 'All', hasEvents: true, count: 0 }]);
        }
        
        // Handle categories response with new format
        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          console.log('Setting categories:', categoriesRes);
          // Only convert string categories if they're not already in the correct format
          const formattedCategories = categoriesRes.map(category => {
            if (typeof category === 'string') {
              return {
                name: category,
                value: category,
                count: 0
              };
            }
            return category;
          });
          setCategories(formattedCategories);
        } else {
          console.log('Setting default categories');
          setCategories([{ name: 'All', value: 'All', count: 0 }]);
        }
        
        setAuthors(Array.isArray(authorsRes) && authorsRes.length > 0 ? authorsRes : ['All']);
      } catch (err) {
        setError('Failed to load filter options');
        console.error('Error fetching filter options:', err);
        // Set default values on error
        setYears(['All']);
        setMonths([{ name: 'All', value: 'All', hasEvents: true, count: 0 }]);
        setCategories([{ name: 'All', value: 'All', count: 0 }]);
        setAuthors(['All']);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch articles whenever filter changes
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: articlesPerPage.toString()
        });

        if (selectedYear !== 'All') queryParams.append('year', selectedYear);
        if (selectedMonth !== 'All') queryParams.append('month', selectedMonth);
        if (selectedCategory !== 'All') queryParams.append('event_type', selectedCategory);
        if (selectedAuthor !== 'All') queryParams.append('location', selectedAuthor);
        if (searchQuery) queryParams.append('search', searchQuery);

        console.log('Fetching from URL:', `https://okruhly-stol-web-app-s9d9.onrender.com/api/blog-posts?${queryParams}`);
        const response = await fetch(`https://okruhly-stol-web-app-s9d9.onrender.com/api/blog-posts?${queryParams}`);
        
        if (!response.ok) {
          console.error('Response not OK:', response.status, response.statusText);
          throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        // Check if we have posts data (the backend might be using different property names)
        const postsData = data.posts || data.articles || [];
        
        if (!postsData || !Array.isArray(postsData)) {
          console.error('Invalid posts data format:', postsData);
          throw new Error('Invalid API response format: posts data not found or not an array');
        }

        // Transform API data to match BlogArticle format, handling both camelCase and snake_case
        const formattedArticles = postsData.map(post => ({
          id: post.id,
          title: post.title,
          author: post.author,
          category: post.category,
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
          link_to: post.link_to
        }));

        console.log('Formatted articles:', formattedArticles);
        setBlogArticles(formattedArticles);
        setApiTotalPages(data.pages || 1);
        setError(null);
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Using mock data for display.');
        // Use mock data when API fails
        setBlogArticles(mockArticles);
        setApiTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentPage, articlesPerPage, selectedYear, selectedMonth, selectedCategory, selectedAuthor, searchQuery]);

  // Add a function to scroll to the top of the BlogCardGrid section
  const scrollToTop = () => {
    document.getElementById('news')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  // Reset to first page when changing articles per page
  const handleArticlesPerPageChange = (newValue: number) => {
    setArticlesPerPage(newValue);
    setCurrentPage(1);
    scrollToTop();
  };

  return (
      <div
          id="news"
          className="min-h-screen relative bg-cover bg-center bg-no-repeat py-10 lg:py-0"
          style={{
            backgroundImage: 'url("assets/images/events.jpeg")'
          }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>

        <div className="max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto flex flex-col relative z-10">
          <h2 className="text-4xl font-extrabold text-center tracking-wide text-white sm:text-6xl md:text-6x1 mb-10">
            Novinky a udalosti
          </h2>
          <div className="flex flex-col md:flex-row gap-6 flex-grow py-10">
            <div className="w-full md:w-1/5 pl-0 bg-white bg-opacity-90 p-5 rounded-lg h-fit max-h-[calc(100vh-340px)] overflow-y-auto sticky top-24">
              <h3 className="text-center font-bold px-16 text-2xl">Filter</h3>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">
                Vyhľadávanie
              </p>
              <div className="relative px-2">
                <input
                    type="text"
                    className="w-full p-2 border rounded pl-9"
                    placeholder="Hľadať..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset to first page on search
                    }}
                />
                <svg
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">Rok</p>
              <div className="px-2">
                <select
                    className="w-full p-2 border rounded"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                >
                  {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">Mesiac</p>
              <div className="px-2">
                <select
                    className="w-full p-2 border rounded"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setCurrentPage(1);
                    }}
                >
                  {months.map((month) => {
                    // Different styling for months with/without events
                    const hasNoEvents = !month.hasEvents && month.value !== 'All';
                    const optionStyle = hasNoEvents
                      ? "text-gray-400 italic" 
                      : month.count > 0 && month.value !== 'All'
                        ? "font-medium"
                        : "";
                      
                    return (
                      <option 
                        key={month.value} 
                        value={month.value}
                        className={optionStyle}
                        disabled={hasNoEvents}
                      >
                        {month.name}
                        {hasNoEvents 
                          ? " (žiadne udalosti)"
                          : month.value !== 'All' 
                            ? ` (${month.count})`
                            : ""
                        }
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">
                Kategória
              </p>
              <div className="px-2">
                <select
                    className="w-full p-2 border rounded"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                >
                  {categories.map((category) => {
                    const hasNoEvents = category.count === 0 && category.value !== 'All';
                    const optionStyle = hasNoEvents
                      ? "text-gray-400 italic" 
                      : category.count > 0 && category.value !== 'All'
                        ? "font-medium"
                        : "";
                    
                    return (
                      <option 
                        key={category.value} 
                        value={category.value}
                        className={optionStyle}
                        disabled={hasNoEvents}
                      >
                        {category.name}
                        {hasNoEvents 
                          ? " (žiadne udalosti)"
                          : category.value !== 'All' 
                            ? ` (${category.count})`
                            : ""
                        }
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">Autor</p>
              <div className="px-2">
                <select
                    className="w-full p-2 border rounded"
                    value={selectedAuthor}
                    onChange={(e) => {
                      setSelectedAuthor(e.target.value);
                      setCurrentPage(1);
                    }}
                >
                  {authors.map((author) => (
                      <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>

              <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">
                Počet na stránke
              </p>
              <div className="px-2">
                <select
                    className="w-full p-2 border rounded"
                    value={articlesPerPage}
                    onChange={(e) =>
                        handleArticlesPerPageChange(parseInt(e.target.value, 10))
                    }
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-4/5 flex flex-col">
              <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 min-h-[500px]">
                {loading ? (
                    <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg">
                      <p>Loading...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg text-red-500">
                      {error}
                    </div>
                ) : blogArticles && blogArticles.length > 0 ? (
                    blogArticles.map((article) => (
                        <BlogCard
                            key={article.id}
                            title={article.title}
                            author={article.author}
                            category={article.category}
                            date={article.date}
                            shortText={article.shortText}
                            fullText={article.fullText}
                            image={article.image}
                        />
                    ))
                ) : (
                    <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg text-gray-500">
                      {selectedMonth !== 'All' && months.find(m => m.value === selectedMonth)?.hasEvents === false 
                        ? `Mesiac ${months.find(m => m.value === selectedMonth)?.name} nemá žiadne udalosti` 
                        : "Nenašiel sa žiadny príspevok s týmito kritériami"}
                    </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-10">
                {apiTotalPages > 1 && (
                    <>
                      <button
                          className={`px-3 py-1 border rounded bg-white ${
                              currentPage === 1
                                  ? 'cursor-not-allowed'
                                  : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (currentPage > 1) {
                              setCurrentPage(1);
                              scrollToTop();
                            }
                          }}
                          disabled={currentPage === 1}
                      >
                        First
                      </button>
                      <button
                          className={`px-3 py-1 border rounded bg-white ${
                              currentPage === 1
                                  ? 'cursor-not-allowed'
                                  : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              scrollToTop();
                            }
                          }}
                          disabled={currentPage === 1}
                      >
                        Prev
                      </button>
                      {Array.from({ length: apiTotalPages }, (_, i) => i + 1)
                          .filter(
                              (page) =>
                                  page === 1 ||
                                  page === apiTotalPages ||
                                  Math.abs(currentPage - page) <= 2
                          )
                          .map((page, index, array) => {
                            if (
                                index > 0 &&
                                array[index - 1] !== page - 1
                            ) {
                              return (
                                  <React.Fragment key={`ellipsis-${page}`}>
                                    <span className="px-2">...</span>
                                    <button
                                        className={`px-3 py-1 border rounded ${
                                            currentPage === page
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white hover:bg-gray-100'
                                        }`}
                                        onClick={() => {
                                          setCurrentPage(page);
                                          scrollToTop();
                                        }}
                                    >
                                      {page}
                                    </button>
                                  </React.Fragment>
                              );
                            }
                            return (
                                <button
                                    key={page}
                                    className={`px-3 py-1 border rounded ${
                                        currentPage === page
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white hover:bg-gray-100'
                                    }`}
                                    onClick={() => {
                                      setCurrentPage(page);
                                      scrollToTop();
                                    }}
                                >
                                  {page}
                                </button>
                            );
                          })}
                      <button
                          className={`px-3 py-1 border rounded bg-white ${
                              currentPage === apiTotalPages
                                  ? 'cursor-not-allowed'
                                  : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (currentPage < apiTotalPages) {
                              setCurrentPage(currentPage + 1);
                              scrollToTop();
                            }
                          }}
                          disabled={currentPage === apiTotalPages}
                      >
                        Next
                      </button>
                      <button
                          className={`px-3 py-1 border rounded bg-white ${
                              currentPage === apiTotalPages
                                  ? 'cursor-not-allowed'
                                  : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            if (currentPage < apiTotalPages) {
                              setCurrentPage(apiTotalPages);
                              scrollToTop();
                            }
                          }}
                          disabled={currentPage === apiTotalPages}
                      >
                        Last
                      </button>
                    </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default BlogCardGrid;
