# Card Template System Design

## Core Concepts

### 1. Card Template Structure
```typescript
interface CardTemplate {
  id: string;
  name: string;
  dimensions: {
    width: number;  // in pixels at 300 DPI (e.g., 825 for 2.75")
    height: number; // in pixels at 300 DPI (e.g., 1125 for 3.75")
    bleed: number;  // extra margin for print cutting
  };
  background: {
    type: 'color' | 'image';
    value: string; // hex color or image URL
  };
  layers: TextLayer[];
}

interface TextLayer {
  id: string;
  name: string; // e.g., "title", "body", "footer"
  content: string; // The actual text
  
  // Positioning
  position: {
    x: number; // 0-100 (percentage of card width)
    y: number; // 0-100 (percentage of card height)
    anchor: {
      horizontal: 'left' | 'center' | 'right';
      vertical: 'top' | 'middle' | 'bottom';
    };
  };
  
  // Bounding Box (optional)
  bounds?: {
    width: number;  // max width in percentage
    height: number; // max height in percentage
  };
  
  // Typography
  typography: {
    fontFamily: string;
    fontSize: number; // in points
    fontWeight: 'normal' | 'bold' | number;
    fontStyle: 'normal' | 'italic';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number; // multiplier (1.5 = 150%)
    letterSpacing: number; // in em units
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    color: string; // hex color
    strokeColor?: string; // text outline
    strokeWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
  };
  
  // Text effects
  effects?: {
    curved?: {
      radius: number;
      angle: number;
    };
    gradient?: {
      colors: string[];
      direction: number; // degrees
    };
  };
}
```

## 2. Positioning System

### Anchor Points Explained:
```
TOP-LEFT      TOP-CENTER      TOP-RIGHT
    ●-------------●-------------●
    |                           |
    |                           |
MID-LEFT    CENTER-CENTER    MID-RIGHT
    ●             ●             ●
    |                           |
    |                           |
BOT-LEFT     BOT-CENTER      BOT-RIGHT
    ●-------------●-------------●
```

### Example Positions:
- **Centered Title**: `{ x: 50, y: 20, anchor: { h: 'center', v: 'middle' } }`
- **Bottom Corner**: `{ x: 95, y: 95, anchor: { h: 'right', v: 'bottom' } }`
- **Left Aligned Body**: `{ x: 10, y: 40, anchor: { h: 'left', v: 'top' } }`

## 3. Implementation Approach

### Phase 1: Data Model
```prisma
model CardTemplate {
  id          String   @id @default(cuid())
  gameId      Int
  name        String
  type        String   // 'hack_your_deck', 'character', 'action', etc.
  dimensions  Json     // width, height, bleed
  background  Json     // type, value
  layers      Json     // array of TextLayer objects
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  game        Game     @relation(fields: [gameId], references: [id])
  cards       Card[]
}

model Card {
  id            String   @id @default(cuid())
  templateId    String
  componentId   String   @unique
  content       Json     // key-value pairs for each layer
  previewUrl    String?
  exportUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  template      CardTemplate @relation(fields: [templateId], references: [id])
  component     DesignComponent @relation(fields: [componentId], references: [id])
}
```

### Phase 2: Canvas Rendering Engine
```typescript
class CardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  async renderCard(template: CardTemplate, content: Record<string, string>) {
    // 1. Set canvas dimensions
    this.canvas.width = template.dimensions.width;
    this.canvas.height = template.dimensions.height;
    
    // 2. Draw background
    if (template.background.type === 'image') {
      await this.drawBackgroundImage(template.background.value);
    } else {
      this.drawBackgroundColor(template.background.value);
    }
    
    // 3. Render each text layer
    for (const layer of template.layers) {
      await this.renderTextLayer(layer, content[layer.name]);
    }
    
    // 4. Return preview
    return this.canvas.toDataURL('image/png');
  }
  
  private renderTextLayer(layer: TextLayer, text: string) {
    const { x, y } = this.calculatePosition(layer.position);
    
    // Apply typography styles
    this.ctx.font = `${layer.typography.fontStyle} ${layer.typography.fontWeight} ${layer.typography.fontSize}px ${layer.typography.fontFamily}`;
    this.ctx.fillStyle = layer.typography.color;
    this.ctx.textAlign = layer.typography.textAlign;
    this.ctx.textBaseline = layer.position.anchor.vertical;
    
    // Handle text wrapping if bounds are set
    if (layer.bounds) {
      this.wrapText(text, x, y, layer.bounds);
    } else {
      this.ctx.fillText(text, x, y);
    }
  }
}
```

### Phase 3: Editor UI Components

#### Template Editor
- Visual canvas preview (live updates)
- Layer panel (add/remove/reorder layers)
- Properties panel for selected layer:
  - Position controls (X/Y sliders or input)
  - Anchor point selector (9-point grid)
  - Typography controls
  - Bounding box settings

#### Content Editor
- Spreadsheet view for bulk editing
- Individual card editor with live preview
- Import/Export CSV functionality
- Template switcher

### Phase 4: Export System
```typescript
class CardExporter {
  async exportForPrint(cards: Card[], options: ExportOptions) {
    // Generate high-res versions at 300 DPI
    // Add crop marks and bleed
    // Create PDF with multiple cards per page
    // Return downloadable file
  }
  
  async exportForWeb(card: Card) {
    // Generate optimized PNG/JPEG
    // Multiple sizes for different uses
  }
}
```

## 4. User Workflow

1. **Create Template**
   - Set card dimensions
   - Upload background image
   - Add text layers with positioning rules
   - Save as template

2. **Generate Cards**
   - Select template
   - Enter content for each card (CSV or manual)
   - Preview all cards
   - Bulk adjustments if needed

3. **Export**
   - Select cards to export
   - Choose format (Print PDF, Web images, etc.)
   - Download files

## 5. Technical Considerations

### Fonts
- Use web fonts for consistency
- Preload common fonts
- Allow custom font uploads

### Performance
- Cache rendered previews
- Use Web Workers for bulk generation
- Progressive rendering for large sets

### Print Quality
- Work at 300 DPI internally
- Color management (CMYK conversion)
- Bleed and safe zones

## 6. MVP Features
1. Single template type (Hack Your Deck)
2. Title + Body text layers
3. Basic positioning (9-point grid)
4. Essential typography (font, size, color, weight)
5. PNG export at screen resolution

## 7. Future Enhancements
- Multiple templates per game
- Image layers
- Shape layers
- Special effects (gradients, shadows)
- PDF export with print marks
- Version control for templates
- A/B testing different designs