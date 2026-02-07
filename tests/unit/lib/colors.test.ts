import { colors, colorsRgba, hexToRgba } from '@/lib/colors';

describe('Colors', () => {
  describe('Brand Color Compliance', () => {
    // These tests prevent accidental drift to Tailwind defaults.
    // If these fail, someone replaced our Pantone colors with Tailwind values.

    it('should use Pantone 151 C orange, NOT Tailwind orange-500', () => {
      expect(colors.primary).toBe('#FF8200');
      expect(colors.chaosOrange).toBe('#FF8200');
      // Ensure it's not Tailwind orange
      expect(colors.primary).not.toBe('#f97316');
      expect(colors.primary).not.toBe('#fb923c');
    });

    it('should use Pantone 120 C yellow, NOT Tailwind yellow', () => {
      expect(colors.creamYellow).toBe('#FBDB65');
      expect(colors.textPrimary).toBe('#FBDB65');
      expect(colors.primaryLight).toBe('#FBDB65');
      // Ensure it's not Tailwind yellow
      expect(colors.creamYellow).not.toBe('#fde68a');
      expect(colors.creamYellow).not.toBe('#fdba74');
    });

    it('should use Pantone 266 C purple, NOT Tailwind purple', () => {
      expect(colors.purple).toBe('#7D55C7');
      expect(colors.chaosPurple).toBe('#7D55C7');
      // Ensure it's not Tailwind purple/violet
      expect(colors.purple).not.toBe('#8b5cf6');
      expect(colors.purple).not.toBe('#a855f7');
    });

    it('should use correct background colors', () => {
      expect(colors.bgDark).toBe('#0a0a0a');
      expect(colors.bgCard).toBe('#1f2937');
    });

    it('should use correct text colors', () => {
      expect(colors.textSecondary).toBe('#e2e8f0');
      expect(colors.textMuted).toBe('#9ca3af');
      expect(colors.textDark).toBe('#111827');
    });

    it('should have correct status colors', () => {
      expect(colors.error).toBe('#ef4444');
      expect(colors.success).toBe('#10b981');
      expect(colors.warning).toBe('#fbbf24');
    });
  });

  describe('hexToRgba', () => {
    it('should convert brand orange', () => {
      expect(hexToRgba('#FF8200', 0.5)).toBe('rgba(255, 130, 0, 0.5)');
    });

    it('should convert black', () => {
      expect(hexToRgba('#000000', 1)).toBe('rgba(0, 0, 0, 1)');
    });

    it('should convert white', () => {
      expect(hexToRgba('#FFFFFF', 0)).toBe('rgba(255, 255, 255, 0)');
    });

    it('should handle full opacity', () => {
      expect(hexToRgba('#FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
    });

    it('should handle zero opacity', () => {
      expect(hexToRgba('#FF0000', 0)).toBe('rgba(255, 0, 0, 0)');
    });
  });

  describe('colorsRgba pre-computed values', () => {
    it('should have correct primary glow based on brand orange', () => {
      expect(colorsRgba.primaryGlow).toBe('rgba(255, 130, 0, 0.4)');
    });

    it('should have correct strong glow', () => {
      expect(colorsRgba.primaryGlowStrong).toBe('rgba(255, 130, 0, 0.6)');
    });

    it('should have correct light glow', () => {
      expect(colorsRgba.primaryGlowLight).toBe('rgba(255, 130, 0, 0.2)');
    });

    it('should have correct shadow', () => {
      expect(colorsRgba.primaryShadow).toBe('rgba(255, 130, 0, 0.5)');
    });

    it('should use our brand orange RGB values, not Tailwind', () => {
      // All rgba values should use 255, 130, 0 (our #FF8200)
      // NOT 249, 115, 22 (Tailwind's #f97316)
      const brandRgb = '255, 130, 0';
      Object.values(colorsRgba).forEach(value => {
        expect(value).toContain(brandRgb);
      });
    });
  });
});
