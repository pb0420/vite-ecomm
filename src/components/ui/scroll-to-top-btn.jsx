import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react"; // or any icon you prefer

const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return visible ? (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed left-4 bottom-24 z-40 bg-[#3CB371] hover:bg-[#2E8B57] text-white rounded-full shadow-lg p-3 transition-all duration-200"
      style={{ boxShadow: "0 2px 8px rgba(44, 62, 80, 0.15)" }}
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  ) : null;
};

export default ScrollToTopButton;