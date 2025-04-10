import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Dynamically import the Profile component with ssr disabled
const Profile = dynamic(() => import('../components/Profile'), {
  ssr: false,
});

const ProfilePage = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      // If not logged in, redirect to home page
      router.push('/');
    }
  }, [router]);

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Your Profile | Okruhly Stol</title>
        <meta name="description" content="Manage your profile settings and preferences" />
      </Head>
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={handleBackToHome}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Návrat na hlavnú stránku
            </button>
          </div>
          <Profile />
        </div>
      </div>
    </>
  );
};

export default ProfilePage; 