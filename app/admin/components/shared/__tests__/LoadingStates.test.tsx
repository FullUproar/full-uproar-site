/**
 * Tests for LoadingStates components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Spinner,
  FullPageLoading,
  InlineLoading,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  LoadingOverlay,
  LoadingButton,
  RefreshButton,
  LazyLoad
} from '../LoadingStates';

describe('Spinner', () => {
  it('should render spinner with default props', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('svg');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ color: '#FF8200' });
  });

  it('should render with different sizes', () => {
    const { container: small } = render(<Spinner size="small" />);
    const { container: medium } = render(<Spinner size="medium" />);
    const { container: large } = render(<Spinner size="large" />);
    
    expect(small.querySelector('svg')).toHaveAttribute('width', '16');
    expect(medium.querySelector('svg')).toHaveAttribute('width', '24');
    expect(large.querySelector('svg')).toHaveAttribute('width', '48');
  });

  it('should render with custom color', () => {
    const { container } = render(<Spinner color="#ff0000" />);
    const spinner = container.querySelector('svg');
    
    expect(spinner).toHaveStyle({ color: '#ff0000' });
  });

  it('should apply custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    const spinner = container.querySelector('svg');
    
    expect(spinner).toHaveClass('custom-spinner');
  });
});

describe('FullPageLoading', () => {
  it('should render full page loading with default message', () => {
    render(<FullPageLoading />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<FullPageLoading message="Please wait..." />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should cover full viewport', () => {
    const { container } = render(<FullPageLoading />);
    const overlay = container.firstChild as HTMLElement;
    
    expect(overlay).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
    });
  });
});

describe('InlineLoading', () => {
  it('should render inline loading with default text', () => {
    render(<InlineLoading />);
    
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<InlineLoading text="Fetching data" />);
    
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('should render spinner and text inline', () => {
    const { container } = render(<InlineLoading />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveStyle({ display: 'inline-flex' });
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('should render with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveStyle({
      width: '100%',
      height: '20px',
      borderRadius: '4px',
    });
  });

  it('should render with custom dimensions', () => {
    const { container } = render(
      <Skeleton width={200} height={50} borderRadius={8} />
    );
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '50px',
      borderRadius: '8px',
    });
  });

  it('should accept string dimensions', () => {
    const { container } = render(
      <Skeleton width="50%" height="2rem" />
    );
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveStyle({
      width: '50%',
      height: '2rem',
    });
  });

  it('should apply custom styles', () => {
    const { container } = render(
      <Skeleton style={{ marginTop: '10px' }} />
    );
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveStyle({ marginTop: '10px' });
  });
});

describe('SkeletonText', () => {
  it('should render default number of lines', () => {
    const { container } = render(<SkeletonText />);
    const lines = container.querySelectorAll('div > div');
    
    expect(lines).toHaveLength(3);
  });

  it('should render custom number of lines', () => {
    const { container } = render(<SkeletonText lines={5} />);
    const lines = container.querySelectorAll('div > div');
    
    expect(lines).toHaveLength(5);
  });

  it('should make last line shorter', () => {
    const { container } = render(<SkeletonText lines={3} />);
    const lines = container.querySelectorAll('div > div');
    
    expect(lines[0]).toHaveStyle({ width: '100%' });
    expect(lines[1]).toHaveStyle({ width: '100%' });
    expect(lines[2]).toHaveStyle({ width: '60%' });
  });

  it('should apply custom gap between lines', () => {
    const { container } = render(<SkeletonText gap={16} />);
    const wrapper = container.firstChild as HTMLElement;
    
    expect(wrapper).toHaveStyle({ gap: '16px' });
  });
});

describe('SkeletonCard', () => {
  it('should render card skeleton with avatar and text', () => {
    const { container } = render(<SkeletonCard />);
    
    // Check for avatar (circular skeleton)
    const avatar = container.querySelector('[style*="border-radius: 50%"]');
    expect(avatar).toBeInTheDocument();
    
    // Check for title and subtitle skeletons
    const skeletons = container.querySelectorAll('div[style*="background"]');
    expect(skeletons.length).toBeGreaterThan(3);
  });
});

describe('SkeletonTable', () => {
  it('should render table skeleton with default rows and columns', () => {
    const { container } = render(<SkeletonTable />);
    
    // Check header (1) + rows (5)
    const rows = container.querySelectorAll('div[style*="display: grid"]');
    expect(rows).toHaveLength(6);
    
    // Check columns in first row
    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll('div > div');
    expect(cells).toHaveLength(4);
  });

  it('should render custom number of rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={6} />);
    
    // Check header (1) + rows (3)
    const rows = container.querySelectorAll('div[style*="display: grid"]');
    expect(rows).toHaveLength(4);
    
    // Check columns
    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll('div > div');
    expect(cells).toHaveLength(6);
  });
});

describe('LoadingOverlay', () => {
  it('should not render when not visible', () => {
    const { container } = render(
      <LoadingOverlay visible={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render when visible', () => {
    render(<LoadingOverlay visible={true} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Spinner
  });

  it('should render with message', () => {
    render(<LoadingOverlay visible={true} message="Processing..." />);
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should apply blur effect by default', () => {
    const { container } = render(<LoadingOverlay visible={true} />);
    const overlay = container.firstChild as HTMLElement;
    
    expect(overlay).toHaveStyle({
      backdropFilter: 'blur(4px)',
    });
  });

  it('should not apply blur when disabled', () => {
    const { container } = render(<LoadingOverlay visible={true} blur={false} />);
    const overlay = container.firstChild as HTMLElement;
    
    expect(overlay).toHaveStyle({
      backdropFilter: 'none',
    });
  });
});

describe('LoadingButton', () => {
  it('should render button with children', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <LoadingButton loading={true} loadingText="Processing...">
        Submit
      </LoadingButton>
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(
      <LoadingButton loading={true}>Submit</LoadingButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render with icon', () => {
    const Icon = () => <span>Icon</span>;
    render(
      <LoadingButton icon={<Icon />}>Submit</LoadingButton>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
  });

  it('should apply variant styles', () => {
    const { container: primary } = render(
      <LoadingButton variant="primary">Primary</LoadingButton>
    );
    const { container: danger } = render(
      <LoadingButton variant="danger">Danger</LoadingButton>
    );
    
    const primaryBtn = primary.querySelector('button');
    const dangerBtn = danger.querySelector('button');
    
    expect(primaryBtn).toHaveStyle({
      background: expect.stringContaining('#FF8200'),
    });
    expect(dangerBtn).toHaveStyle({
      background: expect.stringContaining('#ef4444'),
    });
  });

  it('should apply size styles', () => {
    const { container: small } = render(
      <LoadingButton size="small">Small</LoadingButton>
    );
    const { container: large } = render(
      <LoadingButton size="large">Large</LoadingButton>
    );
    
    const smallBtn = small.querySelector('button');
    const largeBtn = large.querySelector('button');
    
    expect(smallBtn).toHaveStyle({ fontSize: '12px' });
    expect(largeBtn).toHaveStyle({ fontSize: '16px' });
  });

  it('should handle onClick', () => {
    const handleClick = jest.fn();
    render(
      <LoadingButton onClick={handleClick}>Click</LoadingButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('RefreshButton', () => {
  it('should render refresh icon', () => {
    render(<RefreshButton onRefresh={() => {}} />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onRefresh when clicked', async () => {
    const handleRefresh = jest.fn();
    render(<RefreshButton onRefresh={handleRefresh} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(handleRefresh).toHaveBeenCalled();
    });
  });

  it('should handle async onRefresh', async () => {
    const handleRefresh = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<RefreshButton onRefresh={handleRefresh} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Should be disabled while refreshing
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should be disabled when loading', () => {
    render(<RefreshButton onRefresh={() => {}} loading={true} />);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply size', () => {
    const { container: small } = render(
      <RefreshButton onRefresh={() => {}} size="small" />
    );
    const { container: large } = render(
      <RefreshButton onRefresh={() => {}} size="large" />
    );
    
    const smallIcon = small.querySelector('svg');
    const largeIcon = large.querySelector('svg');
    
    expect(smallIcon).toHaveAttribute('width', '16');
    expect(largeIcon).toHaveAttribute('width', '24');
  });
});

describe('LazyLoad', () => {
  jest.useFakeTimers();

  it('should show fallback initially', () => {
    render(
      <LazyLoad fallback={<div>Loading...</div>}>
        <div>Content</div>
      </LazyLoad>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should show content after delay', async () => {
    render(
      <LazyLoad delay={200}>
        <div>Content</div>
      </LazyLoad>
    );
    
    // Initially shows skeleton
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    
    // Advance timers
    jest.advanceTimersByTime(200);
    
    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  it('should use default skeleton fallback', () => {
    const { container } = render(
      <LazyLoad>
        <div>Content</div>
      </LazyLoad>
    );
    
    // Should render SkeletonCard by default
    const card = container.querySelector('[style*="border-radius: 12px"]');
    expect(card).toBeInTheDocument();
  });

  it('should clean up timer on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <LazyLoad delay={1000}>
        <div>Content</div>
      </LazyLoad>
    );
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  jest.useRealTimers();
});