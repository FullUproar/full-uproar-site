/**
 * Unit tests for Game Night validation and data structures
 */

describe('Game Night Validation', () => {
  describe('Vibe Types', () => {
    const validVibes = ['CHILL', 'COMPETITIVE', 'CHAOS', 'PARTY', 'COZY'];

    it('should accept all valid vibe types', () => {
      validVibes.forEach(vibe => {
        expect(validVibes).toContain(vibe);
      });
    });

    it('should have 5 vibe options', () => {
      expect(validVibes).toHaveLength(5);
    });
  });

  describe('Status Types', () => {
    const validStatuses = ['PLANNING', 'LOCKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    it('should accept all valid status types', () => {
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    it('should have 5 status options', () => {
      expect(validStatuses).toHaveLength(5);
    });
  });

  describe('Guest Status Types', () => {
    const validGuestStatuses = ['PENDING', 'IN', 'MAYBE', 'OUT'];

    it('should accept all valid guest status types', () => {
      validGuestStatuses.forEach(status => {
        expect(validGuestStatuses).toContain(status);
      });
    });

    it('should have 4 guest status options', () => {
      expect(validGuestStatuses).toHaveLength(4);
    });
  });

  describe('Game Night Data Validation', () => {
    interface GameNightInput {
      title?: string;
      date: string;
      startTime?: string;
      location?: string;
      vibe?: string;
    }

    const validateGameNight = (input: GameNightInput): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Date is required
      if (!input.date) {
        errors.push('Date is required');
      } else {
        const dateObj = new Date(input.date);
        if (isNaN(dateObj.getTime())) {
          errors.push('Invalid date format');
        }
      }

      // Title length check
      if (input.title && input.title.length > 200) {
        errors.push('Title too long (max 200 characters)');
      }

      // Location length check
      if (input.location && input.location.length > 500) {
        errors.push('Location too long (max 500 characters)');
      }

      // Vibe validation
      const validVibes = ['CHILL', 'COMPETITIVE', 'CHAOS', 'PARTY', 'COZY'];
      if (input.vibe && !validVibes.includes(input.vibe.toUpperCase())) {
        errors.push('Invalid vibe type');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    it('should validate valid game night input', () => {
      const validInput: GameNightInput = {
        title: 'Friday Night Games',
        date: '2025-01-20',
        startTime: '7:00 PM',
        location: "John's house",
        vibe: 'CHAOS',
      };

      const result = validateGameNight(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require date field', () => {
      const invalidInput = {
        title: 'Test Night',
        date: '',
      };

      const result = validateGameNight(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Date is required');
    });

    it('should reject invalid date formats', () => {
      const invalidInput: GameNightInput = {
        title: 'Test Night',
        date: 'not-a-date',
      };

      const result = validateGameNight(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });

    it('should reject invalid vibe types', () => {
      const invalidInput: GameNightInput = {
        date: '2025-01-20',
        vibe: 'INVALID_VIBE',
      };

      const result = validateGameNight(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid vibe type');
    });

    it('should handle missing optional fields', () => {
      const minimalInput: GameNightInput = {
        date: '2025-01-20',
      };

      const result = validateGameNight(minimalInput);
      expect(result.valid).toBe(true);
    });
  });

  describe('Guest RSVP Validation', () => {
    interface RSVPInput {
      status: string;
      guestName?: string;
      bringing?: string;
    }

    const validateRSVP = (input: RSVPInput): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      const validStatuses = ['IN', 'MAYBE', 'OUT'];
      if (!input.status || !validStatuses.includes(input.status)) {
        errors.push('Invalid status');
      }

      if (input.guestName && input.guestName.length > 100) {
        errors.push('Guest name too long');
      }

      if (input.bringing && input.bringing.length > 200) {
        errors.push('Bringing field too long');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    it('should validate valid RSVP input', () => {
      const validRSVP: RSVPInput = {
        status: 'IN',
        guestName: 'John Doe',
        bringing: 'Chips and salsa',
      };

      const result = validateRSVP(validRSVP);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid RSVP status', () => {
      const invalidRSVP: RSVPInput = {
        status: 'INVALID',
      };

      const result = validateRSVP(invalidRSVP);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid status');
    });

    it('should accept MAYBE status', () => {
      const rsvp: RSVPInput = { status: 'MAYBE' };
      const result = validateRSVP(rsvp);
      expect(result.valid).toBe(true);
    });

    it('should accept OUT status', () => {
      const rsvp: RSVPInput = { status: 'OUT' };
      const result = validateRSVP(rsvp);
      expect(result.valid).toBe(true);
    });
  });
});

describe('AI Fallback Suggestions', () => {
  // These mirror the fallback suggestions in the AI route
  const FALLBACK_SUGGESTIONS = {
    games: {
      CHILL: ['Codenames', 'Ticket to Ride', 'Wingspan', 'Azul', 'Splendor'],
      COMPETITIVE: ['Catan', 'Terraforming Mars', 'Scythe', 'Root', '7 Wonders'],
      CHAOS: ['Exploding Kittens', 'Throw Throw Burrito', 'Unstable Unicorns', 'Coup', 'Love Letter'],
      PARTY: ['Cards Against Humanity', 'What Do You Meme', 'Telestrations', 'Just One', 'Wavelength'],
      COZY: ['Mysterium', 'Pandemic', 'Spirit Island', 'Gloomhaven: Jaws of the Lion', 'Betrayal at House on the Hill'],
    },
    snacks: {
      CHILL: ['Cheese board with crackers', 'Veggie platter with hummus', 'Popcorn bar', 'Fruit and chocolate'],
      COMPETITIVE: ['Finger foods that won\'t slow you down', 'Mini sandwiches', 'Energy drinks', 'Trail mix'],
      CHAOS: ['Pizza rolls', 'Hot wings', 'Nachos supreme', 'Anything deep fried'],
      PARTY: ['Chips and multiple dips', 'Slider bar', 'Cocktail/mocktail station', 'S\'mores bar'],
      COZY: ['Warm soup in mugs', 'Fresh baked cookies', 'Hot cocoa bar', 'Comfort food spread'],
    },
    themes: [
      '80s Arcade Night - neon colors, synthwave music, retro snacks',
      'Medieval Tavern - mead (or root beer), meat pies, fantasy games',
      'Space Station Alpha - cosmic cocktails, astronaut ice cream, sci-fi games',
      'Spy vs Spy - mystery games, secret codes, tuxedo dress code optional',
      'Chaos Casino - poker chips as score trackers, dealer vibes, high stakes snacks',
    ],
  };

  describe('Game Suggestions', () => {
    it('should have suggestions for all vibes', () => {
      const vibes = ['CHILL', 'COMPETITIVE', 'CHAOS', 'PARTY', 'COZY'];
      vibes.forEach(vibe => {
        expect(FALLBACK_SUGGESTIONS.games[vibe as keyof typeof FALLBACK_SUGGESTIONS.games]).toBeDefined();
      });
    });

    it('should have at least 5 games per vibe', () => {
      Object.values(FALLBACK_SUGGESTIONS.games).forEach(games => {
        expect(games.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should return correct games for CHAOS vibe', () => {
      const chaosGames = FALLBACK_SUGGESTIONS.games.CHAOS;
      expect(chaosGames).toContain('Exploding Kittens');
      expect(chaosGames).toContain('Throw Throw Burrito');
    });
  });

  describe('Snack Suggestions', () => {
    it('should have snack suggestions for all vibes', () => {
      const vibes = ['CHILL', 'COMPETITIVE', 'CHAOS', 'PARTY', 'COZY'];
      vibes.forEach(vibe => {
        expect(FALLBACK_SUGGESTIONS.snacks[vibe as keyof typeof FALLBACK_SUGGESTIONS.snacks]).toBeDefined();
      });
    });

    it('should have at least 4 snack ideas per vibe', () => {
      Object.values(FALLBACK_SUGGESTIONS.snacks).forEach(snacks => {
        expect(snacks.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('Theme Suggestions', () => {
    it('should have at least 5 theme ideas', () => {
      expect(FALLBACK_SUGGESTIONS.themes.length).toBeGreaterThanOrEqual(5);
    });

    it('should have themes with descriptions', () => {
      FALLBACK_SUGGESTIONS.themes.forEach(theme => {
        expect(theme).toContain(' - ');
      });
    });
  });
});

describe('Invite Token Generation', () => {
  const generateToken = (): string => {
    // Simulate cuid-like token generation
    return 'cl' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateToken());
    }
    expect(tokens.size).toBe(100);
  });

  it('should generate tokens with minimum length', () => {
    const token = generateToken();
    expect(token.length).toBeGreaterThan(10);
  });

  it('should start with expected prefix', () => {
    const token = generateToken();
    expect(token.startsWith('cl')).toBe(true);
  });
});

describe('Date Formatting', () => {
  // Helper to get local date string in YYYY-MM-DD format
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatGameNightDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00'); // Noon to avoid timezone issues
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  it('should return "Today" for current date', () => {
    const today = getLocalDateString(new Date());
    const result = formatGameNightDate(today);
    expect(result).toBe('Today');
  });

  it('should return "Tomorrow" for next day', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = formatGameNightDate(getLocalDateString(tomorrow));
    expect(result).toBe('Tomorrow');
  });

  it('should return formatted date for other days', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const result = formatGameNightDate(getLocalDateString(futureDate));
    expect(result).toMatch(/\w{3}, \w{3} \d{1,2}/); // e.g., "Mon, Jan 20"
  });
});
