"use strict";
(() => {
  // code.ts
  figma.showUI(__html__, {
    width: 400,
    height: 520,
    themeColors: true
  });
  var currentX = 0;
  var currentY = 0;
  var SPACING = 100;
  figma.ui.onmessage = async (msg) => {
    if (msg.type === "paint-to-canvas") {
      try {
        const { model, images, url } = msg;
        const node = await paintModelToCanvas(model, images, url);
        if (node) {
          node.x = currentX;
          node.y = currentY;
          currentX += node.width + SPACING;
          figma.currentPage.selection = [node];
          figma.viewport.scrollAndZoomIntoView([node]);
          figma.ui.postMessage({
            type: "paint-complete",
            url,
            nodeId: node.id
          });
        }
      } catch (error) {
        console.error("Paint error:", error);
        figma.ui.postMessage({
          type: "paint-error",
          url: msg.url,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (msg.type === "reset-position") {
      currentX = 0;
      currentY = 0;
    }
    if (msg.type === "close") {
      figma.closePlugin();
    }
  };
  async function paintModelToCanvas(model, images, url) {
    const frame = figma.createFrame();
    frame.name = getPageNameFromUrl(url);
    if (model.size) {
      frame.resize(model.size.width || 1440, model.size.height || 900);
    } else {
      frame.resize(1440, 900);
    }
    if (model.background) {
      frame.fills = [{ type: "SOLID", color: parseColor(model.background) }];
    } else {
      frame.fills = [{ type: "SOLID", color: { r: 0.04, g: 0.04, b: 0.04 } }];
    }
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
  async function createNodeFromModel(node, images) {
    try {
      switch (node.type) {
        case "FRAME":
        case "GROUP":
          return await createFrame(node, images);
        case "RECTANGLE":
          return await createRectangle(node, images);
        case "TEXT":
          return await createText(node);
        case "VECTOR":
          return await createVector(node);
        case "IMAGE":
          return await createImage(node, images);
        default:
          return await createFrame(node, images);
      }
    } catch (error) {
      console.warn(`Failed to create node: ${node.type}`, error);
      return null;
    }
  }
  async function createFrame(node, images) {
    const frame = figma.createFrame();
    frame.name = node.name || "Frame";
    if (node.x !== void 0)
      frame.x = node.x;
    if (node.y !== void 0)
      frame.y = node.y;
    if (node.size) {
      frame.resize(node.size.width || 100, node.size.height || 100);
    }
    if (node.background) {
      frame.fills = [{ type: "SOLID", color: parseColor(node.background) }];
    } else if (node.fills) {
      frame.fills = node.fills;
    } else {
      frame.fills = [];
    }
    if (node.cornerRadius !== void 0) {
      frame.cornerRadius = node.cornerRadius;
    }
    if (node.opacity !== void 0) {
      frame.opacity = node.opacity;
    }
    if (node.layoutMode) {
      frame.layoutMode = node.layoutMode;
      if (node.itemSpacing !== void 0)
        frame.itemSpacing = node.itemSpacing;
      if (node.paddingLeft !== void 0)
        frame.paddingLeft = node.paddingLeft;
      if (node.paddingRight !== void 0)
        frame.paddingRight = node.paddingRight;
      if (node.paddingTop !== void 0)
        frame.paddingTop = node.paddingTop;
      if (node.paddingBottom !== void 0)
        frame.paddingBottom = node.paddingBottom;
    }
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
  async function createRectangle(node, images) {
    const rect = figma.createRectangle();
    rect.name = node.name || "Rectangle";
    if (node.x !== void 0)
      rect.x = node.x;
    if (node.y !== void 0)
      rect.y = node.y;
    if (node.size) {
      rect.resize(node.size.width || 100, node.size.height || 100);
    }
    if (node.background) {
      rect.fills = [{ type: "SOLID", color: parseColor(node.background) }];
    } else if (node.fills) {
      rect.fills = node.fills;
    }
    if (node.cornerRadius !== void 0) {
      rect.cornerRadius = node.cornerRadius;
    }
    if (node.opacity !== void 0) {
      rect.opacity = node.opacity;
    }
    if (node.imageRef && images[node.imageRef]) {
      const imageHash = figma.createImage(images[node.imageRef]).hash;
      rect.fills = [{
        type: "IMAGE",
        imageHash,
        scaleMode: "FILL"
      }];
    }
    return rect;
  }
  async function createText(node) {
    var _a, _b;
    const text = figma.createText();
    text.name = node.name || "Text";
    if (node.x !== void 0)
      text.x = node.x;
    if (node.y !== void 0)
      text.y = node.y;
    try {
      const fontFamily = ((_a = node.fontName) == null ? void 0 : _a.family) || "Inter";
      const fontStyle = ((_b = node.fontName) == null ? void 0 : _b.style) || "Regular";
      await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
    } catch (e) {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    }
    if (node.characters) {
      text.characters = node.characters;
    }
    if (node.fontSize) {
      text.fontSize = node.fontSize;
    }
    if (node.color) {
      text.fills = [{ type: "SOLID", color: parseColor(node.color) }];
    }
    if (node.textAlignHorizontal) {
      text.textAlignHorizontal = node.textAlignHorizontal;
    }
    if (node.opacity !== void 0) {
      text.opacity = node.opacity;
    }
    return text;
  }
  async function createVector(node) {
    const rect = figma.createRectangle();
    rect.name = node.name || "Vector";
    if (node.x !== void 0)
      rect.x = node.x;
    if (node.y !== void 0)
      rect.y = node.y;
    if (node.size) {
      rect.resize(node.size.width || 24, node.size.height || 24);
    }
    if (node.fills) {
      rect.fills = node.fills;
    }
    return rect;
  }
  async function createImage(node, images) {
    const rect = figma.createRectangle();
    rect.name = node.name || "Image";
    if (node.x !== void 0)
      rect.x = node.x;
    if (node.y !== void 0)
      rect.y = node.y;
    if (node.size) {
      rect.resize(node.size.width || 100, node.size.height || 100);
    }
    if (node.imageRef && images[node.imageRef]) {
      const imageHash = figma.createImage(images[node.imageRef]).hash;
      rect.fills = [{
        type: "IMAGE",
        imageHash,
        scaleMode: "FILL"
      }];
    }
    return rect;
  }
  function parseColor(color) {
    if (typeof color === "object") {
      return { r: color.r, g: color.g, b: color.b };
    }
    if (color.startsWith("#")) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b };
    }
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]) / 255,
        g: parseInt(rgbMatch[2]) / 255,
        b: parseInt(rgbMatch[3]) / 255
      };
    }
    return { r: 1, g: 1, b: 1 };
  }
  function getPageNameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      if (path === "/" || path === "") {
        return "Homepage";
      }
      const parts = path.split("/").filter(Boolean);
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")).join(" - ");
    } catch (e) {
      return "Imported Page";
    }
  }
})();
