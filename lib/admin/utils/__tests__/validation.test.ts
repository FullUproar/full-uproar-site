/**
 * Tests for validation and sanitization utilities
 */

import {
  sanitizeHtml,
  sanitizeSql,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  validateEmail,
  validatePhone,
  validateUrl,
  validatePassword,
  validateCreditCard,
  validateDateRange,
  validateMoney,
  validatePercentage,
  validateForm,
  escapeHtml,
  createSafeHtml,
  validateAndSanitize
} from '../validation';

describe('Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      expect(sanitizeHtml(input)).toBe('Hello  World');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'XSS\')">Click me</div>';
      expect(sanitizeHtml(input)).toBe('Click me');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
      expect(sanitizeHtml(input)).not.toContain('javascript:');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should decode HTML entities', () => {
      const input = '&lt;div&gt;Test&lt;/div&gt;';
      expect(sanitizeHtml(input)).toBe('Test');
    });
  });

  describe('sanitizeSql', () => {
    it('should escape single quotes', () => {
      const input = "O'Reilly";
      expect(sanitizeSql(input)).toBe("O''Reilly");
    });

    it('should remove SQL keywords', () => {
      const input = 'SELECT * FROM users; DROP TABLE users';
      const result = sanitizeSql(input);
      expect(result).not.toContain('SELECT');
      expect(result).not.toContain('DROP');
    });

    it('should handle empty input', () => {
      expect(sanitizeSql('')).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove directory traversal patterns', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file*name?.txt')).toBe('file_name_.txt');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result).toMatch(/\.txt$/);
    });

    it('should handle empty input', () => {
      expect(sanitizeFilename('')).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeUrl(url)).toBe(url);
    });

    it('should reject javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should check allowed domains', () => {
      const url = 'https://evil.com';
      expect(sanitizeUrl(url, ['example.com'])).toBe('');
      expect(sanitizeUrl('https://example.com', ['example.com'])).toBe('https://example.com/');
    });

    it('should handle subdomain matching', () => {
      expect(sanitizeUrl('https://api.example.com', ['example.com'])).toBe('https://api.example.com/');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeEmail('test<script>@example.com')).toBe('testscript@example.com');
    });

    it('should handle empty input', () => {
      expect(sanitizeEmail('')).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only valid phone characters', () => {
      expect(sanitizePhone('(555) 123-4567 ext. 890')).toBe('(555) 123-4567  890');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePhone('555-ABC-1234')).toBe('555--1234');
    });

    it('should handle international format', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
    });
  });
});

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name+tag@example.co.uk')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toEqual({
        field: 'email',
        message: 'Email is required'
      });
      expect(validateEmail('notanemail')).toEqual({
        field: 'email',
        message: 'Invalid email address'
      });
      expect(validateEmail('@example.com')).toEqual({
        field: 'email',
        message: 'Invalid email address'
      });
    });

    it('should reject too long emails', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      expect(validateEmail(longEmail)).toEqual({
        field: 'email',
        message: 'Email address too long'
      });
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhone('1234567890')).toBeNull();
      expect(validatePhone('12345678901234')).toBeNull(); // International
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toEqual({
        field: 'phone',
        message: 'Invalid phone number length'
      });
      expect(validatePhone('1234567890123456')).toEqual({
        field: 'phone',
        message: 'Invalid phone number length'
      });
    });

    it('should handle required flag', () => {
      expect(validatePhone('', false)).toBeNull();
      expect(validatePhone('', true)).toEqual({
        field: 'phone',
        message: 'Phone number is required'
      });
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      expect(validateUrl('https://example.com')).toBeNull();
      expect(validateUrl('http://localhost:3000/path')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not a url')).toEqual({
        field: 'url',
        message: 'Invalid URL format'
      });
    });

    it('should handle required flag', () => {
      expect(validateUrl('', false)).toBeNull();
      expect(validateUrl('', true)).toEqual({
        field: 'url',
        message: 'URL is required'
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const errors = validatePassword('MyP@ssw0rd123');
      expect(errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const errors = validatePassword('weak');
      expect(errors).toContainEqual(
        expect.objectContaining({ code: 'MIN_LENGTH' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ code: 'NO_UPPERCASE' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ code: 'NO_NUMBER' })
      );
      expect(errors).toContainEqual(
        expect.objectContaining({ code: 'NO_SPECIAL' })
      );
    });

    it('should reject empty password', () => {
      const errors = validatePassword('');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Password is required');
    });

    it('should reject too long passwords', () => {
      const errors = validatePassword('A1!' + 'a'.repeat(130));
      expect(errors).toContainEqual(
        expect.objectContaining({ code: 'MAX_LENGTH' })
      );
    });
  });

  describe('validateCreditCard', () => {
    it('should accept valid card numbers', () => {
      // Valid test card numbers
      expect(validateCreditCard('4111111111111111')).toBeNull(); // Visa
      expect(validateCreditCard('5500000000000004')).toBeNull(); // Mastercard
      expect(validateCreditCard('340000000000009')).toBeNull(); // Amex
    });

    it('should reject invalid card numbers', () => {
      expect(validateCreditCard('1234567890123456')).toEqual({
        field: 'cardNumber',
        message: 'Invalid card number'
      });
    });

    it('should handle formatting', () => {
      expect(validateCreditCard('4111-1111-1111-1111')).toBeNull();
      expect(validateCreditCard('4111 1111 1111 1111')).toBeNull();
    });

    it('should reject non-numeric input', () => {
      expect(validateCreditCard('abcd1234567890ab')).toEqual({
        field: 'cardNumber',
        message: 'Card number must contain only digits'
      });
    });

    it('should reject invalid length', () => {
      expect(validateCreditCard('1234')).toEqual({
        field: 'cardNumber',
        message: 'Invalid card number length'
      });
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(validateDateRange(start, end)).toBeNull();
    });

    it('should reject invalid date ranges', () => {
      const start = new Date('2024-12-31');
      const end = new Date('2024-01-01');
      expect(validateDateRange(start, end)).toEqual({
        field: 'dateRange',
        message: 'Start date must be before end date'
      });
    });

    it('should handle string dates', () => {
      expect(validateDateRange('2024-01-01', '2024-12-31')).toBeNull();
    });

    it('should reject invalid dates', () => {
      expect(validateDateRange('invalid', '2024-01-01')).toEqual({
        field: 'startDate',
        message: 'Invalid start date'
      });
      expect(validateDateRange('2024-01-01', 'invalid')).toEqual({
        field: 'endDate',
        message: 'Invalid end date'
      });
    });
  });

  describe('validateMoney', () => {
    it('should accept valid amounts', () => {
      expect(validateMoney(10.99)).toBeNull();
      expect(validateMoney('10.99')).toBeNull();
      expect(validateMoney(0)).toBeNull();
    });

    it('should reject negative amounts', () => {
      expect(validateMoney(-10)).toEqual({
        field: 'amount',
        message: 'Amount cannot be negative'
      });
    });

    it('should enforce min/max constraints', () => {
      expect(validateMoney(5, 10, 100)).toEqual({
        field: 'amount',
        message: 'Amount must be at least 10'
      });
      expect(validateMoney(150, 10, 100)).toEqual({
        field: 'amount',
        message: 'Amount cannot exceed 100'
      });
    });

    it('should reject more than 2 decimal places', () => {
      expect(validateMoney(10.999)).toEqual({
        field: 'amount',
        message: 'Amount cannot have more than 2 decimal places'
      });
    });

    it('should reject invalid amounts', () => {
      expect(validateMoney('not a number')).toEqual({
        field: 'amount',
        message: 'Invalid amount'
      });
    });
  });

  describe('validatePercentage', () => {
    it('should accept valid percentages', () => {
      expect(validatePercentage(0)).toBeNull();
      expect(validatePercentage(50)).toBeNull();
      expect(validatePercentage(100)).toBeNull();
      expect(validatePercentage('75.5')).toBeNull();
    });

    it('should reject invalid percentages', () => {
      expect(validatePercentage(-10)).toEqual({
        field: 'percentage',
        message: 'Percentage must be between 0 and 100'
      });
      expect(validatePercentage(101)).toEqual({
        field: 'percentage',
        message: 'Percentage must be between 0 and 100'
      });
    });

    it('should reject non-numeric input', () => {
      expect(validatePercentage('not a number')).toEqual({
        field: 'percentage',
        message: 'Invalid percentage'
      });
    });
  });
});

describe('Form Validation', () => {
  describe('validateForm', () => {
    const schema = {
      username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/
      },
      email: {
        required: true,
        custom: (value: string) => validateEmail(value)
      },
      age: {
        custom: (value: number) => {
          if (value < 18) {
            return { field: 'age', message: 'Must be 18 or older' };
          }
          return null;
        }
      }
    };

    it('should validate valid form data', () => {
      const data = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25
      };
      expect(validateForm(data, schema)).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data = {
        age: 25
      };
      const errors = validateForm(data, schema);
      expect(errors).toContainEqual({
        field: 'username',
        message: 'username is required'
      });
      expect(errors).toContainEqual({
        field: 'email',
        message: 'email is required'
      });
    });

    it('should validate length constraints', () => {
      const data = {
        username: 'ab',
        email: 'test@example.com',
        age: 20
      };
      const errors = validateForm(data, schema);
      expect(errors).toContainEqual({
        field: 'username',
        message: 'username must be at least 3 characters'
      });
    });

    it('should validate pattern constraints', () => {
      const data = {
        username: 'john-doe!',
        email: 'test@example.com',
        age: 20
      };
      const errors = validateForm(data, schema);
      expect(errors).toContainEqual({
        field: 'username',
        message: 'username format is invalid'
      });
    });

    it('should run custom validators', () => {
      const data = {
        username: 'john_doe',
        email: 'invalid-email',
        age: 16
      };
      const errors = validateForm(data, schema);
      expect(errors).toContainEqual({
        field: 'email',
        message: 'Invalid email address'
      });
      expect(errors).toContainEqual({
        field: 'age',
        message: 'Must be 18 or older'
      });
    });
  });
});

describe('XSS Prevention', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(escapeHtml('&')).toBe('&amp;');
      expect(escapeHtml('"')).toBe('&quot;');
      expect(escapeHtml("'")).toBe('&#39;');
      expect(escapeHtml('/')).toBe('&#x2F;');
    });

    it('should handle mixed content', () => {
      const input = '<div class="test">Hello & "World"</div>';
      const expected = '&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;&#x2F;div&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });
  });

  describe('createSafeHtml', () => {
    it('should sanitize and escape by default', () => {
      const input = '<script>alert("xss")</script><p>Hello</p>';
      const result = createSafeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should allow specified tags', () => {
      const input = '<b>Bold</b> <i>Italic</i> <script>bad</script>';
      const result = createSafeHtml(input, ['b', 'i']);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
      expect(result).not.toContain('<script>');
    });
  });
});

describe('validateAndSanitize', () => {
  it('should sanitize and validate email', () => {
    const result = validateAndSanitize('  TEST@EXAMPLE.COM  ', 'email');
    expect(result.value).toBe('test@example.com');
    expect(result.error).toBeNull();
  });

  it('should sanitize and validate phone', () => {
    const result = validateAndSanitize('(555) 123-4567', 'phone');
    expect(result.value).toBe('(555) 123-4567');
    expect(result.error).toBeNull();
  });

  it('should sanitize and validate URL', () => {
    const result = validateAndSanitize('https://example.com', 'url');
    expect(result.value).toBe('https://example.com/');
    expect(result.error).toBeNull();
  });

  it('should sanitize HTML', () => {
    const result = validateAndSanitize('<script>alert(1)</script>Hello', 'html');
    expect(result.value).toBe('Hello');
    expect(result.error).toBeNull();
  });

  it('should sanitize filename', () => {
    const result = validateAndSanitize('../../../etc/passwd', 'filename');
    expect(result.value).toBe('etcpasswd');
    expect(result.error).toBeNull();
  });

  it('should sanitize SQL', () => {
    const result = validateAndSanitize("'; DROP TABLE users; --", 'sql');
    expect(result.value).not.toContain('DROP');
    expect(result.error).toBeNull();
  });

  it('should handle text type', () => {
    const result = validateAndSanitize('  plain text  ', 'text');
    expect(result.value).toBe('plain text');
    expect(result.error).toBeNull();
  });
});