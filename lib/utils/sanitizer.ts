// HTML Sanitization utilities
// Note: For production use, install and use DOMPurify:
// npm install isomorphic-dompurify @types/dompurify

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
}

const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'i', 'b',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img'
];

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height'],
  '*': ['class', 'id']
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * This is a basic implementation - use DOMPurify in production
 */
export function sanitizeHtml(
  html: string, 
  options: SanitizeOptions = {}
): string {
  if (!html) return '';

  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    stripTags = false
  } = options;

  // In production, use DOMPurify:
  // import DOMPurify from 'isomorphic-dompurify';
  // return DOMPurify.sanitize(html, {
  //   ALLOWED_TAGS: allowedTags,
  //   ALLOWED_ATTR: Object.keys(allowedAttributes).reduce((acc, tag) => {
  //     allowedAttributes[tag].forEach(attr => acc.push(attr));
  //     return acc;
  //   }, [] as string[])
  // });

  // Basic sanitization (NOT SECURE FOR PRODUCTION)
  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URIs except for images
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');

  if (stripTags) {
    // Strip all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  } else {
    // Remove non-allowed tags
    const allowedTagsRegex = new RegExp(
      `<(?!\\/?(${allowedTags.join('|')})(\\s|>|\\/))[^>]*>`, 
      'gi'
    );
    sanitized = sanitized.replace(allowedTagsRegex, '');
  }

  return sanitized.trim();
}

/**
 * Remove HTML tags and trim whitespace
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

/**
 * Sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize user input for display
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any potential script content
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to prevent abuse
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    // Prevent javascript: and data: URLs
    if (url.toLowerCase().includes('javascript:') || 
        url.toLowerCase().includes('data:')) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (url.startsWith('/') && !url.includes('//')) {
      return url;
    }
    
    return null;
  }
}

/**
 * Sanitize file names to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // Remove any directory traversal attempts
  let sanitized = fileName.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove any potentially dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 250 - ext.length);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
}

// TODO: For production, install and use DOMPurify:
// npm install isomorphic-dompurify @types/dompurify
//
// Then replace the basic sanitizeHtml implementation with:
// import DOMPurify from 'isomorphic-dompurify';
// 
// export function sanitizeHtml(html: string, options: SanitizeOptions = {}): string {
//   const config = {
//     ALLOWED_TAGS: options.allowedTags || DEFAULT_ALLOWED_TAGS,
//     ALLOWED_ATTR: options.allowedAttributes ? 
//       Object.entries(options.allowedAttributes).flatMap(([tag, attrs]) => 
//         attrs.map(attr => `${tag === '*' ? '' : tag + '-'}${attr}`)
//       ) : [],
//     KEEP_CONTENT: !options.stripTags,
//   };
//   
//   return DOMPurify.sanitize(html, config);
// }