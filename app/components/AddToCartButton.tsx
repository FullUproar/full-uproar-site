'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { TestId, getTestId } from '@/lib/constants/test-ids';

interface AddToCartButtonProps {
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onError?: (error: Error) => void;
}

export default function AddToCartButton({ onClick, disabled = false, size = 'medium', className = '', onError }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || disabled) return;

    setIsAdding(true);
    setShowError(false);

    try {
      await onClick();

      // Show success state
      setTimeout(() => {
        setShowSuccess(true);
        setIsAdding(false);

        // Reset after animation
        setTimeout(() => {
          setShowSuccess(false);
        }, 1500);
      }, 300);
    } catch (error) {
      // Show error state
      setShowError(true);
      setIsAdding(false);

      // Call error handler if provided
      if (onError && error instanceof Error) {
        onError(error);
      }

      // Reset error state after 3 seconds
      setTimeout(() => {
        setShowError(false);
      }, 3000);
    }
  };

  const sizeStyles = {
    small: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      iconSize: 14,
    },
    medium: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      iconSize: 16,
    },
    large: {
      padding: '1rem 2rem',
      fontSize: '1.125rem',
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <>
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(1); }
          50% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes success-pop {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        .cart-button {
          animation: ${isAdding ? 'bounce-in 0.3s ease-out' : 'none'};
        }
        .cart-button:active:not(:disabled) {
          transform: scale(0.95);
        }
        .success-icon {
          animation: success-pop 0.5s ease-out;
        }
      `}</style>
      
      <button
        onClick={handleClick}
        disabled={disabled || isAdding || showSuccess || showError}
        className={`cart-button ${className}`}
        {...getTestId(TestId.PRODUCT_CARD_ADD_TO_CART)}
        style={{
          background: showSuccess ? '#10b981' : showError ? '#ef4444' : disabled ? '#6b7280' : '#f97316',
          color: showSuccess || showError ? 'white' : '#111827',
          padding: currentSize.padding,
          fontSize: currentSize.fontSize,
          borderRadius: '50px',
          fontWeight: 900,
          transition: 'all 0.3s',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          position: 'relative',
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isAdding && !showSuccess && !showError) {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = '#ea580c';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isAdding && !showSuccess && !showError) {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#f97316';
          }
        }}
      >
        {showSuccess ? (
          <>
            <Check size={currentSize.iconSize} className="success-icon" />
            ADDED!
          </>
        ) : showError ? (
          <>
            <AlertCircle size={currentSize.iconSize} />
            ERROR
          </>
        ) : (
          <>
            <ShoppingCart
              size={currentSize.iconSize}
              style={{
                animation: isAdding ? 'shake 0.3s ease-out' : 'none',
              }}
            />
            {disabled ? 'OUT OF STOCK' : 'ADD TO CART'}
          </>
        )}
      </button>
    </>
  );
}