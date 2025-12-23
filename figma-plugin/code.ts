/// <reference types="@figma/plugin-typings" />

// Import c2d-sdk for converting html.to.design output to Figma nodes
// Note: This needs to be bundled for production use
// For now, we'll use a simplified approach that works with the API output

figma.showUI(__html__, {
  width: 400,
  height: 520,
  themeColors: true,
});

// Track position for placing multiple imports
let currentX = 0;
let currentY = 0;
const SPACING = 100;

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'paint-to-canvas') {
    try {
      const { model, images, url } = msg;

      // Use c2d-sdk to convert model to Figma nodes
      // The c2dToFigmaCanvas function handles the conversion
      const node = await paintModelToCanvas(model, images, url);

      if (node) {
        // Position the new frame
        node.x = currentX;
        node.y = currentY;
        currentX += node.width + SPACING;

        // Select and scroll to the new node
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);

        figma.ui.postMessage({
          type: 'paint-complete',
          url,
          nodeId: node.id,
        });
      }
    } catch (error) {
      console.error('Paint error:', error);
      figma.ui.postMessage({
        type: 'paint-error',
        url: msg.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  if (msg.type === 'reset-position') {
    currentX = 0;
    currentY = 0;
  }

  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

/**
 * Paint the html.to.design model to the Figma canvas
 * This is a simplified implementation - for full fidelity, use the c2d-sdk
 */
async function paintModelToCanvas(
  model: C2DModel,
  images: Record<string, Uint8Array>,
  url: string
): Promise<FrameNode | null> {
  // Create a frame for this page
  const frame = figma.createFrame();
  frame.name = getPageNameFromUrl(url);

  // Set frame size from model root
  if (model.size) {
    frame.resize(model.size.width || 1440, model.size.height || 900);
  } else {
    frame.resize(1440, 900);
  }

  // Set background color
  if (model.background) {
    frame.fills = [{ type: 'SOLID', color: parseColor(model.background) }];
  } else {
    frame.fills = [{ type: 'SOLID', color: { r: 0.04, g: 0.04, b: 0.04 } }]; // #0a0a0a
  }

  // Process children recursively
  if (model.children && Array.isArray(model.children)) {
    for (const child of model.children) {
      const childNode = await createNodeFromModel(child, images);
      if (childNode) {
        frame.appendChild(childNode);
      }
    }
  }

  return frame;
}

/**
 * Create a Figma node from a c2d model node
 */
async function createNodeFromModel(
  node: C2DNode,
  images: Record<string, Uint8Array>
): Promise<SceneNode | null> {
  try {
    switch (node.type) {
      case 'FRAME':
      case 'GROUP':
        return await createFrame(node, images);
      case 'RECTANGLE':
        return await createRectangle(node, images);
      case 'TEXT':
        return await createText(node);
      case 'VECTOR':
        return await createVector(node);
      case 'IMAGE':
        return await createImage(node, images);
      default:
        // Default to frame for unknown types
        return await createFrame(node, images);
    }
  } catch (error) {
    console.warn(`Failed to create node: ${node.type}`, error);
    return null;
  }
}

async function createFrame(node: C2DNode, images: Record<string, Uint8Array>): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = node.name || 'Frame';

  // Set position and size
  if (node.x !== undefined) frame.x = node.x;
  if (node.y !== undefined) frame.y = node.y;
  if (node.size) {
    frame.resize(node.size.width || 100, node.size.height || 100);
  }

  // Set fills
  if (node.background) {
    frame.fills = [{ type: 'SOLID', color: parseColor(node.background) }];
  } else if (node.fills) {
    frame.fills = node.fills;
  } else {
    frame.fills = [];
  }

  // Set border radius
  if (node.cornerRadius !== undefined) {
    frame.cornerRadius = node.cornerRadius;
  }

  // Set opacity
  if (node.opacity !== undefined) {
    frame.opacity = node.opacity;
  }

  // Set auto-layout if specified
  if (node.layoutMode) {
    frame.layoutMode = node.layoutMode;
    if (node.itemSpacing !== undefined) frame.itemSpacing = node.itemSpacing;
    if (node.paddingLeft !== undefined) frame.paddingLeft = node.paddingLeft;
    if (node.paddingRight !== undefined) frame.paddingRight = node.paddingRight;
    if (node.paddingTop !== undefined) frame.paddingTop = node.paddingTop;
    if (node.paddingBottom !== undefined) frame.paddingBottom = node.paddingBottom;
  }

  // Process children
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const childNode = await createNodeFromModel(child, images);
      if (childNode) {
        frame.appendChild(childNode);
      }
    }
  }

  return frame;
}

async function createRectangle(node: C2DNode, images: Record<string, Uint8Array>): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.name = node.name || 'Rectangle';

  if (node.x !== undefined) rect.x = node.x;
  if (node.y !== undefined) rect.y = node.y;
  if (node.size) {
    rect.resize(node.size.width || 100, node.size.height || 100);
  }

  if (node.background) {
    rect.fills = [{ type: 'SOLID', color: parseColor(node.background) }];
  } else if (node.fills) {
    rect.fills = node.fills;
  }

  if (node.cornerRadius !== undefined) {
    rect.cornerRadius = node.cornerRadius;
  }

  if (node.opacity !== undefined) {
    rect.opacity = node.opacity;
  }

  // Handle image fill
  if (node.imageRef && images[node.imageRef]) {
    const imageHash = figma.createImage(images[node.imageRef]).hash;
    rect.fills = [{
      type: 'IMAGE',
      imageHash,
      scaleMode: 'FILL',
    }];
  }

  return rect;
}

async function createText(node: C2DNode): Promise<TextNode> {
  const text = figma.createText();
  text.name = node.name || 'Text';

  if (node.x !== undefined) text.x = node.x;
  if (node.y !== undefined) text.y = node.y;

  // Load font before setting text
  try {
    const fontFamily = node.fontName?.family || 'Inter';
    const fontStyle = node.fontName?.style || 'Regular';
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  } catch {
    // Fallback to Inter if font not available
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }

  if (node.characters) {
    text.characters = node.characters;
  }

  if (node.fontSize) {
    text.fontSize = node.fontSize;
  }

  if (node.color) {
    text.fills = [{ type: 'SOLID', color: parseColor(node.color) }];
  }

  if (node.textAlignHorizontal) {
    text.textAlignHorizontal = node.textAlignHorizontal;
  }

  if (node.opacity !== undefined) {
    text.opacity = node.opacity;
  }

  return text;
}

async function createVector(node: C2DNode): Promise<VectorNode | RectangleNode> {
  // Simplified: create a rectangle placeholder for vectors
  const rect = figma.createRectangle();
  rect.name = node.name || 'Vector';

  if (node.x !== undefined) rect.x = node.x;
  if (node.y !== undefined) rect.y = node.y;
  if (node.size) {
    rect.resize(node.size.width || 24, node.size.height || 24);
  }

  if (node.fills) {
    rect.fills = node.fills;
  }

  return rect;
}

async function createImage(node: C2DNode, images: Record<string, Uint8Array>): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.name = node.name || 'Image';

  if (node.x !== undefined) rect.x = node.x;
  if (node.y !== undefined) rect.y = node.y;
  if (node.size) {
    rect.resize(node.size.width || 100, node.size.height || 100);
  }

  if (node.imageRef && images[node.imageRef]) {
    const imageHash = figma.createImage(images[node.imageRef]).hash;
    rect.fills = [{
      type: 'IMAGE',
      imageHash,
      scaleMode: 'FILL',
    }];
  }

  return rect;
}

/**
 * Parse color string to Figma RGB
 */
function parseColor(color: string | { r: number; g: number; b: number }): RGB {
  if (typeof color === 'object') {
    return { r: color.r, g: color.g, b: color.b };
  }

  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b };
  }

  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]) / 255,
      g: parseInt(rgbMatch[2]) / 255,
      b: parseInt(rgbMatch[3]) / 255,
    };
  }

  // Default to white
  return { r: 1, g: 1, b: 1 };
}

/**
 * Extract page name from URL
 */
function getPageNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    if (path === '/' || path === '') {
      return 'Homepage';
    }
    // Convert /games/some-game to "Games - Some Game"
    const parts = path.split('/').filter(Boolean);
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' - ');
  } catch {
    return 'Imported Page';
  }
}

// Type definitions for c2d model
interface C2DModel {
  type?: string;
  name?: string;
  size?: { width?: number; height?: number };
  background?: string;
  children?: C2DNode[];
}

interface C2DNode {
  type?: string;
  name?: string;
  x?: number;
  y?: number;
  size?: { width?: number; height?: number };
  background?: string;
  fills?: Paint[];
  cornerRadius?: number;
  opacity?: number;
  children?: C2DNode[];
  characters?: string;
  fontSize?: number;
  fontName?: { family: string; style: string };
  color?: string;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  imageRef?: string;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}
