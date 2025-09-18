'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { adminStyles } from '../../styles/adminStyles';

interface CardDimensions {
  width: number;
  height: number;
  name: string;
}

const CARD_PRESETS: CardDimensions[] = [
  { name: 'Standard (2.75" x 3.75")', width: 198, height: 270 },
  { name: 'Poker (2.5" x 3.5")', width: 180, height: 252 },
  { name: 'Tarot (2.75" x 4.75")', width: 198, height: 342 },
  { name: 'Square (3.5" x 3.5")', width: 252, height: 252 },
  { name: 'Mini (1.75" x 2.5")', width: 126, height: 180 },
  { name: 'Jumbo (3.5" x 5.75")', width: 252, height: 414 },
];

// Available fonts including web fonts
const AVAILABLE_FONTS = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Arial Black',
  'Palatino',
  'Garamond',
  'Bookman',
  'Tahoma',
  // Web fonts (need to be loaded)
  'Bebas Neue',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Oswald',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Permanent Marker',
  'Pacifico',
  'Dancing Script',
];

interface CardDesignerProps {
  templateId?: string;
  onSave?: (template: any) => void;
}

export default function CardDesigner({ templateId, onSave }: CardDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [cardDimensions, setCardDimensions] = useState<CardDimensions>(CARD_PRESETS[0]);
  const [customFont, setCustomFont] = useState('');
  
  // Card dimensions at 72 DPI for screen, will export at 300 DPI
  const EXPORT_SCALE = 300 / 72; // Scale factor for 300 DPI export

  // Load web fonts
  useEffect(() => {
    const webFonts = [
      'Bebas+Neue', 'Roboto', 'Open+Sans', 'Lato', 'Montserrat',
      'Oswald', 'Raleway', 'Playfair+Display', 'Merriweather',
      'Permanent+Marker', 'Pacifico', 'Dancing+Script'
    ];
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${webFonts.join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric canvas
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: cardDimensions.width,
      height: cardDimensions.height,
      backgroundColor: '#ffffff',
    });

    // Add grid/guides (optional)
    addGridLines(fabricCanvas);

    // Selection events
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    setCanvas(fabricCanvas);

    // Load template if provided
    if (templateId) {
      loadTemplateById(fabricCanvas, templateId);
    } else {
      // Add default template
      addDefaultTemplate(fabricCanvas);
    }

    return () => {
      fabricCanvas.dispose();
    };
  }, [cardDimensions]); // Re-initialize when dimensions change

  const addGridLines = (canvas: fabric.Canvas) => {
    const options = {
      stroke: '#e0e0e0',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    };

    // Center lines
    const centerV = new fabric.Line([cardDimensions.width / 2, 0, cardDimensions.width / 2, cardDimensions.height], options);
    const centerH = new fabric.Line([0, cardDimensions.height / 2, cardDimensions.width, cardDimensions.height / 2], options);
    
    canvas.add(centerV, centerH);
  };

  const addDefaultTemplate = (canvas: fabric.Canvas) => {
    // Title text
    const title = new fabric.Text('CARD TITLE', {
      left: cardDimensions.width / 2,
      top: 30,
      fontSize: 20,
      fontWeight: 'bold',
      fontFamily: 'Arial',
      textAlign: 'center',
      originX: 'center',
      fill: '#000000',
    });

    // Body text
    const body = new fabric.Textbox('Enter your card description here. This text will automatically wrap to fit the card width.', {
      left: cardDimensions.width / 2,
      top: 80,
      width: cardDimensions.width - 40,
      fontSize: 12,
      fontFamily: 'Arial',
      textAlign: 'center',
      originX: 'center',
      fill: '#333333',
    });

    canvas.add(title, body);
  };

  const loadTemplateById = async (canvas: fabric.Canvas, templateId: string) => {
    // Load template from database
    // For now, just use default
    addDefaultTemplate(canvas);
  };

  // Text controls
  const addText = () => {
    if (!canvas) return;
    
    const text = new fabric.Text('New Text', {
      left: cardDimensions.width / 2,
      top: cardDimensions.height / 2,
      fontSize: 16,
      fontFamily: 'Arial',
      originX: 'center',
      originY: 'center',
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addTextBox = () => {
    if (!canvas) return;
    
    const textbox = new fabric.Textbox('New text box. This will wrap automatically.', {
      left: cardDimensions.width / 2,
      top: cardDimensions.height / 2,
      width: cardDimensions.width - 40,
      fontSize: 14,
      fontFamily: 'Arial',
      originX: 'center',
      originY: 'center',
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  };

  // Image upload
  const uploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img) => {
        // Scale image to fit card
        const scale = Math.min(cardDimensions.width / img.width!, cardDimensions.height / img.height!) * 0.5;
        img.scale(scale);
        img.set({
          left: cardDimensions.width / 2,
          top: cardDimensions.height / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Background image
  const setBackgroundImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      fabric.Image.fromURL(event.target?.result as string, (img) => {
        // Scale to cover entire card
        const scale = Math.max(cardDimensions.width / img.width!, cardDimensions.height / img.height!);
        img.scale(scale);
        
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          left: cardDimensions.width / 2,
          top: cardDimensions.height / 2,
          originX: 'center',
          originY: 'center',
        });
      });
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Object controls
  const deleteSelected = () => {
    if (!canvas || !selectedObject) return;
    canvas.remove(selectedObject);
    setSelectedObject(null);
  };

  const bringForward = () => {
    if (!canvas || !selectedObject) return;
    canvas.bringForward(selectedObject);
    canvas.renderAll();
  };

  const sendBackward = () => {
    if (!canvas || !selectedObject) return;
    canvas.sendBackwards(selectedObject);
    canvas.renderAll();
  };

  // Template Management
  const saveAsTemplate = () => {
    if (!canvas) return;
    const templateData = {
      name: prompt('Template Name:') || 'Untitled Template',
      dimensions: cardDimensions,
      canvas: canvas.toJSON(),
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage for now (in production, save to database)
    const templates = JSON.parse(localStorage.getItem('cardTemplates') || '[]');
    templates.push(templateData);
    localStorage.setItem('cardTemplates', JSON.stringify(templates));
    
    alert('Template saved!');
    if (onSave) onSave(templateData);
    return templateData;
  };

  const loadTemplate = (templateData: any) => {
    if (!canvas) return;
    
    // Set dimensions first
    if (templateData.dimensions) {
      setCardDimensions(templateData.dimensions);
    }
    
    // Load canvas data
    setTimeout(() => {
      canvas.loadFromJSON(templateData.canvas, () => {
        canvas.renderAll();
      });
    }, 100);
  };

  const getTemplates = () => {
    return JSON.parse(localStorage.getItem('cardTemplates') || '[]');
  };

  // Export functions
  const exportAsJSON = () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    console.log('Template JSON:', json);
    if (onSave) onSave(json);
    return json;
  };

  const exportAsPNG = () => {
    if (!canvas) return;
    
    // Create a temporary canvas for high-res export
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: EXPORT_SCALE, // Export at 300 DPI
    });
    
    // Download the image
    const link = document.createElement('a');
    link.download = 'card-design.png';
    link.href = dataURL;
    link.click();
  };

  const loadFromJSON = (json: any) => {
    if (!canvas) return;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
    });
  };

  // Style controls for selected object
  const updateSelectedStyle = (property: string, value: any) => {
    if (!canvas || !selectedObject) return;
    
    selectedObject.set(property as any, value);
    canvas.renderAll();
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', background: '#0a0a0a' }}>
      {/* Toolbar */}
      <div style={{ ...adminStyles.card, width: '300px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={adminStyles.sectionTitle}>Card Designer Tools</h3>
        
        {/* Card Size Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ color: '#fde68a', marginBottom: '0.5rem' }}>Card Size</h4>
          <select
            value={cardDimensions.name}
            onChange={(e) => {
              const preset = CARD_PRESETS.find(p => p.name === e.target.value);
              if (preset) setCardDimensions(preset);
            }}
            style={adminStyles.select}
          >
            {CARD_PRESETS.map(preset => (
              <option key={preset.name} value={preset.name}>{preset.name}</option>
            ))}
          </select>
          <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {cardDimensions.width} × {cardDimensions.height}px (72 DPI)
          </div>
        </div>

        {/* Template Management */}
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ color: '#fde68a', marginBottom: '0.5rem' }}>Templates</h4>
          <button onClick={saveAsTemplate} style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem' }}>
            Save as Template
          </button>
          <select
            onChange={(e) => {
              if (e.target.value) {
                const templates = getTemplates();
                const template = templates[parseInt(e.target.value)];
                if (template) loadTemplate(template);
              }
            }}
            style={{ ...adminStyles.select, width: '100%', marginBottom: '0.5rem' }}
          >
            <option value="">Load Template...</option>
            {getTemplates().map((template: any, index: number) => (
              <option key={index} value={index}>{template.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ color: '#fde68a', marginBottom: '0.5rem' }}>Add Elements</h4>
          <button onClick={addText} style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem' }}>
            Add Text
          </button>
          <button onClick={addTextBox} style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem' }}>
            Add Text Box
          </button>
          
          <label style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
            Add Image
            <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} />
          </label>
          
          <label style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem', display: 'block', textAlign: 'center', background: '#374151' }}>
            Set Background
            <input type="file" accept="image/*" onChange={setBackgroundImage} style={{ display: 'none' }} />
          </label>
        </div>

        {selectedObject && (
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ color: '#fde68a', marginBottom: '0.5rem' }}>Selected Object</h4>
            
            {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
              <>
                <label style={adminStyles.label}>Font Size</label>
                <input
                  type="number"
                  value={(selectedObject as fabric.Text).fontSize}
                  onChange={(e) => updateSelectedStyle('fontSize', parseInt(e.target.value))}
                  style={adminStyles.input}
                />
                
                <label style={adminStyles.label}>Color</label>
                <input
                  type="color"
                  value={(selectedObject as fabric.Text).fill as string}
                  onChange={(e) => updateSelectedStyle('fill', e.target.value)}
                  style={adminStyles.input}
                />
                
                <label style={adminStyles.label}>Font Family</label>
                <select
                  value={(selectedObject as fabric.Text).fontFamily}
                  onChange={(e) => updateSelectedStyle('fontFamily', e.target.value)}
                  style={adminStyles.select}
                >
                  {AVAILABLE_FONTS.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                
                <label style={adminStyles.label}>Custom Font (Google Fonts name)</label>
                <input
                  type="text"
                  placeholder="e.g., Poppins, Lobster"
                  value={customFont}
                  onChange={(e) => setCustomFont(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value) {
                      // Add custom font dynamically
                      const fontName = e.target.value.trim();
                      const link = document.createElement('link');
                      link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}`;
                      link.rel = 'stylesheet';
                      document.head.appendChild(link);
                      
                      // Apply to selected text
                      updateSelectedStyle('fontFamily', fontName);
                    }
                  }}
                  style={adminStyles.input}
                />
                
                <label style={adminStyles.label}>Bold</label>
                <input
                  type="checkbox"
                  checked={(selectedObject as fabric.Text).fontWeight === 'bold'}
                  onChange={(e) => updateSelectedStyle('fontWeight', e.target.checked ? 'bold' : 'normal')}
                />
                
                <label style={adminStyles.label}>Italic</label>
                <input
                  type="checkbox"
                  checked={(selectedObject as fabric.Text).fontStyle === 'italic'}
                  onChange={(e) => updateSelectedStyle('fontStyle', e.target.checked ? 'italic' : 'normal')}
                />
              </>
            )}
            
            <div style={{ marginTop: '1rem' }}>
              <button onClick={bringForward} style={{ ...adminStyles.button, marginRight: '0.5rem' }}>
                ↑ Forward
              </button>
              <button onClick={sendBackward} style={{ ...adminStyles.button, marginRight: '0.5rem' }}>
                ↓ Back
              </button>
              <button onClick={deleteSelected} style={{ ...adminStyles.button, background: '#dc2626' }}>
                Delete
              </button>
            </div>
          </div>
        )}

        <div>
          <h4 style={{ color: '#fde68a', marginBottom: '0.5rem' }}>Export</h4>
          <button onClick={exportAsPNG} style={{ ...adminStyles.button, width: '100%', marginBottom: '0.5rem' }}>
            Export as PNG (300 DPI)
          </button>
          <button onClick={exportAsJSON} style={{ ...adminStyles.button, width: '100%', background: '#10b981' }}>
            Save Template
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div style={adminStyles.card}>
        <h3 style={adminStyles.sectionTitle}>Card Design - {cardDimensions.name}</h3>
        <div style={{ 
          border: '3px solid #f97316', 
          borderRadius: '8px',
          display: 'inline-block',
          background: '#fff'
        }}>
          <canvas ref={canvasRef} />
        </div>
        <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Click and drag to move elements. Use handles to resize.
        </p>
      </div>
    </div>
  );
}