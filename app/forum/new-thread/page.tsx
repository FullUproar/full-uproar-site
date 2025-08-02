'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Navigation from '@/app/components/Navigation';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

interface Board {
  id: number;
  name: string;
  slug: string;
}

function NewThreadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBoards();
    const boardSlug = searchParams.get('board');
    if (boardSlug) {
      setSelectedBoard(boardSlug);
    }
  }, [searchParams]);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/forum/boards');
      const data = await response.json();
      setBoards(data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('You must be logged in to create a thread');
      return;
    }

    if (!selectedBoard || !title.trim() || !content.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardSlug: selectedBoard,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create thread');
      }

      // Redirect to the new thread
      router.push(`/forum/${selectedBoard}/${data.slug}`);
    } catch (error: any) {
      setError(error.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
    },
    content: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
    },
    card: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '2rem',
      backdropFilter: 'blur(10px)',
    },
    title: {
      fontSize: '2rem',
      fontWeight: 900,
      color: '#f97316',
      marginBottom: '2rem',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#e2e8f0',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      outline: 'none',
      transition: 'all 0.2s',
    },
    select: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'vertical' as const,
      minHeight: '200px',
      fontFamily: 'inherit',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    button: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'transform 0.2s',
    },
    errorBox: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      color: '#fca5a5',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '1rem',
    },
  };

  if (!isLoaded) {
    return null;
  }

  if (!userId) {
    return (
      <div style={styles.container}>
        <Navigation />
        <div style={styles.content}>
          <div style={styles.card}>
            <h1 style={styles.title}>Sign In Required</h1>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              You must be signed in to create a new thread.
            </p>
            <Link href="/sign-in" style={{ color: '#f97316' }}>
              Sign in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navigation />
      
      <div style={styles.content}>
        <Link 
          href="/forum" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#fdba74', 
            marginBottom: '2rem',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={20} />
          Back to Forum
        </Link>

        <div style={styles.card}>
          <h1 style={styles.title}>Create New Thread</h1>

          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Board</label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="">Select a board</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.slug}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Thread Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={styles.input}
                placeholder="Enter a descriptive title for your thread"
                maxLength={255}
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>First Post</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={styles.textarea}
                placeholder="Start the discussion..."
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              disabled={loading}
            >
              <Send size={20} />
              {loading ? 'Creating...' : 'Create Thread'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #111827, #1f2937)' }}>
        <Navigation />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p style={{ color: '#fdba74' }}>Loading...</p>
        </div>
      </div>
    }>
      <NewThreadForm />
    </Suspense>
  );
}