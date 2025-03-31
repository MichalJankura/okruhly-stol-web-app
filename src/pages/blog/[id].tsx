import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import BlogPost from '../../components/BlogPost/BlogPost';


interface StrapiPost {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  title: string;
  clanok: string;
  autor: string | null;
  datum: string | null;
  kategoria: string | null;
  titulnyobrazok: {
    url: string;
    formats?: {
      medium?: { url: string };
      large?: { url: string };
    };
  } | null;
}


const BlogDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<StrapiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching post with ID:', id);
        
        // Použijeme rovnaký endpoint ako v SimpleBlog
        const response = await fetch('https://backend-strapi-kdju.onrender.com/api/blogs?populate=*');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received posts:', data.data);
        
        if (!data.data) {
          throw new Error('No data received from server');
        }

        // Nájdeme článok s daným ID
        const foundPost = data.data.find((p: StrapiPost) => p.id === Number(id));
        if (!foundPost) {
          throw new Error('Článok nebol nájdený');
        }
        
        setPost(foundPost);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error instanceof Error ? error.message : 'Nastala chyba pri načítaní článku');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Chyba!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Upozornenie!</strong>
            <span className="block sm:inline"> Článok nebol nájdený.</span>
          </div>
        </div>
      </div>
    );
  }

  const getImageUrl = (post: StrapiPost) => {
    if (post.titulnyobrazok) {
      const imageUrl = post.titulnyobrazok.formats?.medium?.url || post.titulnyobrazok.url;
      return imageUrl.startsWith('/') ? `https://backend-strapi-kdju.onrender.com/${imageUrl}` : imageUrl;
    }
    return 'https://via.placeholder.com/800x400?text=Bez+obrázku';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <BlogPost
          title={post.title}
          author={post.autor || 'Okrúhly stôl'}
          category={post.kategoria || 'Udalosť'}
          date={post.datum || new Date().toLocaleDateString()}
          content={post.clanok}
          image={getImageUrl(post)}
        />
      </div>
    </div>
  );
};

export default BlogDetail; 
