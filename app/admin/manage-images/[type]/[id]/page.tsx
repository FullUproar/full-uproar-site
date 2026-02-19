'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Save, Trash2, GripVertical, Star } from 'lucide-react';
import ImageUpload from '@/app/components/ImageUpload';

interface ImageData {
  id: number;
  imageUrl: string;
  alt: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

export default function ManageImagesPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoaded = status !== 'loading';
  const router = useRouter();
  const [itemType, setItemType] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [itemData, setItemData] = useState<any>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Form for new image
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [uploading, setUploading] = useState(false);

  // Basic admin check
  useEffect(() => {
    if (isLoaded && !user) {
      redirect('/');
    }
  }, [user, isLoaded]);

  // Extract params
  useEffect(() => {
    params.then((resolvedParams) => {
      setItemType(resolvedParams.type);
      setItemId(resolvedParams.id);
    });
  }, [params]);

  // Fetch item data and images
  useEffect(() => {
    if (itemType && itemId) {
      fetchItemData();
      fetchImages();
    }
  }, [itemType, itemId]);

  const fetchItemData = async () => {
    try {
      const endpoint = itemType === 'game' ? `/api/games` : `/api/merch`;
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (itemType === 'game') {
        const item = data.find((g: any) => g.id === parseInt(itemId));
        setItemData(item);
      } else {
        const item = data.find((m: any) => m.id === parseInt(itemId));
        setItemData(item);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const endpoint = itemType === 'game' 
        ? `/api/games/${itemId}/images`
        : `/api/merch/${itemId}/images`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching images:', error);
      setMessage('❌ Error loading images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl) {
      setMessage('❌ Please provide an image URL');
      return;
    }

    try {
      setUploading(true);
      const endpoint = itemType === 'game' 
        ? `/api/games/${itemId}/images`
        : `/api/merch/${itemId}/images`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newImageUrl,
          alt: newImageAlt || `${itemData?.title || itemData?.name} image`,
          isPrimary: images.length === 0, // First image is primary by default
          sortOrder: images.length
        })
      });

      if (response.ok) {
        setMessage('✅ Image added successfully!');
        setNewImageUrl('');
        setNewImageAlt('');
        fetchImages();
      } else {
        setMessage('❌ Error adding image');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      setMessage('❌ Error adding image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const endpoint = itemType === 'game' 
        ? `/api/games/${itemId}/images?imageId=${imageId}`
        : `/api/merch/${itemId}/images?imageId=${imageId}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('✅ Image deleted successfully!');
        fetchImages();
      } else {
        setMessage('❌ Error deleting image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      setMessage('❌ Error deleting image');
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      setSaving(true);
      
      const endpoint = itemType === 'game' 
        ? `/api/games/${itemId}/images`
        : `/api/merch/${itemId}/images`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          isPrimary: true
        })
      });
      
      if (response.ok) {
        setMessage('✅ Primary image updated!');
        fetchImages();
      } else {
        setMessage('❌ Error setting primary image');
      }
    } catch (error) {
      console.error('Error setting primary image:', error);
      setMessage('❌ Error setting primary image');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    try {
      setSaving(true);
      
      // Reorder images
      const reorderedImages = [...images];
      const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
      reorderedImages.splice(dropIndex, 0, draggedImage);
      
      // Update sort order
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        sortOrder: index
      }));
      
      setImages(updatedImages);
      
      // Save new order to backend
      const endpoint = itemType === 'game' 
        ? `/api/games/${itemId}/images`
        : `/api/merch/${itemId}/images`;
      
      for (const img of updatedImages) {
        await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageId: img.id,
            sortOrder: img.sortOrder
          })
        });
      }
      
      setMessage('✅ Image order updated!');
    } catch (error) {
      console.error('Error reordering images:', error);
      setMessage('❌ Error reordering images');
      fetchImages(); // Reload on error
    } finally {
      setSaving(false);
      setDraggedIndex(null);
    }
  };

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  const styles = {
    container: { 
      minHeight: '100vh', 
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #ea580c)' 
    },
    header: { 
      background: '#FF8200', 
      color: 'white', 
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      maxWidth: '80rem',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    main: { 
      maxWidth: '80rem', 
      margin: '0 auto', 
      padding: '2rem' 
    },
    card: {
      background: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      marginBottom: '2rem'
    },
    imageGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginTop: '2rem'
    },
    imageCard: {
      background: '#f9fafb',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      border: '2px solid #e5e7eb',
      transition: 'all 0.2s',
      cursor: 'move'
    },
    primaryImageCard: {
      border: '3px solid #FF8200',
      boxShadow: '0 0 0 3px rgba(255, 130, 0, 0.1)'
    },
    imagePreview: {
      width: '100%',
      height: '200px',
      objectFit: 'cover' as const
    },
    imageActions: {
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.5rem'
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '0.875rem',
      transition: 'all 0.2s'
    },
    primaryButton: {
      background: '#FF8200',
      color: 'white'
    },
    secondaryButton: {
      background: '#6b7280',
      color: 'white'
    },
    dangerButton: {
      background: '#ef4444',
      color: 'white'
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '0.375rem',
      fontSize: '1rem',
      width: '100%'
    },
    label: {
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      display: 'block',
      color: '#374151'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>
              MANAGE IMAGES
            </h1>
            <p style={{ color: '#fed7aa', fontSize: '1.125rem' }}>
              {itemData ? `${itemData.title || itemData.name}` : 'Loading...'}
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            style={{ ...styles.button, ...styles.secondaryButton, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {message && (
          <div style={{
            background: message.includes('✅') ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}

        {/* Add New Image */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Add New Image
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={styles.label}>Image Upload</label>
              <ImageUpload
                onImageUploaded={(url) => setNewImageUrl(url)}
                currentImageUrl={newImageUrl}
              />
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Or enter image URL manually"
                style={{ ...styles.input, marginTop: '0.5rem' }}
              />
            </div>
            
            <div>
              <label style={styles.label}>Alt Text (optional)</label>
              <input
                type="text"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Describe the image for accessibility"
                style={styles.input}
              />
            </div>
            
            <button
              onClick={handleAddImage}
              disabled={uploading || !newImageUrl}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: uploading || !newImageUrl ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'center'
              }}
            >
              <Upload size={16} />
              {uploading ? 'Uploading...' : 'Add Image'}
            </button>
          </div>
        </div>

        {/* Current Images */}
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Current Images ({images.length})
          </h2>
          
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Loading images...
            </p>
          ) : images.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              No images yet. Add your first image above.
            </p>
          ) : (
            <div style={styles.imageGrid}>
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    ...styles.imageCard,
                    ...(image.isPrimary ? styles.primaryImageCard : {})
                  }}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.alt || ''}
                    style={styles.imagePreview}
                  />
                  <div style={styles.imageActions}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GripVertical size={16} color="#9ca3af" />
                      {image.isPrimary && (
                        <span style={{ 
                          background: '#FF8200', 
                          color: 'white', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Star size={12} fill="white" />
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {!image.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          style={{ ...styles.button, ...styles.secondaryButton }}
                          title="Set as primary image"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        style={{ ...styles.button, ...styles.dangerButton }}
                        title="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          background: '#fef3c7',
          border: '1px solid #FBDB65',
          borderRadius: '0.5rem',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#92400e' }}>
            Instructions
          </h3>
          <ul style={{ marginLeft: '1.5rem', color: '#78350f', lineHeight: 1.6 }}>
            <li>The primary image is shown as the main product image</li>
            <li>Drag and drop images to reorder them</li>
            <li>Click the star icon to set an image as primary</li>
            <li>Alt text helps with accessibility and SEO</li>
            <li>Recommended image size: 800x800 pixels minimum</li>
          </ul>
        </div>
      </div>
    </div>
  );
}