import React, { useState, useRef, useEffect } from "react";

const Gallery: React.FC = () => {
    const [imageGalleryOpened, setImageGalleryOpened] = useState(false);
    const [imageGalleryActiveUrl, setImageGalleryActiveUrl] = useState<string | null>(null);
    const [imageGalleryImageIndex, setImageGalleryImageIndex] = useState<number | null>(null);
    const galleryRef = useRef<HTMLUListElement>(null);

    const openImageGallery = (event: React.MouseEvent<HTMLImageElement>) => {
        const index = Number(event.currentTarget.dataset.index);
        setImageGalleryImageIndex(index);
        setImageGalleryActiveUrl(event.currentTarget.src);
        setImageGalleryOpened(true);
    };

    const closeImageGallery = () => {
        setImageGalleryOpened(false);
        setTimeout(() => setImageGalleryActiveUrl(null), 300);
    };

    const nextImage = () => {
        if (!galleryRef.current || imageGalleryImageIndex === null) return;
        const totalImages = galleryRef.current.childElementCount;
        const nextIndex = imageGalleryImageIndex === totalImages ? 1 : imageGalleryImageIndex + 1;
        const nextImage = galleryRef.current.querySelector(`[data-index='${nextIndex}']`) as HTMLImageElement;
        setImageGalleryImageIndex(nextIndex);
        setImageGalleryActiveUrl(nextImage.src);
    };

    const prevImage = () => {
        if (!galleryRef.current || imageGalleryImageIndex === null) return;
        const totalImages = galleryRef.current.childElementCount;
        const prevIndex = imageGalleryImageIndex === 1 ? totalImages : imageGalleryImageIndex - 1;
        const prevImage = galleryRef.current.querySelector(`[data-index='${prevIndex}']`) as HTMLImageElement;
        setImageGalleryImageIndex(prevIndex);
        setImageGalleryActiveUrl(prevImage.src);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowRight") nextImage();
            if (event.key === "ArrowLeft") prevImage();
            if (event.key === "Escape") closeImageGallery();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [imageGalleryImageIndex]);

    useEffect(() => {
        if (galleryRef.current) {
            const images = galleryRef.current.querySelectorAll("img");
            images.forEach((img, index) => {
                img.setAttribute("data-index", (index + 1).toString());
            });
        }
    }, []);

    return (
        <section className="px-4 mx-auto max-w-7xl h-screen flex flex-col justify-center">
            <div className="w-full mx-auto text-left md:w-11/12 xl:w-9/12 md:text-center mb-8">
                <h1 className="mb-6 text-4xl font-extrabold leading-none tracking-normal text-gray-900 md:text-6xl md:tracking-tight">
                    <span className="block w-full text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-500 lg:inline">
                        Here's to the crazy ones
                    </span>
                </h1>
            </div>

            <div className="w-full h-full select-none flex-grow overflow-y-auto">
                <div className="max-w-6xl mx-auto h-full">
                    <ul ref={galleryRef} id="gallery" className="grid grid-cols-2 gap-5 lg:grid-cols-5">
                        {[
                            "https://images.pexels.com/photos/2356059/pexels-photo-2356059.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                            "https://images.pexels.com/photos/3618162/pexels-photo-3618162.jpeg",
                            "https://images.unsplash.com/photo-1689217634234-38efb49cb664?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
                            "https://images.unsplash.com/photo-1520350094754-f0fdcac35c1c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1950&q=80",
                            "https://cdn.devdojo.com/images/june2023/mountains-10.jpeg",
                            "https://cdn.devdojo.com/images/june2023/mountains-06.jpeg",
                            "https://images.pexels.com/photos/1891234/pexels-photo-1891234.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                            "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1965&q=80",
                            "https://images.pexels.com/photos/4256852/pexels-photo-4256852.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                            "https://images.unsplash.com/photo-1541795083-1b160cf4f3d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80",
                        ].map((src, index) => (
                            <li key={index}>
                                <img
                                    onClick={openImageGallery}
                                    src={src}
                                    className="object-cover select-none w-full h-auto bg-gray-200 rounded cursor-zoom-in aspect-[5/6] lg:aspect-[2/3] xl:aspect-[3/4]"
                                    alt={`photo gallery image ${index + 1}`}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {imageGalleryOpened && (
                <div
                    className="fixed inset-0 z-[99] flex items-center justify-center bg-black bg-opacity-50 select-none cursor-zoom-out"
                    onClick={closeImageGallery}
                >
                    <div className="relative flex flex-col items-center justify-center w-11/12 xl:w-4/5 h-11/12">
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                prevImage();
                            }}
                            className="absolute left-0 flex items-center justify-center text-white translate-x-10 rounded-full cursor-pointer xl:-translate-x-24 2xl:-translate-x-32 bg-white/10 w-14 h-14 hover:bg-white/20"
                        >
                            <svg
                                className="w-6 h-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </div>
                        <img
                            className="object-contain object-center w-full h-full select-none cursor-zoom-out"
                            src={imageGalleryActiveUrl || ""}
                            alt=""
                        />
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                            }}
                            className="absolute right-0 flex items-center justify-center text-white -translate-x-10 rounded-full cursor-pointer xl:translate-x-24 2xl:translate-x-32 bg-white/10 w-14 h-14 hover:bg-white/20"
                        >
                            <svg
                                className="w-6 h-6"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </div>
                        <a
                            href={imageGalleryActiveUrl || ""}
                            download
                            className="absolute bottom-10 flex items-center justify-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Download Photo
                        </a>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Gallery;