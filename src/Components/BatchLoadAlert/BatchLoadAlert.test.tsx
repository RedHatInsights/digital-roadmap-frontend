import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BatchLoadAlert from './BatchLoadAlert';

const description =
  'Large environments can take a few minutes to calculate. Keep this tab open to watch progress.';

describe('BatchLoadAlert', () => {
  test('renders the completed host count, percent, and slow retry action', () => {
    const onRetry = jest.fn();

    render(
      <BatchLoadAlert
        title="We're preparing life cycle data for 196,482 systems"
        description={description}
        completed={125750}
        total={196482}
        onRetry={onRetry}
        showRetry
      />
    );

    expect(
      screen.getByRole('heading', { name: /We're preparing life cycle data for 196,482 systems/ })
    ).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.getByText('125,750 / 196,482 systems')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Lifecycle data loading progress' })).toHaveAttribute(
      'aria-valuenow',
      '64'
    );
    expect(screen.getByText('Taking longer than expected.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry now' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('omits the determinate bar when the host total is unknown', () => {
    render(
      <BatchLoadAlert
        title="We're preparing life cycle data"
        description={description}
        completed={0}
        total={0}
        onRetry={jest.fn()}
      />
    );

    expect(screen.queryByText(/0 \/ 0/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry now' })).not.toBeInTheDocument();
  });

  test('disables retry before the restarted load has a progress bar', () => {
    render(
      <BatchLoadAlert
        title="We're preparing life cycle data"
        description={description}
        completed={0}
        total={0}
        onRetry={jest.fn()}
        isRetrying
      />
    );

    expect(screen.getByRole('button', { name: 'Retry in progress...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retry in progress...' })).toHaveClass(
      'drf-batch-load-alert__retry-in-progress'
    );
  });

  test('supports labels for a different batch data set', () => {
    render(
      <BatchLoadAlert
        title="Preparing upcoming changes"
        description="Loading upcoming changes."
        completed={2}
        total={10}
        onRetry={jest.fn()}
        progressLabel="records"
        progressAriaLabel="Upcoming changes loading progress"
      />
    );

    expect(screen.getByText('2 / 10 records')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Upcoming changes loading progress' })).toBeInTheDocument();
  });
});
