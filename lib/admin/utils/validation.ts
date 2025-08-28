/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

import { ValidationError } from '../types';
import { logger } from './logger';

// ============================================================================
// SANITIZATION FUNCTIONS
// ============================================================================

/**
 * Remove HTML tags and scripts from string
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other HTML tags but keep content
  sanitized = sanitized.replace(/<[^>]+>/g, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = sanitized;
  sanitized = textarea.value;
  
  return sanitized.trim();
}

/**
 * Sanitize input for use in SQL queries (prevent SQL injection)
 */
export function sanitizeSql(input: string): string {
  if (!input) return '';
  
  // Escape single quotes
  let sanitized = input.replace(/'/g, "''");
  
  // Remove SQL keywords that could be used for injection
  const sqlKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT', 
    'UNION', 'EXEC', 'EXECUTE', 'CREATE', 'ALTER'
  ];
  
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized;
}

/**
 * Sanitize filename to prevent directory traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';
  
  // Remove directory traversal patterns
  let sanitized = filename.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove special characters except dots and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 240);
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
}

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(url: string, allowedDomains?: string[]): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn('Invalid URL protocol', { url, protocol: parsed.protocol });
      return '';
    }
    
    // Check against allowed domains if provided
    if (allowedDomains && allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        logger.warn('URL domain not in allowlist', { url, hostname: parsed.hostname });
        return '';
      }
    }
    
    return parsed.toString();
  } catch (error) {
    logger.warn('Invalid URL', { url, error });
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Basic email sanitization
  const sanitized = email.toLowerCase().trim();
  
  // Remove dangerous characters
  return sanitized.replace(/[<>]/g, '');
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Keep only digits, spaces, hyphens, parentheses, and plus sign
  return phone.replace(/[^0-9\s\-()+ ]/g, '');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { field: 'email', message: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Invalid email address' };
  }
  
  if (email.length > 254) {
    return { field: 'email', message: 'Email address too long' };
  }
  
  return null;
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string, required: boolean = false): ValidationError | null {
  if (!phone && !required) return null;
  
  if (!phone && required) {
    return { field: 'phone', message: 'Phone number is required' };
  }
  
  // Remove formatting for validation
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10 || digits.length > 15) {
    return { field: 'phone', message: 'Invalid phone number length' };
  }
  
  return null;
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required: boolean = false): ValidationError | null {
  if (!url && !required) return null;
  
  if (!url && required) {
    return { field: 'url', message: 'URL is required' };
  }
  
  try {
    new URL(url);
    return null;
  } catch {
    return { field: 'url', message: 'Invalid URL format' };
  }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
    return errors;
  }
  
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters', code: 'MIN_LENGTH' });
  }
  
  if (password.length > 128) {
    errors.push({ field: 'password', message: 'Password too long', code: 'MAX_LENGTH' });
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain an uppercase letter', code: 'NO_UPPERCASE' });
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain a lowercase letter', code: 'NO_LOWERCASE' });
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain a number', code: 'NO_NUMBER' });
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain a special character', code: 'NO_SPECIAL' });
  }
  
  return errors;
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationError | null {
  if (!cardNumber) {
    return { field: 'cardNumber', message: 'Card number is required' };
  }
  
  // Remove spaces and hyphens
  const digits = cardNumber.replace(/[\s-]/g, '');
  
  if (!/^\d+$/.test(digits)) {
    return { field: 'cardNumber', message: 'Card number must contain only digits' };
  }
  
  if (digits.length < 13 || digits.length > 19) {
    return { field: 'cardNumber', message: 'Invalid card number length' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  if (sum % 10 !== 0) {
    return { field: 'cardNumber', message: 'Invalid card number' };
  }
  
  return null;
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string
): ValidationError | null {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (isNaN(start.getTime())) {
    return { field: 'startDate', message: 'Invalid start date' };
  }
  
  if (isNaN(end.getTime())) {
    return { field: 'endDate', message: 'Invalid end date' };
  }
  
  if (start > end) {
    return { field: 'dateRange', message: 'Start date must be before end date' };
  }
  
  return null;
}

/**
 * Validate money amount
 */
export function validateMoney(amount: number | string, min?: number, max?: number): ValidationError | null {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(value)) {
    return { field: 'amount', message: 'Invalid amount' };
  }
  
  if (value < 0) {
    return { field: 'amount', message: 'Amount cannot be negative' };
  }
  
  if (min !== undefined && value < min) {
    return { field: 'amount', message: `Amount must be at least ${min}` };
  }
  
  if (max !== undefined && value > max) {
    return { field: 'amount', message: `Amount cannot exceed ${max}` };
  }
  
  // Check for more than 2 decimal places
  if (Math.floor(value * 100) !== value * 100) {
    return { field: 'amount', message: 'Amount cannot have more than 2 decimal places' };
  }
  
  return null;
}

/**
 * Validate percentage (0-100)
 */
export function validatePercentage(value: number | string): ValidationError | null {
  const percent = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(percent)) {
    return { field: 'percentage', message: 'Invalid percentage' };
  }
  
  if (percent < 0 || percent > 100) {
    return { field: 'percentage', message: 'Percentage must be between 0 and 100' };
  }
  
  return null;
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => ValidationError | null;
}

interface ValidationSchema {
  [field: string]: ValidationRule;
}

/**
 * Validate form data against a schema
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: ValidationSchema
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required validation
    if (rules.required && !value) {
      errors.push({ field, message: `${field} is required` });
      continue;
    }
    
    // Skip other validations if not required and empty
    if (!value && !rules.required) continue;
    
    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push({ 
        field, 
        message: `${field} must be at least ${rules.minLength} characters` 
      });
    }
    
    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push({ 
        field, 
        message: `${field} cannot exceed ${rules.maxLength} characters` 
      });
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push({ field, message: `${field} format is invalid` });
    }
    
    // Custom validation
    if (rules.custom) {
      const error = rules.custom(value);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return errors;
}

// ============================================================================
// XSS PREVENTION
// ============================================================================

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Create safe HTML from user input
 */
export function createSafeHtml(input: string, allowedTags: string[] = []): string {
  // First sanitize
  let safe = sanitizeHtml(input);
  
  // Then escape
  safe = escapeHtml(safe);
  
  // Optionally allow certain tags
  allowedTags.forEach(tag => {
    const regex = new RegExp(`&lt;(${tag})&gt;`, 'gi');
    safe = safe.replace(regex, '<$1>');
    const closeRegex = new RegExp(`&lt;/(${tag})&gt;`, 'gi');
    safe = safe.replace(closeRegex, '</$1>');
  });
  
  return safe;
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitize(
  input: any,
  type: 'email' | 'phone' | 'url' | 'text' | 'html' | 'filename' | 'sql'
): { value: string; error: ValidationError | null } {
  let sanitized: string;
  let error: ValidationError | null = null;
  
  switch (type) {
    case 'email':
      sanitized = sanitizeEmail(String(input));
      error = validateEmail(sanitized);
      break;
      
    case 'phone':
      sanitized = sanitizePhone(String(input));
      error = validatePhone(sanitized);
      break;
      
    case 'url':
      sanitized = sanitizeUrl(String(input));
      error = validateUrl(sanitized);
      break;
      
    case 'html':
      sanitized = sanitizeHtml(String(input));
      break;
      
    case 'filename':
      sanitized = sanitizeFilename(String(input));
      break;
      
    case 'sql':
      sanitized = sanitizeSql(String(input));
      break;
      
    default:
      sanitized = String(input).trim();
  }
  
  return { value: sanitized, error };
}