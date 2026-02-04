// Formatting utilities used throughout the application

/**
 * Format cents to currency display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

/**
 * Format date to display string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return formatDate(dateObj);
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Pluralize word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || `${singular}s`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  
  return statusMap[status.toLowerCase()] || status;
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#7D55C7',
    delivered: '#10b981',
    cancelled: '#ef4444'
  };
  
  return colorMap[status.toLowerCase()] || '#6b7280';
}

/**
 * Parse JSON safely with fallback
 */
export function parseJsonSafely<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Create initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// ============================================================
// GAME ENUM FORMATTERS
// Centralized formatters for consistent display across the site
// ============================================================

/**
 * Format PlayerCount enum to human-readable text
 * Schema values: SINGLE, TWO, TWO_PLUS, TWO_TO_FOUR, TWO_TO_SIX, THREE_TO_FIVE, THREE_TO_SIX, FOUR_TO_EIGHT, PARTY, CUSTOM, VARIES
 */
export function formatPlayerCount(playerCount: string | null | undefined): string {
  if (!playerCount) return '';

  const playerMap: Record<string, string> = {
    'SINGLE': '1 Player',
    'TWO': '2 Players',
    'TWO_PLUS': '2+ Players',
    'TWO_TO_FOUR': '2-4 Players',
    'TWO_TO_SIX': '2-6 Players',
    'THREE_TO_FIVE': '3-5 Players',
    'THREE_TO_SIX': '3-6 Players',
    'FOUR_TO_EIGHT': '4-8 Players',
    'PARTY': '6+ Players',
    'CUSTOM': 'Custom',
    'VARIES': 'Varies',
  };

  return playerMap[playerCount] || playerCount;
}

/**
 * Format PlayTime enum to human-readable text
 * Schema values: QUICK, SHORT, MEDIUM, LONG, EXTENDED, VARIES
 */
export function formatPlayTime(playTime: string | null | undefined): string {
  if (!playTime) return '';

  const playTimeMap: Record<string, string> = {
    'QUICK': '< 30 min',
    'SHORT': '30-60 min',
    'MEDIUM': '60-90 min',
    'LONG': '90-120 min',
    'EXTENDED': '2+ hours',
    'VARIES': 'Varies',
    'VARIABLE': 'Varies', // Backwards compatibility for invalid value
  };

  return playTimeMap[playTime] || playTime;
}

/**
 * Format AgeRating enum to human-readable text
 * Schema values: ALL_AGES, ELEVEN_PLUS, FOURTEEN_PLUS, SIXTEEN_PLUS, EIGHTEEN_PLUS, TWENTYONE_PLUS
 */
export function formatAgeRating(ageRating: string | null | undefined): string {
  if (!ageRating) return '';

  const ageMap: Record<string, string> = {
    'ALL_AGES': 'All Ages',
    'ELEVEN_PLUS': '11+',
    'FOURTEEN_PLUS': '14+',
    'SIXTEEN_PLUS': '16+',
    'EIGHTEEN_PLUS': '18+',
    'TWENTYONE_PLUS': '21+',
  };

  return ageMap[ageRating] || ageRating;
}

/**
 * Format Category enum to human-readable text
 */
export function formatCategory(category: string | null | undefined): string {
  if (!category) return '';

  const categoryMap: Record<string, string> = {
    'GAME': 'Game',
    'EXPANSION': 'Expansion',
    'ACCESSORY': 'Accessory',
    'MOD': 'Game Mod',
    'BUNDLE': 'Bundle',
  };

  return categoryMap[category] || category;
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(text: string): string {
  if (!text) return '';
  
  // Remove HTML tags
  let stripped = text.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  stripped = stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&trade;/g, '™');
    
  // Clean up extra whitespace
  return stripped.replace(/\s+/g, ' ').trim();
}