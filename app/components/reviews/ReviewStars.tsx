'use client';

import React from 'react';

interface ReviewStarsProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showLabel?: boolean;
}

const sizeMap = {
  small: 16,
  medium: 20,
  large: 28,
};

export default function ReviewStars({
  rating,
  size = 'medium',
  interactive = false,
  onChange,
  showLabel = false,
}: ReviewStarsProps) {
  const [hoverRating, setHoverRating] = React.useState(0);
  const starSize = sizeMap[size];
  const displayRating = hoverRating || rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const renderStar = (index: number) => {
    const value = index + 1;
    const filled = displayRating >= value;
    const halfFilled = !filled && displayRating >= value - 0.5;

    return (
      <span
        key={index}
        onClick={() => handleClick(value)}
        onMouseEnter={() => handleMouseEnter(value)}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: interactive ? 'pointer' : 'default',
          display: 'inline-block',
          position: 'relative',
          width: starSize,
          height: starSize,
          marginRight: 2,
          transition: 'transform 0.1s ease',
          transform: interactive && hoverRating === value ? 'scale(1.2)' : 'scale(1)',
        }}
      >
        {/* Empty star background */}
        <svg
          width={starSize}
          height={starSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            stroke="#4a4a4a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#2a2a2a"
          />
        </svg>

        {/* Filled star */}
        {(filled || halfFilled) && (
          <svg
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              clipPath: halfFilled ? 'inset(0 50% 0 0)' : 'none',
            }}
          >
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="#f97316"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    );
  };

  const getRatingLabel = () => {
    if (rating === 0) return 'No rating';
    if (rating <= 1) return 'Poor';
    if (rating <= 2) return 'Fair';
    if (rating <= 3) return 'Good';
    if (rating <= 4) return 'Very Good';
    return 'Excellent';
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: size === 'small' ? 12 : size === 'medium' ? 14 : 16,
            color: '#e2e8f0',
          }}
        >
          {rating.toFixed(1)} - {getRatingLabel()}
        </span>
      )}
    </div>
  );
}
