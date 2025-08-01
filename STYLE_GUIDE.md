# Full Uproar Style Guide

## Core Design Principles
- Dark, gaming-oriented aesthetic
- Subtle orange accents (not overwhelming)
- High contrast for readability
- Consistent across all pages
- No bright/harsh gradients that cause eye strain

## Color Palette

### Primary Colors
- **Background Dark**: `#0f172a` - Main page background
- **Background Medium**: `#1e293b` - Card/section backgrounds
- **Background Light**: `#334155` - Borders and subtle dividers

### Accent Colors
- **Orange Primary**: `#f97316` - Main brand color (use sparingly)
- **Orange Light**: `#fdba74` - Text on dark backgrounds
- **Orange Muted**: `rgba(249, 115, 22, 0.2)` - Subtle backgrounds
- **Orange Border**: `rgba(249, 115, 22, 0.3)` - Borders

### Text Colors
- **Text Primary**: `#e2e8f0` - Main text on dark backgrounds
- **Text Secondary**: `#94a3b8` - Muted/secondary text
- **Text Tertiary**: `#64748b` - Very muted text

### Status Colors
- **Success**: `#10b981`
- **Error**: `#ef4444`
- **Warning**: `#f59e0b`
- **Info**: `#3b82f6`

## Typography
- **Headers**: Bold, use orange sparingly for emphasis
- **Body Text**: Regular weight, high contrast
- **Font Sizes**: 
  - H1: 32-36px
  - H2: 24-28px
  - H3: 18-20px
  - Body: 14-16px
  - Small: 12px

## Components

### Headers/Banners
```css
/* AVOID bright gradients */
/* BAD: background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); */

/* GOOD: Subtle dark header */
background: rgba(30, 41, 59, 0.95);
border-bottom: 2px solid rgba(249, 115, 22, 0.3);
```

### Cards
```css
background: rgba(30, 41, 59, 0.8);
border: 1px solid #334155;
border-radius: 8px;
/* Optional subtle orange border on hover */
```

### Buttons
```css
/* Primary Button */
background: #f97316;
color: white;
/* Use sparingly - only for main CTAs */

/* Secondary Button */
background: transparent;
border: 1px solid rgba(249, 115, 22, 0.5);
color: #fdba74;
```

### Menus/Dropdowns
```css
background: #1e293b;
border: 1px solid #334155;
color: #e2e8f0;
/* Menu items */
color: #e2e8f0;
hover: background: rgba(249, 115, 22, 0.1);
```

## Page Headers
Instead of bright orange gradients, use:
```css
background: rgba(17, 24, 39, 0.95);
border-bottom: 2px solid rgba(249, 115, 22, 0.3);
/* Title in subtle orange */
color: #fdba74;
```

## Accessibility
- Minimum contrast ratio: 4.5:1 for normal text
- Never use orange text on orange backgrounds
- Ensure all interactive elements have hover states
- Test for color blindness compatibility

## Implementation Notes
1. Orange should be an accent, not dominant
2. Dark backgrounds should be the primary theme
3. Use borders and subtle backgrounds for separation
4. Avoid harsh gradients that strain eyes
5. Consistency across all pages is key