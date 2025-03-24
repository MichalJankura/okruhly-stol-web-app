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

  useEffect(() => {
    // Fetch data from Strapi API at localhost
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:1337/api/blogs?populate=*');
        const data: StrapiResponse = await response.json();
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Helper function to get image URL
  const getImageUrl = (post: StrapiPost) => {
    if (post.titulnyobrazok) {
      // Ak existuje medium formát, použijeme ho, inak použijeme pôvodný URL
      const imageUrl = post.titulnyobrazok.formats?.medium?.url || post.titulnyobrazok.url;
      // Ak URL začína '/', pripojíme server URL
      return imageUrl.startsWith('/') ? `http://localhost:1337${imageUrl}` : imageUrl;
    }
    return 'https://via.placeholder.com/150'; // Fallback obrázok
  };

  return (
    <div
      id="news"
      className="min-h-screen relative bg-cover bg-center bg-no-repeat py-10 lg:py-0"
      style={{
        backgroundImage: 'url("assets/images/events.jpeg")',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      <div className="max-w-[85rem] px-4 sm:px-6 lg:px-8 mx-auto flex flex-col relative z-10">
        <h2 className="text-4xl font-extrabold text-center tracking-wide text-white sm:text-6xl md:text-6x1 mb-10">
          Blog
        </h2>
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 min-h-[500px]">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg text-gray-500">
              Načítavam príspevky...
            </div>
          ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <BlogCard
                key={post.id || index}
                title={post.title || 'Bez názvu'}
                author={post.autor || 'Okrúhly stôl'}
                category={post.kategoria || 'Udalosť'}
                date={post.datum || new Date(post.createdAt).toLocaleDateString()}
                shortText={post.clanok?.substring(0, 150) + '...' || ''}
                fullText={post.clanok || ''}
                image={getImageUrl(post)}
              />
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center py-20 bg-white bg-opacity-90 rounded-lg text-gray-500">
              Nenašiel sa žiadny príspevok
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleBlog;
