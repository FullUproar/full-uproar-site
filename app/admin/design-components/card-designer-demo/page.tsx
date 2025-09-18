'use client';

import dynamic from 'next/dynamic';
import { adminStyles } from '../../styles/adminStyles';

// Dynamically import to avoid SSR issues with Fabric.js
const CardDesigner = dynamic(
  () => import('../components/CardDesigner'),
  { ssr: false }
);

export default function CardDesignerDemoPage() {
  const handleSaveTemplate = (template: any) => {
    console.log('Template saved:', template);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ ...adminStyles.title, marginBottom: '1rem' }}>
          Card Template Designer Demo
        </h1>
        <p style={{ color: '#e2e8f0', marginBottom: '2rem' }}>
          Create and customize card templates with multiple text elements, any Google Font, and various card sizes.
        </p>
      </div>
      
      <CardDesigner onSave={handleSaveTemplate} />
      
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ ...adminStyles.sectionTitle, marginTop: '2rem' }}>Features:</h2>
        <ul style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
          <li>✅ <strong>Multiple Card Sizes</strong> - Standard, Poker, Tarot, Square, Mini, Jumbo</li>
          <li>✅ <strong>Unlimited Text Elements</strong> - Add as many text layers as needed</li>
          <li>✅ <strong>Any Google Font</strong> - 30+ preloaded fonts + custom font input</li>
          <li>✅ <strong>Template System</strong> - Save and load templates (stored in localStorage)</li>
          <li>✅ <strong>High-Res Export</strong> - 300 DPI PNG export for printing</li>
          <li>✅ <strong>Background Images</strong> - Upload and set card backgrounds</li>
          <li>✅ <strong>Full Typography Control</strong> - Size, color, bold, italic, alignment</li>
          <li>✅ <strong>Drag & Drop</strong> - Move elements freely on the canvas</li>
          <li>✅ <strong>Layer Management</strong> - Bring forward/send backward</li>
        </ul>
        
        <h2 style={{ ...adminStyles.sectionTitle, marginTop: '2rem' }}>How to Create Templates:</h2>
        <ol style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
          <li>1. Select your desired card size from the dropdown</li>
          <li>2. Add background image (optional) using "Set Background"</li>
          <li>3. Add text elements using "Add Text" or "Add Text Box"</li>
          <li>4. Click on elements to select and customize them</li>
          <li>5. Position elements by dragging them on the canvas</li>
          <li>6. Customize fonts - select from list or enter any Google Font name</li>
          <li>7. Save as template using "Save as Template" button</li>
          <li>8. Load saved templates from the dropdown menu</li>
        </ol>
        
        <h2 style={{ ...adminStyles.sectionTitle, marginTop: '2rem' }}>Custom Fonts:</h2>
        <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>
          To use a custom font, select a text element and enter the exact Google Fonts name in the custom font field.
          Examples: "Poppins", "Lobster", "Bebas Neue", "Abril Fatface", "Barlow Condensed"
        </p>
        <p style={{ color: '#e2e8f0' }}>
          Browse available fonts at: <a href="https://fonts.google.com" target="_blank" style={{ color: '#f97316' }}>fonts.google.com</a>
        </p>
      </div>
    </div>
  );
}