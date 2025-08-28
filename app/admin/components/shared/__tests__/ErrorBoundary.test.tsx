/**
 * Tests for ErrorBoundary component
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '../ErrorBoundary';

// Mock the logger
jest.mock('@/lib/admin/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Component that throws async error
const ThrowAsyncError: React.FC = () => {
  const [hasError, setHasError] = useState(false);
  
  React.useEffect(() => {
    if (hasError) {
      throw new Error('Async test error');
    }
  }, [hasError]);

  return (
    <button onClick={() => setHasError(true)}>
      Trigger Error
    </button>
  );
};

// Component using useErrorHandler hook
const ComponentWithErrorHandler: React.FC = () => {
  const { throwError } = useErrorHandler();
  
  return (
    <button onClick={() => throwError(new Error('Hook error'))}>
      Throw Error via Hook
    </button>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress error output in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  describe('Error catching', () => {
    it('should catch and display errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/The application encountered an unexpected error/i)).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText(/Oops! Something went wrong/i)).not.toBeInTheDocument();
    });

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });

    it('should show different message for isolated boundaries', () => {
      render(
        <ErrorBoundary isolate>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/This component encountered an error/i)).toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('should recover when Try Again is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Click Try Again
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Rerender with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });
    });

    it('should reload page when Reload Page is clicked', () => {
      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(reloadMock).toHaveBeenCalled();
    });

    it('should navigate to dashboard when Go to Dashboard is clicked', () => {
      const hrefSpy = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { 
          set href(value: string) {
            hrefSpy(value);
          }
        },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const dashboardButton = screen.getByText('Go to Dashboard');
      fireEvent.click(dashboardButton);

      expect(hrefSpy).toHaveBeenCalledWith('/admin');
    });

    it('should not show navigation buttons for isolated boundaries', () => {
      render(
        <ErrorBoundary isolate>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Reload Page')).not.toBeInTheDocument();
      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('Auto-retry', () => {
    jest.setTimeout(10000);

    it('should auto-retry after 5 seconds for first 3 errors', async () => {
      jest.useFakeTimers();
      
      let attemptCount = 0;
      const RetryComponent = () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error(`Attempt ${attemptCount}`);
        }
        return <div>Success after retries</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <RetryComponent />
        </ErrorBoundary>
      );

      // First error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/Error occurred 1 times/i)).toBeInTheDocument();

      // Wait for auto-retry
      jest.advanceTimersByTime(5000);
      
      rerender(
        <ErrorBoundary>
          <RetryComponent />
        </ErrorBoundary>
      );

      // Still error after second attempt
      await waitFor(() => {
        expect(screen.getByText(/Error occurred 2 times/i)).toBeInTheDocument();
      });

      // Wait for second auto-retry
      jest.advanceTimersByTime(5000);
      
      rerender(
        <ErrorBoundary>
          <RetryComponent />
        </ErrorBoundary>
      );

      // Should succeed on third render
      await waitFor(() => {
        expect(screen.getByText('Success after retries')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it('should stop auto-retry after 3 attempts', async () => {
      jest.useFakeTimers();
      
      const AlwaysThrow = () => {
        throw new Error('Persistent error');
      };

      const { rerender } = render(
        <ErrorBoundary>
          <AlwaysThrow />
        </ErrorBoundary>
      );

      // Trigger 3 errors with auto-retry
      for (let i = 1; i <= 3; i++) {
        if (i > 1) {
          jest.advanceTimersByTime(5000);
          rerender(
            <ErrorBoundary>
              <AlwaysThrow />
            </ErrorBoundary>
          );
        }
      }

      await waitFor(() => {
        expect(screen.getByText(/limit reached/i)).toBeInTheDocument();
      });

      // Advance time - should not retry anymore
      jest.advanceTimersByTime(10000);

      expect(screen.getByText(/limit reached/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Development mode', () => {
    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument();
      expect(screen.getByText(/Test error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not show error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development Only)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should show component stack in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByText('Error Details (Development Only)');
      fireEvent.click(detailsButton);

      // Component stack should be available
      expect(screen.getByText('Component Stack')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Reset keys', () => {
    it('should reset when reset keys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={[1]}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Change reset keys
      rerender(
        <ErrorBoundary resetKeys={[2]}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reset when props change with resetOnPropsChange', () => {
      const Component = ({ value }: { value: number }) => {
        if (value === 1) {
          throw new Error('Error for value 1');
        }
        return <div>Value: {value}</div>;
      };

      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange>
          <Component value={1} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Change props
      rerender(
        <ErrorBoundary resetOnPropsChange>
          <Component value={2} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Value: 2')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('should call onError callback', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' }),
        expect.objectContaining({ componentStack: expect.any(String) })
      );
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const Component = () => {
      throw new Error('HOC error');
    };

    const WrappedComponent = withErrorBoundary(Component);

    render(<WrappedComponent />);

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('should pass props to wrapped component', () => {
    const Component = ({ text }: { text: string }) => <div>{text}</div>;
    const WrappedComponent = withErrorBoundary(Component);

    render(<WrappedComponent text="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should accept error boundary props', () => {
    const Component = () => {
      throw new Error('HOC error');
    };

    const customFallback = <div>Custom HOC error</div>;
    const WrappedComponent = withErrorBoundary(Component, {
      fallback: customFallback,
    });

    render(<WrappedComponent />);

    expect(screen.getByText('Custom HOC error')).toBeInTheDocument();
  });
});

describe('useErrorHandler hook', () => {
  it('should throw error to error boundary', async () => {
    render(
      <ErrorBoundary>
        <ComponentWithErrorHandler />
      </ErrorBoundary>
    );

    const button = screen.getByText('Throw Error via Hook');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});