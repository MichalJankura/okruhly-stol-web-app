import React, { useEffect, useRef } from "react";
import styles from "./FlopingText.module.css";

const RotatingText: React.FC<{ words: string[] }> = ({ words }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordElements = useRef<HTMLSpanElement[]>([]);
  const currentWordIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Vytváranie elementov pre slová a písmená
    const container = containerRef.current;
    wordElements.current = [];
    container.innerHTML = ''; // Vyčistíme kontajner pred pridaním nových elementov
    
    words.forEach((word, wordIndex) => {
      const wordElement = document.createElement("span");
      // Zabezpečím, že štýly sú platné stringy a nie undefined
      const wordClassName = wordIndex === 0 
        ? `${styles.word || 'word'} ${styles.visible || 'visible'}` 
        : `${styles.word || 'word'}`;
      wordElement.className = wordClassName;
      wordElements.current.push(wordElement);
      
      word.split("").forEach(letter => {
        const letterElement = document.createElement("span");
        letterElement.textContent = letter;
        letterElement.className = styles.letter || 'letter';
        wordElement.appendChild(letterElement);
      });
      
      if (container) {
        container.appendChild(wordElement);
      }
    });
    
    // Nastav prvé slovo na viditeľné
    if (wordElements.current.length > 0) {
      const firstWord = wordElements.current[0];
      if (firstWord) {
        firstWord.style.opacity = "1";
      }
    }
    
    const rotateText = () => {
      if (wordElements.current.length === 0) return;
      
      const currentIndex = currentWordIndexRef.current;
      const currentWord = wordElements.current[currentIndex];
      const nextWordIndex = 
        currentIndex === wordElements.current.length - 1 
          ? 0 
          : currentIndex + 1;
      const nextWord = wordElements.current[nextWordIndex];
      
      if (currentWord && nextWord) {
        // Rotácia písmen aktuálneho slova
        Array.from(currentWord.children).forEach((letter, i) => {
          setTimeout(() => {
            if (letter instanceof HTMLElement) {
              letter.className = `${styles.letter || 'letter'} ${styles.out || 'out'}`;
            }
          }, i * 80);
        });
        
        // Odkrytie a rotácia písmen ďalšieho slova
        nextWord.style.opacity = "1";
        Array.from(nextWord.children).forEach((letter, i) => {
          if (letter instanceof HTMLElement) {
            letter.className = `${styles.letter || 'letter'} ${styles.behind || 'behind'}`;
            setTimeout(() => {
              letter.className = `${styles.letter || 'letter'} ${styles.in || 'in'}`;
            }, 340 + i * 80);
          }
        });
        
        currentWordIndexRef.current = nextWordIndex;
      }
    };
    
    // Prvá rotácia
    rotateText();
    // Nastavenie intervalu
    intervalRef.current = setInterval(rotateText, 4000);
    
    // Vyčistenie
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [words]);
  
  return (
    <div className={styles['rotating-text'] || 'rotating-text'}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', textAlign: 'center' }}></div>
    </div>
  );
};

export default RotatingText;