import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiCalendar, FiUser, FiChevronDown } from "react-icons/fi";
import { format } from "date-fns";
import { useRouter } from 'next/router';

// Definujeme interface pre titulný obrázok
interface ImageFormat {
  url: string;
  width: number;
  height: number;
  name: string;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  sizeInBytes: number;
}

interface TitulnyObrazok {
  id: number;
  documentId: string;
  name: string;
  width: number;
  height: number;
  formats: {
    thumbnail?: ImageFormat;
    small?: ImageFormat;
    medium?: ImageFormat;
    large?: ImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Aktualizujeme interface pre dáta zo Strapi API
interface StrapiPost {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  title: string;
  clanok: string;
  autor?: string;
  datum?: string;
  kategoria?: string;
  titulnyobrazok?: TitulnyObrazok;
}

interface StrapiResponse {
  data: StrapiPost[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
}

const SimpleBlog = () => {
  const [posts, setPosts] = useState<StrapiPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [postsPerPage] = useState(6);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('http://localhost:1337/api/blogs?populate=*');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: StrapiResponse = await response.json();
        
        if (!data.data) {
          throw new Error('No data received from server');
        }
        
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setError(error instanceof Error ? error.message : 'Nastala chyba pri načítaní článkov');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = useMemo(() => 
    Array.from(new Set(posts.map((post) => post.kategoria || 'Bez kategórie')))
  , [posts]);

  const authors = useMemo(() => 
    Array.from(new Set(posts.map((post) => post.autor || 'Okrúhly stôl')))
  , [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesSearch =
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.clanok.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategories =
          selectedCategories.length === 0 ||
          selectedCategories.includes(post.kategoria || 'Bez kategórie');

        const matchesAuthors =
          selectedAuthors.length === 0 ||
          selectedAuthors.includes(post.autor || 'Okrúhly stôl');

        const matchesDateRange =
          !dateRange.start ||
          !dateRange.end ||
          (new Date(post.createdAt) >= new Date(dateRange.start) &&
            new Date(post.createdAt) <= new Date(dateRange.end));

        return matchesSearch && matchesCategories && matchesAuthors && matchesDateRange;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchTerm, selectedCategories, selectedAuthors, dateRange]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return filteredPosts.slice(startIndex, Math.min(endIndex, filteredPosts.length));
  }, [filteredPosts, currentPage, postsPerPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  }, []);

  const toggleAuthor = useCallback((author: string) => {
    setSelectedAuthors((prev) =>
      prev.includes(author)
        ? prev.filter((a) => a !== author)
        : [...prev, author]
    );
    setCurrentPage(1);
  }, []);

  const handleDateChange = useCallback((type: 'start' | 'end', value: string) => {
    setDateRange((prev) => ({ ...prev, [type]: value }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedAuthors([]);
    setDateRange({ start: null, end: null });
    setCurrentPage(1);
  }, []);

  const getImageUrl = (post: StrapiPost) => {
    if (post.titulnyobrazok) {
      const imageUrl = post.titulnyobrazok.formats?.medium?.url || post.titulnyobrazok.url;
      return imageUrl.startsWith('/') ? `http://localhost:1337${imageUrl}` : imageUrl;
    }
    return 'https://via.placeholder.com/150';
  };

  const handleCardClick = useCallback((postId: number) => {
    router.push(`/blog/${postId}`);
  }, [router]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight text-center tracking-wide bg-indigo-600">
          Novinky
          </h2>
      <nav className="sticky top-0 z-50 bg-card bg-indigo-600 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="md:flex items-center gap-4">
            <div className="relative flex-1 mb-4 md:mb-0">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent" />
              <input
                type="text"
                placeholder="Vyhľadať články..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500 text-white  shadow-lg hover:bg-red-700 transition-colors"
                >
                  Filtre <FiChevronDown />
                </button>

                {isFilterOpen && (
                  <div className="absolute top-full mt-2 w-64  bg-white rounded-md shadow-lg p-4 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Kategórie</h3>
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <label
                            key={category}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="rounded border-input"
                            />
                            {category}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Autori</h3>
                      <div className="space-y-2">
                        {authors.map((author) => (
                          <label
                            key={author}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAuthors.includes(author)}
                              onChange={() => toggleAuthor(author)}
                              className="rounded border-input"
                            />
                            {author}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Dátumový rozsah</h3>
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={dateRange.start || ""}
                          onChange={(e) => handleDateChange("start", e.target.value)}
                          className="w-full rounded-md border border-input p-2"
                        />
                        <input
                          type="date"
                          value={dateRange.end || ""}
                          onChange={(e) => handleDateChange("end", e.target.value)}
                          className="w-full rounded-md border border-input p-2"
                        />
                      </div>
                    </div>

                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
                    >
                      Vyčistiť filtre
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-accent">Načítavam články...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-destructive">{error}</p>
          </div>
        ) : paginatedPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white bg-card rounded-lg shadow-sm overflow-hidden transition-transform hover:scale-105 cursor-pointer"
                  onClick={() => handleCardClick(post.id)}
                >
                  <img
                    src={getImageUrl(post)}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="text-heading font-heading mb-2">{post.title}</h2>
                    <p className="text-body mb-4 text-accent-foreground">
                      {post.clanok.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-sm text-accent">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAuthor(post.autor || 'Okrúhly stôl');
                        }}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <FiUser />
                        {post.autor || "Okrúhly stôl"}
                      </button>
                      <div className="flex items-center gap-1">
                        <FiCalendar />
                        {format(new Date(post.createdAt), "dd.MM.yyyy")}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-4">
                  <button
                    className={`px-3 py-1 rounded bg-white border border-gray-200 ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage((prev) => prev - 1);
                        scrollToTop();
                      }
                    }}
                    disabled={currentPage === 1}
                  >
                    &laquo; Predchádzajúca
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`px-3 py-1 rounded min-w-[36px] ${
                        currentPage === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        setCurrentPage(i + 1);
                        // scrollToTop();
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    className={`px-3 py-1 rounded bg-white border border-gray-200 ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      if (currentPage < totalPages) {
                        setCurrentPage((prev) => prev + 1);
                        // scrollToTop();
                      }
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Nasledujúca &raquo;
                  </button>
                </div>

                <p className="text-center text-sm text-gray-600 mb-8">
                  Zobrazené {filteredPosts.length > 0 ? (currentPage - 1) * postsPerPage + 1 : 0} až{' '}
                  {Math.min(currentPage * postsPerPage, filteredPosts.length)} z{' '}
                  {filteredPosts.length} príspevkov
                </p>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-accent">
              Nenašli sa žiadne články zodpovedajúce vašim kritériám.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SimpleBlog;