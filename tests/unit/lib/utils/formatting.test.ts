import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  truncateText,
  pluralize,
  formatFileSize,
  formatOrderStatus,
  getOrderStatusColor,
  parseJsonSafely,
  getInitials,
  formatPercentage,
  formatPlayerCount,
  formatPlayTime,
  formatAgeRating,
  formatCategory,
  stripHtmlTags,
} from '@/lib/utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format cents to USD currency', () => {
      expect(formatCurrency(1999)).toBe('$19.99');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle single dollar', () => {
      expect(formatCurrency(100)).toBe('$1.00');
    });

    it('should handle large amounts', () => {
      expect(formatCurrency(999999)).toBe('$9,999.99');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-500)).toBe('-$5.00');
    });

    it('should handle single cents', () => {
      expect(formatCurrency(1)).toBe('$0.01');
    });
  });

  describe('formatDate', () => {
    it('should format Date objects', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('June');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('should format ISO string dates', () => {
      // Use midday to avoid timezone boundary issues
      const result = formatDate('2025-06-15T12:00:00Z');
      expect(result).toContain('2025');
    });

    it('should accept custom format options', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const result = formatDate(date, { month: 'short', day: 'numeric' });
      expect(result).toContain('Jun');
      expect(result).toContain('15');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Just now" for recent times', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });

    it('should use singular for 1 minute', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    });

    it('should return hours ago', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
    });

    it('should use singular for 1 hour', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });

    it('should return days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');
    });

    it('should use singular for 1 day', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });

    it('should fall back to formatted date for > 7 days', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoWeeksAgo);
      // Should be a formatted date, not "X days ago"
      expect(result).not.toContain('days ago');
    });

    it('should accept string dates', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });
  });

  describe('truncateText', () => {
    it('should pass through short text', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('should truncate long text with ellipsis', () => {
      expect(truncateText('this is a long sentence', 10)).toBe('this is...');
    });

    it('should not truncate text at exact boundary', () => {
      expect(truncateText('hello', 5)).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count 1', () => {
      expect(pluralize(1, 'item')).toBe('item');
    });

    it('should auto-pluralize with s for count > 1', () => {
      expect(pluralize(2, 'item')).toBe('items');
    });

    it('should auto-pluralize for count 0', () => {
      expect(pluralize(0, 'item')).toBe('items');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'mouse', 'mice')).toBe('mice');
    });

    it('should return singular for custom plural when count is 1', () => {
      expect(pluralize(1, 'mouse', 'mice')).toBe('mouse');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500.0 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('should handle fractional sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0.0 B');
    });
  });

  describe('formatOrderStatus', () => {
    it('should format known statuses', () => {
      expect(formatOrderStatus('pending')).toBe('Pending');
      expect(formatOrderStatus('processing')).toBe('Processing');
      expect(formatOrderStatus('shipped')).toBe('Shipped');
      expect(formatOrderStatus('delivered')).toBe('Delivered');
      expect(formatOrderStatus('cancelled')).toBe('Cancelled');
    });

    it('should be case-insensitive', () => {
      expect(formatOrderStatus('PENDING')).toBe('Pending');
      expect(formatOrderStatus('Shipped')).toBe('Shipped');
    });

    it('should pass through unknown statuses', () => {
      expect(formatOrderStatus('custom_status')).toBe('custom_status');
    });
  });

  describe('getOrderStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(getOrderStatusColor('pending')).toBe('#f59e0b');
      expect(getOrderStatusColor('processing')).toBe('#3b82f6');
      expect(getOrderStatusColor('shipped')).toBe('#7D55C7');
      expect(getOrderStatusColor('delivered')).toBe('#10b981');
      expect(getOrderStatusColor('cancelled')).toBe('#ef4444');
    });

    it('should be case-insensitive', () => {
      expect(getOrderStatusColor('DELIVERED')).toBe('#10b981');
    });

    it('should return gray for unknown statuses', () => {
      expect(getOrderStatusColor('unknown')).toBe('#6b7280');
    });
  });

  describe('parseJsonSafely', () => {
    it('should parse valid JSON', () => {
      expect(parseJsonSafely('{"key": "value"}', {})).toEqual({ key: 'value' });
    });

    it('should parse JSON arrays', () => {
      expect(parseJsonSafely('[1,2,3]', [])).toEqual([1, 2, 3]);
    });

    it('should return fallback for invalid JSON', () => {
      expect(parseJsonSafely('not json', 'default')).toBe('default');
    });

    it('should return fallback for null input', () => {
      expect(parseJsonSafely(null, [])).toEqual([]);
    });

    it('should return fallback for empty string', () => {
      expect(parseJsonSafely('', 'fallback')).toBe('fallback');
    });
  });

  describe('getInitials', () => {
    it('should get initials from two-word name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should get single initial from one-word name', () => {
      expect(getInitials('Alice')).toBe('A');
    });

    it('should truncate to 2 characters for 3+ word names', () => {
      expect(getInitials('John Michael Doe')).toBe('JM');
    });

    it('should uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal to percentage', () => {
      expect(formatPercentage(0.5)).toBe('50%');
    });

    it('should handle 100%', () => {
      expect(formatPercentage(1)).toBe('100%');
    });

    it('should handle 0%', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should support decimal places', () => {
      expect(formatPercentage(0.123, 1)).toBe('12.3%');
    });

    it('should support multiple decimal places', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
    });
  });

  // ========================================
  // Game Enum Formatters
  // ========================================

  describe('formatPlayerCount', () => {
    it('should format all known enum values', () => {
      expect(formatPlayerCount('SINGLE')).toBe('1 Player');
      expect(formatPlayerCount('TWO')).toBe('2 Players');
      expect(formatPlayerCount('TWO_PLUS')).toBe('2+ Players');
      expect(formatPlayerCount('TWO_TO_FOUR')).toBe('2-4 Players');
      expect(formatPlayerCount('TWO_TO_SIX')).toBe('2-6 Players');
      expect(formatPlayerCount('THREE_TO_FIVE')).toBe('3-5 Players');
      expect(formatPlayerCount('THREE_TO_SIX')).toBe('3-6 Players');
      expect(formatPlayerCount('FOUR_TO_EIGHT')).toBe('4-8 Players');
      expect(formatPlayerCount('PARTY')).toBe('6+ Players');
      expect(formatPlayerCount('CUSTOM')).toBe('Custom');
      expect(formatPlayerCount('VARIES')).toBe('Varies');
    });

    it('should return empty string for null', () => {
      expect(formatPlayerCount(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatPlayerCount(undefined)).toBe('');
    });

    it('should pass through unknown values', () => {
      expect(formatPlayerCount('UNKNOWN_VALUE')).toBe('UNKNOWN_VALUE');
    });
  });

  describe('formatPlayTime', () => {
    it('should format all known enum values', () => {
      expect(formatPlayTime('QUICK')).toBe('< 30 min');
      expect(formatPlayTime('SHORT')).toBe('30-60 min');
      expect(formatPlayTime('MEDIUM')).toBe('60-90 min');
      expect(formatPlayTime('LONG')).toBe('90-120 min');
      expect(formatPlayTime('EXTENDED')).toBe('2+ hours');
      expect(formatPlayTime('VARIES')).toBe('Varies');
    });

    it('should handle legacy VARIABLE value', () => {
      expect(formatPlayTime('VARIABLE')).toBe('Varies');
    });

    it('should return empty string for null', () => {
      expect(formatPlayTime(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatPlayTime(undefined)).toBe('');
    });

    it('should pass through unknown values', () => {
      expect(formatPlayTime('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('formatAgeRating', () => {
    it('should format all known enum values', () => {
      expect(formatAgeRating('ALL_AGES')).toBe('All Ages');
      expect(formatAgeRating('ELEVEN_PLUS')).toBe('11+');
      expect(formatAgeRating('FOURTEEN_PLUS')).toBe('14+');
      expect(formatAgeRating('SIXTEEN_PLUS')).toBe('16+');
      expect(formatAgeRating('EIGHTEEN_PLUS')).toBe('18+');
      expect(formatAgeRating('TWENTYONE_PLUS')).toBe('21+');
    });

    it('should return empty string for null', () => {
      expect(formatAgeRating(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatAgeRating(undefined)).toBe('');
    });

    it('should pass through unknown values', () => {
      expect(formatAgeRating('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('formatCategory', () => {
    it('should format all known enum values', () => {
      expect(formatCategory('GAME')).toBe('Game');
      expect(formatCategory('EXPANSION')).toBe('Expansion');
      expect(formatCategory('ACCESSORY')).toBe('Accessory');
      expect(formatCategory('MOD')).toBe('Game Mod');
      expect(formatCategory('BUNDLE')).toBe('Bundle');
    });

    it('should return empty string for null', () => {
      expect(formatCategory(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatCategory(undefined)).toBe('');
    });

    it('should pass through unknown values', () => {
      expect(formatCategory('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('stripHtmlTags', () => {
    it('should strip HTML tags', () => {
      expect(stripHtmlTags('<b>bold</b> text')).toBe('bold text');
    });

    it('should strip nested tags', () => {
      expect(stripHtmlTags('<div><p>nested</p></div>')).toBe('nested');
    });

    it('should strip script tags', () => {
      expect(stripHtmlTags('<script>alert("xss")</script>safe')).toBe('alert("xss")safe');
    });

    it('should decode HTML entities', () => {
      expect(stripHtmlTags('&amp;')).toBe('&');
      expect(stripHtmlTags('&lt;')).toBe('<');
      expect(stripHtmlTags('&gt;')).toBe('>');
      expect(stripHtmlTags('&quot;')).toBe('"');
      expect(stripHtmlTags('&#39;')).toBe("'");
      // &nbsp; decodes to a single space, but .trim() removes it when it's the only content
      expect(stripHtmlTags('hello&nbsp;world')).toBe('hello world');
      expect(stripHtmlTags('&mdash;')).toBe('—');
      expect(stripHtmlTags('&ndash;')).toBe('–');
      expect(stripHtmlTags('&hellip;')).toBe('...');
      expect(stripHtmlTags('&copy;')).toBe('©');
      expect(stripHtmlTags('&reg;')).toBe('®');
      expect(stripHtmlTags('&trade;')).toBe('™');
    });

    it('should clean up extra whitespace', () => {
      expect(stripHtmlTags('  hello   world  ')).toBe('hello world');
    });

    it('should return empty string for empty input', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('should return empty string for null-ish input', () => {
      expect(stripHtmlTags(null as unknown as string)).toBe('');
      expect(stripHtmlTags(undefined as unknown as string)).toBe('');
    });
  });
});
