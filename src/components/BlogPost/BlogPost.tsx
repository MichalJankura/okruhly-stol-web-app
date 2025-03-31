import React from 'react';
interface BlogPostProps {
    title: string;
    author: string;
    category: string;
    date: string;
    content: string;
    image: string;
}

const BlogPost: React.FC<BlogPostProps> = ({
    title,
    author,
    category,
    date,
    content,
    image
}) => {
    return (
            <div className="relative">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="p-8">
                        <div className="mb-6">
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                                {category}
                            </span>
                        </div>
                        
                        <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-8">
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"/>
                                </svg>
                                {date}
                            </div>
                            <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                                </svg>
                                {author}
                            </div>
                        </div>

                        <div className="mb-8">
                            <img 
                                src={image} 
                                alt={title} 
                                className="w-full h-[400px] object-cover rounded-lg"
                            />
                        </div>

                        <div 
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />

                        <div className="mt-8 pt-6 border-t">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Kategória:</span>
                                <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                                    {category}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
