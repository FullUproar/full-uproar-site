/**
 * Tests for the logger utility
 */

import { logger } from '../logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

beforeEach(() => {
  // Mock console methods
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

afterEach(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  jest.clearAllMocks();
});

describe('Logger', () => {
  describe('debug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      logger.debug('Debug message', { extra: 'data' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Debug message',
        { extra: 'data' }
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      logger.debug('Debug message');
      
      expect(console.log).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message', { userId: 123 });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Info message',
        { userId: 123 }
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message', { code: 'WARN_001' });
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'Warning message',
        { code: 'WARN_001' }
      );
    });
  });

  describe('error', () => {
    it('should log error messages with Error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error occurred',
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          context: 'test'
        })
      );
    });

    it('should log error messages without Error object', () => {
      logger.error('Simple error', null, { code: 500 });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Simple error',
        { code: 500 }
      );
    });

    it('should handle non-Error objects', () => {
      const customError = { message: 'Custom error', code: 'ERR_001' };
      logger.error('Custom error occurred', customError);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Custom error occurred',
        expect.objectContaining({
          message: 'Custom error',
          code: 'ERR_001'
        })
      );
    });
  });

  describe('critical', () => {
    it('should log critical messages', () => {
      const error = new Error('Critical failure');
      logger.critical('System critical', error, { severity: 'high' });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[CRITICAL]'),
        'System critical',
        expect.objectContaining({
          message: 'Critical failure',
          severity: 'high'
        })
      );
    });
  });

  describe('metric', () => {
    it('should log metrics in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      logger.metric('api.response.time', 150, 'ms', { endpoint: '/api/users' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[METRIC]'),
        'api.response.time',
        expect.objectContaining({
          value: 150,
          unit: 'ms',
          tags: { endpoint: '/api/users' }
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not log metrics in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      logger.metric('test.metric', 100);
      
      expect(console.log).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('log buffering', () => {
    it('should buffer logs in memory', () => {
      logger.info('Buffered log 1');
      logger.warn('Buffered log 2');
      logger.error('Buffered log 3');
      
      // Check that logs were called
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('timestamp formatting', () => {
    it('should include ISO timestamp in logs', () => {
      logger.info('Timestamped message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        expect.any(String),
        undefined
      );
    });
  });
});