/** @jest-environment node */

/**
 * Tests for the logger utility
 *
 * IMPORTANT: The admin logger uses console.log for ALL log levels (debug, info, warn, error, critical)
 * with ANSI color codes. It does NOT use console.info, console.warn, or console.error.
 */

// Mock fetch before any imports
global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;

import { logger } from '../logger';
import { LogLevel } from '../../types';

// Mock console methods
const originalConsole = {
  log: console.log,
  error: console.error,
};

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Use fake timers to control setInterval
    jest.useFakeTimers();

    // Force logger into development mode (NODE_ENV is 'test' in Jest)
    (logger as any).isDevelopment = true;

    // Clear the internal queue
    (logger as any).queue = [];

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore console
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Clear all timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('Debug message', { extra: 'data' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[DEBUG]'),
        'Debug message',
        { extra: 'data' }
      );
    });

    it('should not log debug messages in production', () => {
      // Temporarily switch to production mode
      (logger as any).isDevelopment = false;

      logger.debug('Debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore development mode
      (logger as any).isDevelopment = true;
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message', { userId: 123 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[INFO]'),
        'Info message',
        { userId: 123 }
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message', { code: 'WARN_001' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[WARNING]'),
        'Warning message',
        { code: 'WARN_001' }
      );
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[ERROR]'),
        'Error occurred',
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          }),
          context: 'test',
        })
      );
    });

    it('should log error messages without Error object', () => {
      logger.error('Simple error', undefined, { code: 500 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[ERROR]'),
        'Simple error',
        expect.objectContaining({
          code: 500,
        })
      );
    });

    it('should handle non-Error objects', () => {
      const customError = { message: 'Custom error', code: 'ERR_001' };
      logger.error('Custom error occurred', customError);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[ERROR]'),
        'Custom error occurred',
        expect.objectContaining({
          error: {
            message: 'Custom error',
            code: 'ERR_001',
          },
        })
      );
    });
  });

  describe('critical', () => {
    it('should log critical messages', () => {
      const error = new Error('Critical failure');
      logger.critical('System critical', error, { severity: 'high' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringContaining('[CRITICAL]'),
        'System critical',
        expect.objectContaining({
          severity: 'high',
        })
      );
    });
  });

  describe('metric', () => {
    it('should log metrics in development', () => {
      logger.metric('api.response.time', 150, 'ms', { endpoint: '/api/users' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[METRIC]',
        expect.objectContaining({
          name: 'api.response.time',
          value: 150,
          unit: 'ms',
          timestamp: expect.any(Date),
          tags: expect.objectContaining({
            endpoint: '/api/users',
          }),
        })
      );
    });

    it('should not log metrics in production', () => {
      // Temporarily switch to production mode
      (logger as any).isDevelopment = false;

      logger.metric('test.metric', 100);

      expect(consoleLogSpy).not.toHaveBeenCalled();

      // Restore development mode
      (logger as any).isDevelopment = true;
    });
  });

  describe('log buffering', () => {
    it('should buffer logs in memory', () => {
      logger.info('Buffered log 1');
      logger.warn('Buffered log 2');
      logger.error('Buffered log 3');

      // All three should use console.log
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);

      // Verify the queue has 3 items
      expect((logger as any).queue.length).toBe(3);
    });
  });

  describe('timestamp formatting', () => {
    it('should include ISO timestamp in logs', () => {
      logger.info('Timestamped message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.any(String), // ANSI color code
        expect.stringMatching(/\[INFO\] \[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
        'Timestamped message',
        ''
      );
    });
  });

  describe('context management', () => {
    it('should set and use global context', () => {
      logger.setContext({ userId: 'user-123', sessionId: 'session-456' });
      logger.info('Test message');

      // Check that the queued log includes the context
      const queuedLog = (logger as any).queue[0];
      expect(queuedLog.metadata).toMatchObject({
        userId: 'user-123',
        sessionId: 'session-456',
      });
    });

    it('should clear specific context keys', () => {
      logger.setContext({ userId: 'user-123', sessionId: 'session-456' });
      logger.clearContext(['userId']);

      logger.info('Test message');

      const queuedLog = (logger as any).queue[0];
      expect(queuedLog.metadata).not.toHaveProperty('userId');
      expect(queuedLog.metadata).toHaveProperty('sessionId', 'session-456');
    });

    it('should clear all context', () => {
      logger.setContext({ userId: 'user-123', sessionId: 'session-456' });
      logger.clearContext();

      logger.info('Test message');

      const queuedLog = (logger as any).queue[0];
      expect(queuedLog.metadata).not.toHaveProperty('userId');
      expect(queuedLog.metadata).not.toHaveProperty('sessionId');
    });
  });
});
