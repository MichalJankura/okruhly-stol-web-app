import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BlogPost from '../components/BlogPost/BlogPost';
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
  titulnyobrazok?: {
    url: string;
  };
}

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<StrapiPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:1337/api/blogs/${id}?populate=*`);
        const data = await response.json();
        setPost(data.data);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Načítavam článok...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Článok nebol nájdený</div>
      </div>
    );
  }

  const getImageUrl = (post: StrapiPost) => {
    if (post.titulnyobrazok) {
      const imageUrl = post.titulnyobrazok.url;
      return imageUrl.startsWith('/') ? `http://localhost:1337${imageUrl}` : imageUrl;
    }
    return 'https://via.placeholder.com/150';
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <BlogPost
        title={post.title}
        author={post.autor || 'Okrúhly stôl'}
        category={post.kategoria || 'Udalosť'}
        date={post.datum || new Date(post.createdAt).toLocaleDateString()}
        content={post.clanok}
        image={getImageUrl(post)}
      />
    </div>
  );
};

export default BlogDetail; 