import { FaClock, FaMapMarkerAlt, FaFilter, FaTimes as FaClose } from "react-icons/fa";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface BlogArticle {
  id: number;
  title: string;
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
  price?: number;
  location?: string;
  map_url?: string;
}

interface EventModalProps {
  event: BlogArticle;
  onClose: () => void;
}

const EventModal = ({ event, onClose }: EventModalProps) => {
  // Use the map_url from the event object, but if location is "Miesto neznáme", use Prešov map
  const presovMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2641.8383484567!2d21.2353986!3d48.9977246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473eed62a563a9ef%3A0xb18994e09e7a9e06!2sJarkov%C3%A1%203110%2F77%2C%20080%2001%20Pre%C5%A1ov!5e0!3m2!1ssk!2ssk!4v1709912345678!5m2!1ssk!2ssk";
  const mapUrl = event.location === "Miesto neznáme" || event.location === "Miesto Neznáme" 
    ? presovMapUrl 
    : (event.map_url || presovMapUrl);
  
  // Debug log for map URL in modal
  console.log(`[DEBUG] Using map URL in modal for event "${event.title}" with location "${event.location}": ${mapUrl}`);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto hide-scrollbar">
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-white rounded-full shadow-lg"
          >
            <FaClose className="text-[#0D6EFD]" />
          </button>
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-[300px] object-cover rounded-t-lg"
          />
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#020817] mb-4">{event.title}</h2>
          
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-2 text-[#6D7074]">
              <FaClock />
              <span>
                {format(new Date(event.event_start_date || event.date), "d. MMMM yyyy", { locale: sk })}
                {event.event_end_date && event.event_end_date !== event.event_start_date && ` - ${format(new Date(event.event_end_date), "d. MMMM yyyy", { locale: sk })}`}
              </span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2 text-[#6D7074]">
                <FaClock />
                <span>{event.start_time} - {event.end_time || 'Koniec'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#6D7074]">
              <FaMapMarkerAlt />
              <span>{event.location}</span>
            </div>
            {event.category && (
              <div className="flex items-center gap-2 text-[#6D7074]">
                <FaFilter />
                <span>{event.category}</span>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#020817] mb-2">O podujatí</h3>
            <p className="text-[#020817]">
              {event.fullText || event.shortText}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#020817] mb-2">Miesto konania</h3>
            <div className="h-[300px] w-full rounded-lg overflow-hidden">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>

          {event.price !== undefined && event.price > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-[#E0E0E0]">
              <span className="text-xl font-semibold text-[#0D6EFD]">{event.price} €</span>
              <button className="px-6 py-2 bg-[#0D6EFD] text-white rounded-lg hover:opacity-90 transition-opacity">
                Rezervovať
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default EventModal; 