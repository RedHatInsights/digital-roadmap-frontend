import React from 'react';
import { strict as assert } from 'assert';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { getAppStreamSystems, getRhelSystems, getUpcomingSystems } from '../../api';
import { PaginatedSystemsResponse } from '../../types/PaginatedSystems';
import { LifecycleModalWindow, SystemsIdentifier } from './LifecycleModalWindow';

jest.mock('../../api', () => ({
  getRhelSystems: jest.fn(),
  getAppStreamSystems: jest.fn(),
  getUpcomingSystems: jest.fn(),
}));

const identifier: SystemsIdentifier = { type: 'rhel', major: 9, minor: 4, lifecycleType: 'mainline' };
const props = {
  displayName: 'RHEL 9.4',
  identifier,
  isModalOpen: true,
  handleModalToggle: jest.fn(),
};
const response: PaginatedSystemsResponse = {
  meta: { count: 1, total: 1 },
  data: [{ id: 'host-1', display_name: 'server-a', os_major: 9, os_minor: 4 }],
};
const mockGetRhelSystems = jest.mocked(getRhelSystems);

describe('LifecycleModalWindow on-demand requests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    mockGetRhelSystems.mockResolvedValue(response);
  });

  afterEach(() => {
    cleanup();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('does not fetch systems while the modal is closed', async () => {
    render(<LifecycleModalWindow {...props} isModalOpen={false} />);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(getRhelSystems).not.toHaveBeenCalled();
    expect(getAppStreamSystems).not.toHaveBeenCalled();
    expect(getUpcomingSystems).not.toHaveBeenCalled();
  });

  test('fetches and displays the first page when opened', async () => {
    await act(async () => {
      render(<LifecycleModalWindow {...props} />);
    });

    expect(mockGetRhelSystems).toHaveBeenCalledTimes(1);
    expect(mockGetRhelSystems).toHaveBeenCalledWith(9, 4, 'mainline', {
      offset: 0,
      limit: 10,
      search: undefined,
      sort_order: 'asc',
    });
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
  });

  test('retries a failed first-page request and displays the recovered systems', async () => {
    mockGetRhelSystems.mockRejectedValueOnce(new Error('Temporary timeout'));
    await act(async () => {
      render(<LifecycleModalWindow {...props} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.getByText('Unable to load systems')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    assert.equal(mockGetRhelSystems.mock.calls.length, 2, 'Retry must issue a new request');
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
    expect(screen.queryByText('Unable to load systems')).not.toBeInTheDocument();
    expect(screen.queryByText('No systems found')).not.toBeInTheDocument();
  });

  test('retries the current page without resetting pagination', async () => {
    mockGetRhelSystems.mockResolvedValue({ ...response, meta: { count: 1, total: 20 } });
    await act(async () => {
      render(<LifecycleModalWindow {...props} />);
    });
    mockGetRhelSystems.mockRejectedValueOnce(new Error('Temporary timeout'));
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);
    });
    expect(screen.getByText('Unable to load systems')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    expect(mockGetRhelSystems).toHaveBeenCalledTimes(3);
    expect(mockGetRhelSystems).toHaveBeenLastCalledWith(
      9,
      4,
      'mainline',
      expect.objectContaining({ offset: 10, limit: 10 })
    );
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
  });

  test.each([
    { total: 5, recoveredPage: 1, legacyRoot: false },
    { total: 15, recoveredPage: 2, legacyRoot: false },
    { total: 0, recoveredPage: 1, legacyRoot: false },
    { total: 5, recoveredPage: 1, legacyRoot: true },
  ])(
    'recovers when total shrinks to $total (legacy root: $legacyRoot)',
    async ({ total, recoveredPage, legacyRoot }) => {
      mockGetRhelSystems.mockResolvedValueOnce({ ...response, meta: { count: 1, total: 30 } });
      await act(async () => {
        render(<LifecycleModalWindow {...props} />, { legacyRoot });
      });
      let resolveRecovery!: (value: PaginatedSystemsResponse) => void;
      mockGetRhelSystems
        .mockResolvedValueOnce({ meta: { count: 0, total }, data: [] })
        .mockImplementationOnce(() => new Promise((resolve) => (resolveRecovery = resolve)));

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Go to last page' }));
      });

      expect(mockGetRhelSystems).toHaveBeenCalledTimes(3);
      expect(mockGetRhelSystems).toHaveBeenNthCalledWith(
        2,
        9,
        4,
        'mainline',
        expect.objectContaining({ offset: 20 })
      );
      expect(mockGetRhelSystems).toHaveBeenLastCalledWith(
        9,
        4,
        'mainline',
        expect.objectContaining({ offset: (recoveredPage - 1) * 10 })
      );
      expect(screen.getByLabelText('Loading systems')).toBeInTheDocument();
      await act(async () => {
        resolveRecovery({ meta: { count: total ? 1 : 0, total }, data: total ? response.data : [] });
      });

      if (total) {
        expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
        expect(screen.getByLabelText('Current page')).toHaveValue(recoveredPage);
        if (recoveredPage > 1) {
          expect(screen.getAllByRole('button', { name: 'Go to previous page' })[0]).toBeEnabled();
        }
      } else {
        expect(screen.getByText('No systems found')).toBeInTheDocument();
      }
      expect(screen.queryByLabelText('Loading systems')).not.toBeInTheDocument();
      expect(mockGetRhelSystems).toHaveBeenCalledTimes(3);
    }
  );

  test('retries a failed page correction with the current search and sort', async () => {
    mockGetRhelSystems.mockResolvedValue({ ...response, meta: { count: 1, total: 30 } });
    await act(async () => {
      render(<LifecycleModalWindow {...props} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter systems by name' }), {
      target: { value: 'server' },
    });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    mockGetRhelSystems.mockClear();
    mockGetRhelSystems
      .mockResolvedValueOnce({ meta: { count: 0, total: 15 }, data: [] })
      .mockRejectedValueOnce(new Error('Temporary timeout'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Go to last page' }));
    });
    expect(screen.getByText('Unable to load systems')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading systems')).not.toBeInTheDocument();
    mockGetRhelSystems.mockResolvedValue({ ...response, meta: { count: 1, total: 15 } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });

    expect(mockGetRhelSystems).toHaveBeenCalledTimes(3);
    expect(mockGetRhelSystems).toHaveBeenLastCalledWith(9, 4, 'mainline', {
      offset: 10,
      limit: 10,
      search: 'server',
      sort_order: 'desc',
    });
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'descending');
  });

  test('ignores an obsolete shrinking-total response after changing the search', async () => {
    mockGetRhelSystems.mockResolvedValue({ ...response, meta: { count: 1, total: 30 } });
    await act(async () => {
      render(<LifecycleModalWindow {...props} />);
    });
    let resolveObsolete!: (value: PaginatedSystemsResponse) => void;
    mockGetRhelSystems.mockImplementationOnce(() => new Promise((resolve) => (resolveObsolete = resolve)));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Go to last page' }));
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter systems by name' }), {
      target: { value: 'server' },
    });
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);
    });
    const callsBeforeObsoleteResponse = mockGetRhelSystems.mock.calls.length;
    await act(async () => {
      resolveObsolete({ meta: { count: 0, total: 0 }, data: [] });
    });

    expect(mockGetRhelSystems).toHaveBeenCalledTimes(callsBeforeObsoleteResponse);
    expect(screen.getByLabelText('Current page')).toHaveValue(2);
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
    expect(screen.queryByText('No systems found')).not.toBeInTheDocument();
  });

  test('search and clear from page two each request only page one with the legacy root', async () => {
    mockGetRhelSystems.mockResolvedValue({ ...response, meta: { count: 1, total: 20 } });
    await act(async () => {
      render(<LifecycleModalWindow {...props} />, { legacyRoot: true });
    });

    for (const search of ['server', '']) {
      await act(async () => {
        fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);
      });
      mockGetRhelSystems.mockClear();
      if (search) {
        fireEvent.change(screen.getByRole('textbox', { name: 'Filter systems by name' }), {
          target: { value: search },
        });
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'Clear button and input' }));
      }
      jest.advanceTimersByTime(399);
      expect(mockGetRhelSystems).not.toHaveBeenCalled();
      // Deliberately outside act: batching the timer would hide the ReactDOM.render regression.
      jest.advanceTimersByTime(1);
      await act(async () => {});

      expect(mockGetRhelSystems).toHaveBeenCalledTimes(1);
      expect(mockGetRhelSystems).toHaveBeenLastCalledWith(
        9,
        4,
        'mainline',
        expect.objectContaining({ offset: 0, search: search || undefined })
      );
      expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
    }
  });

  test('reopening after a search sends only one request with reset parameters', async () => {
    const view = render(<LifecycleModalWindow {...props} />);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Filter systems by name' }), {
      target: { value: 'server-a' },
    });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(mockGetRhelSystems).toHaveBeenLastCalledWith(
      9,
      4,
      'mainline',
      expect.objectContaining({ search: 'server-a' })
    );

    view.rerender(<LifecycleModalWindow {...props} isModalOpen={false} />);
    mockGetRhelSystems.mockClear();
    await act(async () => {
      view.rerender(<LifecycleModalWindow {...props} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    assert.equal(
      mockGetRhelSystems.mock.calls.length,
      1,
      'Reopening must not send a request with the previous search before the reset request'
    );
    expect(mockGetRhelSystems).toHaveBeenLastCalledWith(9, 4, 'mainline', {
      offset: 0,
      limit: 10,
      search: undefined,
      sort_order: 'asc',
    });
    expect(screen.getByRole('textbox', { name: 'Filter systems by name' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'server-a' })).toBeInTheDocument();
  });
});
