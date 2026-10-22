import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PreparingDataState, { PreparingDataItem } from './PreparingDataState';

const renderState = (items: PreparingDataItem[], title = 'Preparing life cycle data') =>
  render(<PreparingDataState title={title} items={items} />);

describe('PreparingDataState', () => {
  test('shows determinate progress for every dataset that is still loading', () => {
    renderState([
      { label: 'Red Hat Enterprise Linux', loaded: 125748, total: 196482, completed: false },
      { label: 'Application Streams', loaded: 125748, total: 196482, completed: false },
    ]);

    expect(screen.getByRole('heading', { name: 'Preparing life cycle data' })).toBeInTheDocument();
    expect(screen.getByText(/Loading data for 196,482 systems\./)).toBeInTheDocument();
    expect(screen.getByText(/Keep this page open to track progress\./)).toBeInTheDocument();
    expect(screen.queryByText(/This can take a few minutes/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Loading 125,748 out of 196,482 systems')).toHaveLength(2);
    expect(screen.getAllByText('64%')).toHaveLength(2);
    expect(screen.getByRole('progressbar', { name: 'Red Hat Enterprise Linux' })).toHaveAttribute(
      'aria-valuetext',
      'Loading 125,748 out of 196,482 systems'
    );
    expect(screen.getByRole('progressbar', { name: 'Application Streams' })).toHaveAttribute(
      'aria-valuenow',
      '64'
    );
  });

  test('switches the message and marks a finished dataset complete', () => {
    renderState([
      { label: 'Red Hat Enterprise Linux', loaded: 196482, total: 196482, completed: true },
      { label: 'Application Streams', loaded: 125748, total: 196482, completed: false },
    ]);

    expect(screen.getByText(/This can take a few minutes for 196,482 systems\./)).toBeInTheDocument();
    expect(screen.queryByText(/Loading data for 196,482 systems\./)).not.toBeInTheDocument();
    expect(screen.getByText('Red Hat Enterprise Linux data loaded for 196,482 systems')).toBeInTheDocument();
    expect(screen.getByText('Loading 125,748 out of 196,482 systems')).toBeInTheDocument();

    const finished = screen.getByRole('progressbar', { name: 'Red Hat Enterprise Linux' });
    expect(finished).toHaveAttribute('aria-valuenow', '100');
    expect(finished.closest('.pf-v6-c-progress')).toHaveClass('pf-m-success');

    const stillLoading = screen.getByRole('progressbar', { name: 'Application Streams' });
    expect(stillLoading).toHaveAttribute('aria-valuenow', '64');
    expect(stillLoading.closest('.pf-v6-c-progress')).not.toHaveClass('pf-m-success');
  });

  test('uses the largest known system total in the introduction', () => {
    renderState(
      [{ label: 'Upcoming changes', loaded: 2000, total: 4500, completed: false }],
      'Preparing upcoming changes'
    );

    expect(screen.getByRole('heading', { name: 'Preparing upcoming changes' })).toBeInTheDocument();
    expect(screen.getByText(/Loading data for 4,500 systems\./)).toBeInTheDocument();
    expect(screen.getByText('Loading 2,000 out of 4,500 systems')).toBeInTheDocument();
    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  test('omits a count for a dataset that has not reported a total yet', () => {
    renderState([
      { label: 'Red Hat Enterprise Linux', loaded: 5000, total: 12300, completed: false },
      { label: 'Application Streams', loaded: 0, total: 0, completed: false },
    ]);

    expect(screen.getByText('Loading 5,000 out of 12,300 systems')).toBeInTheDocument();
    expect(screen.queryByText(/0 of 0/)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Application Streams' })).toHaveAttribute('aria-valuenow', '0');
  });
});
