/**
 * Lighthouse CI Configuration
 *
 * Runs automated performance, accessibility, SEO, and best practices audits.
 * These thresholds are set for pre-launch quality gates.
 */

module.exports = {
  ci: {
    collect: {
      // Start the Next.js production server
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,

      // URLs to audit (critical pages)
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/shop',
        'http://localhost:3000/cart',
        'http://localhost:3000/contact',
        'http://localhost:3000/discover',
      ],

      // Number of runs per URL for consistency
      numberOfRuns: 3,

      settings: {
        // Use mobile preset (stricter, more realistic)
        preset: 'desktop',

        // Throttling settings
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },

    assert: {
      // Assertions - fail the build if these aren't met
      assertions: {
        // Performance (Core Web Vitals)
        'categories:performance': ['warn', { minScore: 0.7 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Accessibility
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // Best Practices
        'categories:best-practices': ['warn', { minScore: 0.85 }],

        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Specific checks
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'warn',
        'link-text': 'warn',
        'tap-targets': 'warn',
        'font-size': 'warn',
      },
    },

    upload: {
      // Upload to temporary public storage (free)
      target: 'temporary-public-storage',
    },
  },
};
