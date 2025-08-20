import { generateSlug, formatPrice, createGameSchema, validateRequest } from '@/lib/utils/validation';
import { ValidationError } from '@/lib/utils/errors';

describe('Validation Utils', () => {
  describe('generateSlug', () => {
    it('should generate valid slug from title', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Test Game 123')).toBe('test-game-123');
      expect(generateSlug('Special!@#$%Characters')).toBe('special-characters');
    });

    it('should handle suffix', () => {
      expect(generateSlug('Test', '1')).toBe('test-1');
      expect(generateSlug('Game', 'v2')).toBe('game-v2');
    });

    it('should handle empty strings', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
    });
  });

  describe('formatPrice', () => {
    it('should format price in dollars', () => {
      expect(formatPrice(1999)).toBe('$19.99');
      expect(formatPrice(100)).toBe('$1.00');
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should handle large numbers', () => {
      expect(formatPrice(999999)).toBe('$9,999.99');
      expect(formatPrice(100000000)).toBe('$1,000,000.00');
    });
  });

  describe('validateRequest', () => {
    it('should validate valid game data', async () => {
      const validData = {
        title: 'Test Game',
        description: 'A test game description',
        priceCents: 1999,
        players: '2-4',
        timeToPlay: '30-60 min',
        ageRating: '12+',
      };

      const result = await validateRequest(validData, createGameSchema);
      expect(result).toMatchObject(validData);
      // These are default values from the schema
      expect(result.featured).toBe(false);
      expect(result.isBundle).toBe(false);
      expect(result.isPreorder).toBe(true);
      expect(result.stock).toBe(0);
    });

    it('should throw ValidationError for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        description: 'Test',
        priceCents: -100, // Negative price
      };

      await expect(validateRequest(invalidData, createGameSchema))
        .rejects.toThrow(ValidationError);
    });

    it('should validate with transformation', async () => {
      const data = {
        title: 'Test Game', // Zod doesn't automatically trim
        description: 'Description',
        priceCents: 1999,
        players: '2-4',
        timeToPlay: '30 min',
        ageRating: '12+',
      };

      const result = await validateRequest(data, createGameSchema);
      expect(result.title).toBe('Test Game');
    });
  });
});