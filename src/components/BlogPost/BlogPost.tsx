import React, { useState } from 'react';
import { FiArrowLeft, FiArrowRight, FiX, FiShare2, FiUser,FiCalendar} from "react-icons/fi";
import { useRouter } from 'next/router';

interface BlogPostProps {
    title: string;
    author: string;
    category: string;
    date: string;
    content: string;
    image: string;
    postId?: number;
    prevPostId?: number;
    nextPostId?: number;
}

const BlogPost: React.FC<BlogPostProps> = ({
    title,
    author,
    category,
    date,
    content,
    image,
    postId,
    prevPostId,
    nextPostId
}) => {
    const [darkMode, setDarkMode] = useState(false);
    const router = useRouter();

    // Navigácia na predchádzajúci príspevok
    const navigateToPrevPost = () => {
        if (prevPostId) {
            router.push(`/blog/${prevPostId}`);
        }
    };

    // Navigácia na nasledujúci príspevok
    const navigateToNextPost = () => {
        if (nextPostId) {
            router.push(`/blog/${nextPostId}`);
        }
    };

    // Zdieľanie príspevku
    const sharePost = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `Prečítajte si článok: ${title}`,
                url: window.location.href,
            })
            .catch((error) => console.log('Zdieľanie zlyhalo:', error));
        } else {
            // Kopírovanie URL do schránky ako fallback
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('Odkaz bol skopírovaný do schránky!'))
                .catch((err) => console.error('Kopírovanie zlyhalo:', err));
        }
    };

    // Transformovanie HTML obsahu na sekcie, ak je to potrebné
    // V reálnej aplikácii by ste mali implementovať parser, ktorý konvertuje HTML na štruktúrované dáta
    // Pre ukážku zobrazíme obsah ako jeden paragraf
    const contentSections = [
        {
            type: "paragraph",
            content: content
        }
    ];

    const renderContent = (section: { type: string; content: string }) => {
        switch (section.type) {
            case "paragraph":
                return <div className="prose prose-lg max-w-none text-foreground dark:text-dark-foreground" dangerouslySetInnerHTML={{ __html: section.content }} />;
            case "heading":
                return <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-dark-foreground">{section.content}</h2>;
            case "blockquote":
                return (
                    <blockquote className="border-l-4 border-[#0D6EFD] pl-4 italic my-6 text-accent dark:text-dark-accent-foreground">
                        {section.content}
                    </blockquote>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen bg-background dark:bg-dark-background transition-colors duration-300 ${darkMode ? "dark" : ""}`}>
            <div className="container mx-auto px-4 py-8 max-w-4xl relative">
                <div className="relative">
                    <button
                        onClick={() => {window.location.href = '/';}}
                        className="absolute p-2 rounded-full bg-[#0D6EFD] dark:bg-dark-[#0D6EFD] text-secondary-foreground dark:text-dark-secondary-foreground hover:bg-opacity-80 transition-all"
                        aria-label="Návrat na domovskú stránku"
                        style={{ position: 'absolute', top: '-90px', right: '-30px' }}
                    >
                        <FiX size={24} />
                    </button>

                    <article className="mt-12">
                        <h1 className="text-heading font-heading mb-6 text-foreground dark:text-dark-foreground font-heading text-4xl font-bold">
                            {title}
                        </h1>

                        <div className="flex flex-wrap gap-4 items-center mb-8 text-accent-foreground dark:text-dark-accent-foreground">
                            <div className="flex items-center">
                                <FiUser className="mr-2" />
                                <span>{author}</span>
                            </div>
                            <div className="flex items-center">
                                <FiCalendar className="mr-2" />
                                <span>{date}</span>
                            </div>
                            <span className="bg-[#0D6EFD] text-primary-foreground px-3 py-1 rounded-full text-sm">
                                {category}
                            </span>
                        </div>

                        <div className="mb-8 relative aspect-video">
                            <img
                                src={image}
                                alt={title}
                                className="rounded-lg w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>

                        <div className="prose max-w-none">
                            {contentSections.map((section, index) => (
                                <div key={index}>{renderContent(section)}</div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mt-12 pt-8 border-t border-border dark:border-dark-border">
                            <button
                                onClick={navigateToPrevPost}
                                disabled={!prevPostId}
                                className={`flex items-center px-4 py-2 bg-[#0D6EFD] dark:bg-dark-secondary rounded-lg hover:bg-opacity-80 transition-all text-secondary-foreground dark:text-dark-secondary-foreground ${!prevPostId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                aria-label="Predchádzajúci článok"
                            >
                                <FiArrowLeft className="mr-2" />
                                Predchádzajúci
                            </button>

                            <button
                                onClick={sharePost}
                                className="flex items-center px-4 py-2 bg-[#0D6EFD] text-primary-foreground rounded-lg hover:bg-opacity-80 transition-all"
                                aria-label="Zdieľať článok"
                            >
                                <FiShare2 className="mr-2" />
                                Zdieľať
                            </button>

                            <button
                                onClick={navigateToNextPost}
                                disabled={!nextPostId}
                                className={`flex items-center px-4 py-2 bg-[#0D6EFD] dark:bg-dark-secondary rounded-lg hover:bg-opacity-80 transition-all text-secondary-foreground dark:text-dark-secondary-foreground ${!nextPostId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                aria-label="Ďalší článok"
                            >
                                Ďalší
                                <FiArrowRight className="ml-2" />
                            </button>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
