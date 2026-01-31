'use client';

import { useState, useEffect } from 'react';

interface QRCodeShareProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeShare({ roomCode, isOpen, onClose }: QRCodeShareProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/chaos/join/${roomCode}`
    : `/chaos/join/${roomCode}`;

  // Use QR Server API for QR code generation (no dependency needed)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=0a0a0a&color=f97316`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (canShare && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Chaos Agent session!',
          text: `Join the chaos! Room code: ${roomCode}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-up"
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '340px',
          width: '100%',
          textAlign: 'center',
          border: '2px solid #f97316',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          color: '#f97316',
          fontSize: '24px',
          marginBottom: '8px',
          fontWeight: 'bold',
        }}>
          Share the Chaos!
        </h2>
        <p style={{
          color: '#9ca3af',
          fontSize: '14px',
          marginBottom: '24px',
        }}>
          Scan the QR code or share the link
        </p>

        {/* Room Code */}
        <div
          onClick={copyCode}
          style={{
            backgroundColor: '#0a0a0a',
            padding: '12px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
        >
          <div style={{
            color: '#6b7280',
            fontSize: '11px',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Room Code
          </div>
          <div style={{
            color: '#fde68a',
            fontSize: '32px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            letterSpacing: '8px',
          }}>
            {roomCode}
          </div>
          <div style={{
            color: '#6b7280',
            fontSize: '10px',
            marginTop: '4px',
          }}>
            Tap to copy
          </div>
        </div>

        {/* QR Code */}
        <div style={{
          backgroundColor: '#0a0a0a',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'inline-block',
        }}>
          <img
            src={qrCodeUrl}
            alt={`QR Code for room ${roomCode}`}
            width={200}
            height={200}
            style={{
              display: 'block',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Share Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleShare}
            className="btn-chaos"
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#f97316',
              color: '#000',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {canShare ? '📤 Share' : '📋 Copy Link'}
          </button>
          <button
            onClick={onClose}
            className="btn-chaos"
            style={{
              padding: '14px 20px',
              backgroundColor: '#2a2a2a',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {copied && (
          <div
            className="animate-slide-up"
            style={{
              position: 'absolute',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#10b981',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Copied!
          </div>
        )}
      </div>
    </div>
  );
}
