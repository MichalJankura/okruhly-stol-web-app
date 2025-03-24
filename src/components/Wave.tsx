import { FC, useEffect, useRef } from 'react';

import { useCanvasContext } from '../hooks/useCanvas';
import useResponsiveSize from '../hooks/useResponsiveSize';

const Wave: FC = () => {
  const { context } = useCanvasContext();
  const { width } = useResponsiveSize();
  const height = 150; // Increased height for wider appearance
  const animationFrameRef = useRef<number>(0);
  const xScrollRef = useRef<number>(0); // Start text from center
  // The hymn text as a single continuous string
  const hymnText =
    'Podkarpatskye rusynŷ, Ostav´te hlubokyj son. Narodnŷj holos zovet vas: Ne zabud´te o svoem! Naš narod l´ubymŷj da budet svobodnŷj Ot neho da otdalyts´a nepryjatelej bur´a. Da posetyt spravedlyvost´ už y russkoe plemja! Želanye russkych vožd´: Russkyj da žyvet narod! Prosym Boha Vŷšn´aho da podderžyt russkaho y dast veka lučšaho!';

  useEffect(() => {
    if (!context) return undefined;
    // Measure text width for proper looping
    context.font = 'bold 28px Arial'; // Slightly larger font
    const textWidth = context.measureText(hymnText).width;
    // Initialize text position to be centered
    if (xScrollRef.current === 0) {
      xScrollRef.current = (width - textWidth) / 2;
    }
    const render = () => {
      // Clear the canvas
      context.clearRect(0, 0, width, height);
      // Set background color
      context.fillStyle = '#ed1c24';
      context.fillRect(0, 0, width, height);
      // Set up text styling
      context.font = 'bold 28px Arial';
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      // Calculate position for scrolling
      xScrollRef.current -= 1; // Slower text movement
      // Loop the text position when it's fully off the left side
      if (xScrollRef.current < -textWidth) {
        xScrollRef.current = width;
      }
      // Draw the text
      const centerY = height / 2; // Perfect vertical centering
      // Center horizontally by using width/2 as the x coordinate
      context.fillText(hymnText, width / 2 + xScrollRef.current, centerY);
      // Draw a second copy of the text for seamless looping
      if (xScrollRef.current < 0) {
        context.fillText(
          hymnText,
          width / 2 + xScrollRef.current + textWidth,
          centerY
        );
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [context, width]);

  return null;
};

export default Wave;
