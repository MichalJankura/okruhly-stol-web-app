import { useState, useEffect, useRef } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hi, how can I help you today?" },
    { role: "user", content: "fewafef" },
    {
      role: "ai",
      content:
        "Sorry, I couldn't find any information in the documentation about that. Expect answer to be less accurate.",
    },
  ]);
  const [input, setInput] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll efekt – skry/ukáž bublinu
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 20) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 20) {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ⬇️ Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("https://chatbot-hy6y.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      const aiMessage = data.choices?.[0]?.message;

      if (aiMessage) {
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Hmm... AI didn't return a response." },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "There was an error contacting the AI." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 bottom-4 right-4 inline-flex items-center justify-center text-sm font-medium border rounded-full w-16 h-16 bg-black hover:bg-gray-700 text-white transition-all duration-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
        </svg>
      </button>

     {/* Chat Window */}
     {isOpen && (
  <div className="fixed z-50 bottom-[calc(4rem+1.5rem)] right-2 sm:right-4 bg-white p-4 sm:p-6 rounded-lg border border-gray-200 w-[95vw] max-w-md h-[90vh] shadow-md flex flex-col flex-1 overflow-y-auto pr-2 space-y-4 max-h-[calc(100%-140px)]">
          {/* Header */}
          <div className="pb-6">
            <h2 className="font-semibold text-lg">Chatbot</h2>
            <p className="text-sm text-gray-500">Powered by Mendable and Vercel</p>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto pr-2 space-y-4"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="flex gap-3 text-sm text-gray-600">
                <span className="flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                  <div className="rounded-full bg-gray-100 border p-1">
                    {msg.role === "user" ? (
                      <svg
                        fill="black"
                        viewBox="0 0 16 16"
                        height="20"
                        width="20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Z" />
                      </svg>
                    ) : (
                      <svg
                        fill="black"
                        viewBox="0 0 24 24"
                        height="20"
                        width="20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="none"
                          d="M9.813 15.904L9 18.75l-.813-2.846..."
                        />
                      </svg>
                    )}
                  </div>
                </span>
                <p className="leading-relaxed">
                  <span className="block font-bold text-gray-700">
                    {msg.role === "user" ? "You" : "AI"}
                  </span>
                  {msg.content}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 text-sm text-gray-600">
                <span className="flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                  <div className="rounded-full bg-gray-100 border p-1">
                    <svg
                      fill="black"
                      viewBox="0 0 24 24"
                      height="20"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        stroke="none"
                        d="M9.813 15.904L9 18.75l-.813-2.846..."
                      />
                    </svg>
                  </div>
                </span>
                <p className="leading-relaxed">
                  <span className="block font-bold text-gray-700">AI</span>
                  Typing...
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center pt-4 space-x-2">
            <input
              className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Type your message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-4 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
