import React, { useState } from 'react';

interface BlogCardProps {
  title: string;
  author: string;
  category: string;
  date: string;
  shortText: string;
  fullText: string;
  image: string;
}

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

  return (
    <div className="h-full flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
      <a
        className="group cursor-pointer flex flex-col h-full"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative w-full h-48 overflow-hidden">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
            src={image}
            alt={title}
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
            <img
              className="w-full h-64 object-cover rounded mb-4"
              src={image}
              alt={title}
            />
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
  const [postsPerPage, setPostsPerPage] = useState(4);
  const [currentPage, setCurrentPage] = useState(1);

  const blogPosts = [
    {
      title: 'Studio by Preline',
      author: 'John Doe',
      category: 'Tech',
      date: '2023',
      month: 'Január',
      shortText: 'Short text about Studio by Preline...',
      fullText: 'Full article about Studio by Preline...',
      image:
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'Onsite',
      author: 'Jane Smith',
      category: 'Event',
      date: '2022',
      month: 'Február',
      shortText: 'Short text about Onsite...',
      fullText: 'Full article about Onsite...',
      image:
        'https://images.unsplash.com/photo-1668906093328-99601a1aa584?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'The complete guide to OKRs',
      author: 'Alice Brown',
      category: 'Business',
      date: '2023',
      month: 'Marec',
      shortText: 'Short text about OKRs...',
      fullText: 'Full article about OKRs...',
      image:
        'https://images.unsplash.com/photo-1567016526105-22da7c13161a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
    {
      title: 'People program models',
      author: 'Bob Johnson',
      category: 'HR',
      date: '2021',
      month: 'Apríl',
      shortText: 'Short text about People program models...',
      fullText: 'Full article about People program models...',
      image:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&q=80',
    },
  ];

  const filteredPosts = blogPosts.filter(
    (post) =>
      (selectedYear === 'All' || post.date === selectedYear) &&
      (selectedMonth === 'All' || post.month === selectedMonth) &&
      (selectedCategory === 'All' || post.category === selectedCategory) &&
      (selectedAuthor === 'All' || post.author === selectedAuthor) &&
      (searchQuery === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.shortText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const displayedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // Add a function to scroll to the top of the BlogCardGrid section
  const scrollToTop = () => {
    document.getElementById('news')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  // Reset to first page when changing posts per page
  const handlePostsPerPageChange = (newValue: number) => {
    setPostsPerPage(newValue);
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
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All</option>
                <option>2023</option>
                <option>2022</option>
                <option>2021</option>
              </select>
            </div>
            <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">Mesiac</p>
            <div className="px-2">
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All</option>
                <option>Január</option>
                <option>Február</option>
                <option>Marec</option>
                <option>Apríl</option>
                <option>Máj</option>
                <option>Jún</option>
                <option>Júl</option>
                <option>August</option>
                <option>September</option>
                <option>Október</option>
                <option>November</option>
                <option>December</option>
              </select>
            </div>
            <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">
              Kategória
            </p>
            <div className="px-2">
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All</option>
                <option>Tech</option>
                <option>Event</option>
                <option>Business</option>
                <option>HR</option>
              </select>
            </div>
            <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">Autor</p>
            <div className="px-2">
              <select
                className="w-full p-2 border rounded"
                onChange={(e) => setSelectedAuthor(e.target.value)}
              >
                <option>All</option>
                <option>John Doe</option>
                <option>Jane Smith</option>
                <option>Alice Brown</option>
                <option>Bob Johnson</option>
              </select>
            </div>

            <p className="mt-4 mb-1 text-sm font-medium text-gray-700 px-2">
              Počet na stránke
            </p>
            <div className="px-2">
              <select
                className="w-full p-2 border rounded"
                value={postsPerPage}
                onChange={(e) =>
                  handlePostsPerPageChange(parseInt(e.target.value, 10))
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
              {displayedPosts.length > 0 ? (
                displayedPosts.map((post, index) => (
                  <BlogCard key={index} {...post} />
                ))
              ) : (
                <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg text-gray-500">
                  Nenašiel sa žiadny príspevok s týmito kritériami
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-10">
              {totalPages > 1 && (
                <>
                  <button
                    className={`px-3 py-1 border rounded bg-white ${
                      currentPage === 1
                        ? 'cursor-not-allowed'
                        : 'hover:bg-blue-200'
                    }`}
                    onClick={() => {
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
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
                      className={`px-3 py-1 border rounded min-w-[36px] bg-white ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-blue-200'
                      }`}
                      onClick={() => {
                        setCurrentPage(i + 1);
                        scrollToTop();
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    className={`px-3 py-1 border rounded bg-white ${
                      currentPage === totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-200'
                    }`}
                    onClick={() => {
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                        scrollToTop();
                      }
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Nasledujúca &raquo;
                  </button>
                </>
              )}
            </div>

            <p className="text-center text-sm text-white">
              Zobrazené {(currentPage - 1) * postsPerPage + 1} až{' '}
              {Math.min(currentPage * postsPerPage, filteredPosts.length)} z{' '}
              {filteredPosts.length} príspevkov
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCardGrid;