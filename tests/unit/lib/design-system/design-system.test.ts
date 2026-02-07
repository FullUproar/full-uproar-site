import { colors } from '@/lib/colors';
import { typography } from '@/lib/design-system/typography';
import { spacing, componentSpacing } from '@/lib/design-system/spacing';
import { buttonSizes, buttonVariants, buttonStyles } from '@/lib/design-system/buttons';
import { breakpoints, mediaQueries } from '@/lib/design-system/breakpoints';

describe('Design System Contract Tests', () => {
  describe('Typography', () => {
    const expectedKeys = [
      'hero', 'h1', 'h2', 'h3', 'h4',
      'body', 'bodyLarge', 'bodyBold',
      'small', 'xs',
      'button', 'price', 'priceSmall', 'label',
    ];

    it('should have all required typography keys', () => {
      for (const key of expectedKeys) {
        expect(typography).toHaveProperty(key);
      }
    });

    it('should have fontSize, fontWeight, lineHeight on every entry', () => {
      for (const key of expectedKeys) {
        const entry = typography[key as keyof typeof typography];
        expect(entry).toHaveProperty('fontSize');
        expect(entry).toHaveProperty('fontWeight');
        expect(entry).toHaveProperty('lineHeight');
      }
    });

    it('should have correct hero size', () => {
      expect(typography.hero.fontSize).toBe('3rem');
      expect(typography.hero.fontWeight).toBe(900);
    });

    it('should have descending heading sizes', () => {
      const headingSizes = [
        parseFloat(typography.hero.fontSize),
        parseFloat(typography.h1.fontSize),
        parseFloat(typography.h2.fontSize),
        parseFloat(typography.h3.fontSize),
        parseFloat(typography.h4.fontSize),
      ];

      for (let i = 1; i < headingSizes.length; i++) {
        expect(headingSizes[i]).toBeLessThan(headingSizes[i - 1]);
      }
    });

    it('should have body at 1rem', () => {
      expect(typography.body.fontSize).toBe('1rem');
    });
  });

  describe('Spacing', () => {
    it('should have all core scale keys', () => {
      const coreKeys = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'];
      for (const key of coreKeys) {
        expect(spacing).toHaveProperty(key);
      }
    });

    it('should have semantic spacing keys', () => {
      const semanticKeys = ['icon', 'button', 'input', 'card', 'section', 'sectionMobile', 'page', 'pageDesktop'];
      for (const key of semanticKeys) {
        expect(spacing).toHaveProperty(key);
      }
    });

    it('should have correct base values', () => {
      expect(spacing.none).toBe('0');
      expect(spacing.xs).toBe('0.25rem');
      expect(spacing.sm).toBe('0.5rem');
      expect(spacing.md).toBe('1rem');
      expect(spacing.lg).toBe('1.5rem');
      expect(spacing.xl).toBe('2rem');
    });

    it('should have ascending scale values', () => {
      const scaleRem = [
        parseFloat(spacing.none),
        parseFloat(spacing.xs),
        parseFloat(spacing.sm),
        parseFloat(spacing.md),
        parseFloat(spacing.lg),
        parseFloat(spacing.xl),
      ];

      for (let i = 1; i < scaleRem.length; i++) {
        expect(scaleRem[i]).toBeGreaterThan(scaleRem[i - 1]);
      }
    });

    it('should have componentSpacing with form groups', () => {
      expect(componentSpacing).toHaveProperty('formGroup');
      expect(componentSpacing).toHaveProperty('formRow');
      expect(componentSpacing).toHaveProperty('inputGroup');
      expect(componentSpacing).toHaveProperty('cardPadding');
    });
  });

  describe('Button System', () => {
    it('should have all size variants', () => {
      expect(buttonSizes).toHaveProperty('small');
      expect(buttonSizes).toHaveProperty('medium');
      expect(buttonSizes).toHaveProperty('large');
      expect(buttonSizes).toHaveProperty('icon');
      expect(buttonSizes).toHaveProperty('iconSmall');
    });

    it('should have padding, fontSize, borderRadius on each size', () => {
      for (const size of Object.values(buttonSizes)) {
        expect(size).toHaveProperty('padding');
        expect(size).toHaveProperty('fontSize');
        expect(size).toHaveProperty('borderRadius');
      }
    });

    it('should have all variant styles', () => {
      expect(buttonVariants).toHaveProperty('primary');
      expect(buttonVariants).toHaveProperty('secondary');
      expect(buttonVariants).toHaveProperty('outline');
      expect(buttonVariants).toHaveProperty('danger');
      expect(buttonVariants).toHaveProperty('ghost');
      expect(buttonVariants).toHaveProperty('link');
    });

    it('should have cursor pointer on interactive variants', () => {
      for (const variant of Object.values(buttonVariants)) {
        expect(variant.cursor).toBe('pointer');
      }
    });

    it('should use brand orange in primary variant', () => {
      expect(buttonVariants.primary.background).toContain(colors.primary);
    });

    it('should have pre-composed button styles', () => {
      expect(buttonStyles).toHaveProperty('primaryMedium');
      expect(buttonStyles).toHaveProperty('primaryLarge');
      expect(buttonStyles).toHaveProperty('primarySmall');
      expect(buttonStyles).toHaveProperty('secondaryMedium');
      expect(buttonStyles).toHaveProperty('outlineMedium');
      expect(buttonStyles).toHaveProperty('dangerMedium');
    });

    it('should compose size and variant correctly', () => {
      // primaryMedium should have medium size padding and primary variant background
      expect(buttonStyles.primaryMedium.padding).toBe(buttonSizes.medium.padding);
      expect(buttonStyles.primaryMedium.background).toBe(buttonVariants.primary.background);
    });
  });

  describe('Breakpoints', () => {
    it('should have correct pixel values', () => {
      expect(breakpoints.mobile).toBe(640);
      expect(breakpoints.tablet).toBe(768);
      expect(breakpoints.desktop).toBe(1024);
      expect(breakpoints.wide).toBe(1280);
      expect(breakpoints.ultrawide).toBe(1536);
    });

    it('should have ascending breakpoint values', () => {
      expect(breakpoints.mobile).toBeLessThan(breakpoints.tablet);
      expect(breakpoints.tablet).toBeLessThan(breakpoints.desktop);
      expect(breakpoints.desktop).toBeLessThan(breakpoints.wide);
      expect(breakpoints.wide).toBeLessThan(breakpoints.ultrawide);
    });

    it('should have media query strings', () => {
      expect(mediaQueries.mobile).toContain(`${breakpoints.mobile}px`);
      expect(mediaQueries.tablet).toContain(`${breakpoints.tablet}px`);
      expect(mediaQueries.desktop).toContain(`${breakpoints.desktop}px`);
    });
  });
});
