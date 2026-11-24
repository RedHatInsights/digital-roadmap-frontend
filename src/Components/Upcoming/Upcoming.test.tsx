import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import UpcomingTab from './Upcoming';
import { getAccessibleHostUuids, getAllUpcomingChanges, getUpcomingChanges } from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges';

// Polyfill for structuredClone in test environment
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock the API functions
jest.mock('../../api', () => ({
  HOST_UUID_LOOKUP_TIMEOUT_MS: 60_000,
  getAccessibleHostUuids: jest.fn(),
  getAllUpcomingChanges: jest.fn(),
  getUpcomingChanges: jest.fn(),
}));

// Mock the lazy-loaded UpcomingTable component
jest.mock('../UpcomingTable/UpcomingTable', () => {
  return function MockUpcomingTable({
    data,
    resetInitialFilters,
    initialTypeFilters,
    selectedViewFilter,
    handleViewFilterChange,
    noDataAvailable,
    contentStatus,
    contentError,
    countsPending,
    countsFailed,
    isExportDisabled,
    exportDisabledTooltipContent,
    onRetryContent,
    contentRetryLabel,
  }: any) {
    return (
      <div data-testid="upcoming-table">
        <div data-testid="table-data-count">{data.length}</div>
        <div data-testid="table-types">{JSON.stringify(data.map((d: any) => d.type))}</div>
        <div data-testid="table-names">{JSON.stringify(data.map((d: any) => d.name))}</div>
        <div data-testid="table-affected-counts">
          {JSON.stringify(data.map((d: any) => d.details?.potentiallyAffectedSystemsCount ?? null))}
        </div>
        <div data-testid="table-deployed-dates">
          {JSON.stringify(data.map((d: any) => d.details?.deployedDate ?? null))}
        </div>
        <div data-testid="initial-type-filters">{JSON.stringify([...initialTypeFilters])}</div>
        <div data-testid="selected-view-filter">{selectedViewFilter}</div>
        <div data-testid="no-data-available">{noDataAvailable.toString()}</div>
        <div data-testid="table-content-status">{contentStatus}</div>
        <div data-testid="table-content-error">{contentError ?? ''}</div>
        <div data-testid="counts-pending">{Boolean(countsPending).toString()}</div>
        <div data-testid="counts-failed">{Boolean(countsFailed).toString()}</div>
        <div data-testid="export-disabled">{Boolean(isExportDisabled).toString()}</div>
        <div data-testid="export-disabled-tooltip">{exportDisabledTooltipContent}</div>
        {contentStatus === 'error' && (
          <button onClick={onRetryContent} data-testid="retry-content">
            {contentRetryLabel}
          </button>
        )}
        <button onClick={resetInitialFilters} data-testid="reset-filters">
          Reset Filters
        </button>
        <button onClick={() => handleViewFilterChange('all')} data-testid="switch-to-all">
          Switch to All
        </button>
        <button onClick={() => handleViewFilterChange('relevant')} data-testid="switch-to-relevant">
          Switch to Relevant
        </button>
      </div>
    );
  };
});

// Mock SCSS import
jest.mock('./upcoming.scss', () => ({}));

// Mock react-router-dom hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
}));

// Mock PatternFly components that might cause issues
jest.mock('@patternfly/react-component-groups/dist/dynamic/ErrorState', () => {
  return function MockErrorState({ titleText, bodyText, errorTitle, errorDescription }: any) {
    return (
      <div data-testid="error-state">
        <div data-testid="error-title">{titleText || errorTitle}</div>
        <div data-testid="error-description">{bodyText || errorDescription}</div>
      </div>
    );
  };
});

// Create typed mocks
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockSetSearchParams = jest.fn();

const mockGetAllUpcomingChanges = getAllUpcomingChanges as jest.MockedFunction<typeof getAllUpcomingChanges>;
const mockGetAccessibleHostUuids = getAccessibleHostUuids as jest.MockedFunction<typeof getAccessibleHostUuids>;
const mockGetUpcomingChanges = getUpcomingChanges as jest.MockedFunction<typeof getUpcomingChanges>;

const upcomingResponse = (data: UpcomingChanges[]): Awaited<ReturnType<typeof getAllUpcomingChanges>> => ({
  meta: { count: data.length, total: data.length },
  data: data as unknown as Awaited<ReturnType<typeof getAllUpcomingChanges>>['data'],
});

// The "relevant" view is derived from the "all" response, so the affected-systems count
// is what decides whether an item shows up there.
const detailsWithCount = (potentiallyAffectedSystemsCount: number) => ({
  summary: 'Test summary',
  architecture: 'x86_64',
  potentiallyAffectedSystemsCount,
  potentiallyAffectedSystemsDetail: [],
  trainingTicket: 'TEST-1',
  deployedDate: '2024-11-01',
  lastModified: '2024-01-01',
  detailFormat: 0 as const,
});

// Test data: 3 items, of which only the first is relevant (count > 0)
const mockAllData: UpcomingChanges[] = [
  {
    name: 'Test Change 1',
    type: 'deprecation',
    release: 'Release 1.0',
    date: '2024-12-01',
    package: 'ruby',
    details: detailsWithCount(4),
  },
  {
    name: 'Test Change 2',
    type: 'addition',
    release: 'Release 2.0',
    date: '2024-12-15',
    package: 'postgresql',
    details: detailsWithCount(0),
  },
  {
    name: 'Test Change 3',
    type: 'change',
    release: 'Release 1.0',
    date: '2024-12-01',
    package: 'rust',
    details: detailsWithCount(0),
  },
];

const withoutAffectedSystems = (item: UpcomingChanges): UpcomingChanges => ({
  ...item,
  details: item.details
    ? {
        summary: item.details.summary,
        architecture: item.details.architecture,
        trainingTicket: item.details.trainingTicket,
        deployedDate: item.details.deployedDate,
        lastModified: item.details.lastModified,
        detailFormat: item.details.detailFormat,
      }
    : undefined,
});

const mockCatalogData = mockAllData.map(withoutAffectedSystems);

// Every count is 0, so nothing is relevant
const mockNoRelevantData: UpcomingChanges[] = mockAllData.map((item) => ({
  ...item,
  details: detailsWithCount(0),
}));

const renderComponent = (searchParams = '') => {
  return render(
    <MemoryRouter initialEntries={[`/?${searchParams}`]}>
      <UpcomingTab />
    </MemoryRouter>
  );
};

// Helper to setup search params mock
const setupSearchParamsMock = (params: Record<string, string> = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  // Use the mocked function, not the original
  mockedUseSearchParams.mockReturnValue([searchParams, mockSetSearchParams]);
};

// Suppress console.error for expected error scenarios
const suppressConsoleError = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

describe('UpcomingTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetSearchParams.mockClear();
    setupSearchParamsMock(); // Reset to empty params

    // Reset mocks to default successful state
    mockGetAccessibleHostUuids.mockResolvedValue({ meta: { count: 1, total: 1 }, data: ['host-1'] });
    mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mockAllData));
    mockGetUpcomingChanges.mockResolvedValue({ data: mockCatalogData } as Awaited<
      ReturnType<typeof getUpcomingChanges>
    >);
  });

  describe('Initial Loading', () => {
    test('keeps the table controls visible while relevant data is loading', async () => {
      let resolveAll: (value: any) => void;

      // Create a promise that we can control
      const allPromise = new Promise((resolve) => {
        resolveAll = resolve;
      });

      mockGetAllUpcomingChanges.mockReturnValue(allPromise as any);

      // Render the component and wait for the loading state to be set
      await act(async () => {
        renderComponent();
        // Wait for the next tick to allow useEffect to run
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByTestId('upcoming-table')).toBeInTheDocument();
      expect(screen.getByTestId('table-content-status')).toHaveTextContent('loading');
      expect(screen.getByRole('heading', { name: /preparing roadmap data/ })).toBeInTheDocument();
      const correlationProgress = screen.getByTestId('upcoming-correlation-progress');
      expect(correlationProgress.parentElement?.firstElementChild).toBe(correlationProgress);
      const summaryCountSkeletons = screen.getAllByTestId('upcoming-summary-count-skeleton');
      expect(summaryCountSkeletons).toHaveLength(3);
      summaryCountSkeletons.forEach((skeleton) => {
        expect(skeleton).toHaveStyle({ display: 'inline-block', height: '1em', verticalAlign: 'middle' });
      });
      expect(
        screen.getByText(
          'Large environments can take a few minutes to calculate. Keep this tab open to watch progress.'
        )
      ).toBeInTheDocument();
      expect(screen.getByTestId('export-disabled')).toHaveTextContent('true');

      // Resolve the promise
      await act(async () => {
        resolveAll!({ data: mockAllData });
      });

      // Wait for correlation to complete without replacing the page.
      await waitFor(
        () => {
          expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
        },
        { timeout: 3000 }
      );
    });

    test('fetches data on mount and displays summary cards', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));

      // Check summary cards are rendered
      expect(screen.getByText('Deprecations')).toBeInTheDocument();
      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('Additions and enhancements')).toBeInTheDocument();

      // Should show relevant data initially (1 item)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
    });
  });

  describe('Data Fetching', () => {
    // The relevant view is derived from the all=true catalog, so the page loads host ids once
    // and asks for that catalog once.
    test('fetches host ids once and derives the relevant view', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      });

      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(1);
      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAccessibleHostUuids).toHaveBeenCalledWith(expect.any(AbortSignal), 60_000);
      expect(mockGetUpcomingChanges).toHaveBeenCalledWith(expect.any(AbortSignal));
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledWith(
        ['host-1'],
        expect.any(Function),
        expect.any(AbortSignal)
      );

      // Should display relevant data initially - only the item with count > 0
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
    });

    test('does not refetch when toggling between views', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-all'));
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-relevant'));
      });

      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(1);
      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
    });

    test('retries transient host UUID lookup failures up to three attempts', async () => {
      mockGetAccessibleHostUuids
        .mockRejectedValueOnce(new Error('Host inventory unavailable'))
        .mockRejectedValueOnce({ status_code: 503, message: 'Host inventory unavailable' })
        .mockResolvedValueOnce({ meta: { count: 1, total: 1 }, data: ['host-1'] });

      renderComponent();

      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'), {
        timeout: 3000,
      });

      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(3);
      expect(mockGetAccessibleHostUuids).toHaveBeenNthCalledWith(1, expect.any(AbortSignal), 60_000);
      expect(mockGetAccessibleHostUuids).toHaveBeenNthCalledWith(2, expect.any(AbortSignal), 60_000);
      expect(mockGetAccessibleHostUuids).toHaveBeenNthCalledWith(3, expect.any(AbortSignal), 60_000);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
    });

    test('does not retry permanent host UUID lookup failures', async () => {
      mockGetAccessibleHostUuids.mockRejectedValue({ status_code: 403, message: 'Forbidden' });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent('Forbidden');
      });

      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).not.toHaveBeenCalled();
    });

    test('stops after three transient host UUID lookup attempts', async () => {
      mockGetAccessibleHostUuids.mockRejectedValue(new Error('Host inventory unavailable'));

      renderComponent();

      await waitFor(
        () => {
          expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
          expect(screen.getByTestId('table-content-error')).toHaveTextContent('Host inventory unavailable');
        },
        { timeout: 3000 }
      );

      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(3);
      expect(mockGetAllUpcomingChanges).not.toHaveBeenCalled();
    });

    test('does not restart requests when the URL setter identity changes on a view switch', async () => {
      const searchParams = new URLSearchParams();
      const nextSetter = jest.fn();
      let activeSetter = jest.fn((nextUrl: unknown) => {
        if (String(nextUrl).includes('viewFilter=all')) {
          activeSetter = nextSetter;
        }
      });
      mockedUseSearchParams.mockImplementation(() => [searchParams, activeSetter]);

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));

      fireEvent.click(screen.getByTestId('switch-to-all'));
      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      });
      fireEvent.click(screen.getByTestId('switch-to-relevant'));
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));

      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
    });

    test('shows the static All catalog before correlation completes', async () => {
      let resolveCorrelation: (value: Awaited<ReturnType<typeof getAllUpcomingChanges>>) => void = () => undefined;
      mockGetAllUpcomingChanges.mockImplementation(() => new Promise((resolve) => (resolveCorrelation = resolve)));

      renderComponent();
      await waitFor(() => expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('loading'));

      fireEvent.click(screen.getByTestId('switch-to-all'));
      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      });
      expect(screen.getByTestId('counts-pending')).toHaveTextContent('true');
      expect(screen.getByTestId('export-disabled')).toHaveTextContent('true');

      await act(async () => resolveCorrelation(upcomingResponse(mockAllData)));
      await waitFor(() => expect(screen.getByTestId('counts-pending')).toHaveTextContent('false'));
      expect(screen.getByTestId('export-disabled')).toHaveTextContent('false');
    });

    test('keeps Relevant available when the static catalog fails', async () => {
      mockGetUpcomingChanges.mockRejectedValue(new Error('Catalog unavailable'));

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));

      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
      expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      fireEvent.click(screen.getByTestId('switch-to-all'));
      expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
      expect(screen.getByTestId('table-content-error')).toHaveTextContent('Catalog unavailable');
    });

    test('keeps the static All catalog available after correlation fails', async () => {
      mockGetAllUpcomingChanges.mockRejectedValue(new Error('Correlation unavailable'));

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('error'));
      expect(screen.getByTestId('table-content-error')).toHaveTextContent('Correlation unavailable');
      expect(screen.getByTestId('retry-content')).toHaveTextContent('Retry all');

      fireEvent.click(screen.getByTestId('switch-to-all'));
      expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      expect(screen.getByTestId('counts-failed')).toHaveTextContent('true');
      expect(screen.getByTestId('export-disabled')).toHaveTextContent('true');
      expect(screen.getByTestId('export-disabled-tooltip')).toHaveTextContent('Data failed to load');
      expect(screen.getByTestId('upcoming-correlation-error')).toBeInTheDocument();
      expect(screen.getByTestId('retry-correlation')).toHaveTextContent('Retry affected system counts');
    });

    test('retries correlation from All without refetching the catalog', async () => {
      mockGetAllUpcomingChanges
        .mockRejectedValueOnce(new Error('Correlation unavailable'))
        .mockResolvedValueOnce(upcomingResponse(mockAllData));

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('error'));
      fireEvent.click(screen.getByTestId('switch-to-all'));
      expect(screen.getByTestId('upcoming-correlation-error')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('retry-correlation'));

      await waitFor(() => {
        expect(screen.queryByTestId('upcoming-correlation-error')).not.toBeInTheDocument();
        expect(screen.getByTestId('counts-failed')).toHaveTextContent('false');
      });
      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(2);
      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(2);
    });

    test('Retry all reloads correlation while preserving the catalog request', async () => {
      mockGetAllUpcomingChanges
        .mockRejectedValueOnce(new Error('Correlation unavailable'))
        .mockResolvedValueOnce(upcomingResponse(mockAllData));

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('error'));
      fireEvent.click(screen.getByTestId('retry-content'));

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      });
      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(2);
      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(2);
    });

    test('All retry refetches only the catalog and reuses completed correlation', async () => {
      mockGetUpcomingChanges
        .mockRejectedValueOnce(new Error('Catalog unavailable'))
        .mockResolvedValueOnce({ data: mockCatalogData } as Awaited<ReturnType<typeof getUpcomingChanges>>);

      renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
      fireEvent.click(screen.getByTestId('switch-to-all'));
      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('error'));
      fireEvent.click(screen.getByTestId('retry-content'));

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      });
      expect(mockGetAccessibleHostUuids).toHaveBeenCalledTimes(1);
      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(mockGetUpcomingChanges).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('export-disabled')).toHaveTextContent('false');
    });

    test('skips correlation POST when the host UUID list is empty', async () => {
      mockGetAccessibleHostUuids.mockResolvedValue({ meta: { count: 0, total: 0 }, data: [] });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready'));
      expect(mockGetAllUpcomingChanges).not.toHaveBeenCalled();
      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      expect(screen.getByTestId('table-affected-counts')).toHaveTextContent('[0,0,0]');
    });

    test('rejects whitespace-only host UUIDs before starting correlation', async () => {
      mockGetAccessibleHostUuids.mockResolvedValue({ meta: { count: 1, total: 1 }, data: ['   '] });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent(
          'Host inventory returned an invalid system identifier list.'
        );
      });
      expect(mockGetAllUpcomingChanges).not.toHaveBeenCalled();
    });

    test('aborts in-flight upcoming requests when the page unmounts', async () => {
      let signal: AbortSignal | undefined;
      mockGetAccessibleHostUuids.mockImplementation((incoming?: AbortSignal) => {
        signal = incoming;
        return new Promise(() => undefined);
      });

      const view = renderComponent();

      await waitFor(() => {
        expect(signal).toBeInstanceOf(AbortSignal);
      });

      view.unmount();
      expect(signal?.aborted).toBe(true);
    });

    test('aborts the current correlation retry when the page unmounts', async () => {
      let retrySignal: AbortSignal | undefined;
      mockGetAllUpcomingChanges
        .mockRejectedValueOnce(new Error('Correlation unavailable'))
        .mockImplementationOnce((_hostIds, _onProgress, signal) => {
          retrySignal = signal;
          return new Promise(() => undefined);
        });

      const view = renderComponent();
      await waitFor(() => expect(screen.getByTestId('retry-content')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('retry-content'));
      await waitFor(() => expect(retrySignal).toBeInstanceOf(AbortSignal));

      view.unmount();
      expect(retrySignal?.aborted).toBe(true);
    });

    test('aborts the current catalog retry when the page unmounts', async () => {
      let retrySignal: AbortSignal | undefined;
      mockGetUpcomingChanges
        .mockRejectedValueOnce(new Error('Catalog unavailable'))
        .mockImplementationOnce((signal) => {
          retrySignal = signal;
          return new Promise(() => undefined);
        });

      const view = renderComponent();
      await waitFor(() => expect(screen.getByTestId('table-data-count')).toHaveTextContent('1'));
      fireEvent.click(screen.getByTestId('switch-to-all'));
      await waitFor(() => expect(screen.getByTestId('retry-content')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('retry-content'));
      await waitFor(() => expect(retrySignal).toBeInstanceOf(AbortSignal));

      view.unmount();
      expect(retrySignal?.aborted).toBe(true);
    });

    test('shows how many systems are loading once a system total is known', async () => {
      let resolveChanges: (value: Awaited<ReturnType<typeof getAllUpcomingChanges>>) => void = () => undefined;
      mockGetAllUpcomingChanges.mockImplementation((_hostIds, onProgress) => {
        onProgress?.({ completed: 2000, total: 4500 });
        return new Promise((resolve) => {
          resolveChanges = resolve;
        });
      });

      await act(async () => {
        renderComponent();
      });

      expect(
        await screen.findByRole('heading', { name: /preparing roadmap data for 4,500 systems/ })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Large environments can take a few minutes to calculate. Keep this tab open to watch progress.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('2,000 / 4,500 systems')).toBeInTheDocument();
      expect(screen.getByText('44%')).toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: 'Roadmap data loading progress' })).toBeInTheDocument();

      await act(async () => {
        resolveChanges(upcomingResponse(mockAllData));
      });

      await waitFor(() => {
        expect(screen.queryByText('2,000 / 4,500 systems')).not.toBeInTheDocument();
        expect(screen.queryByText("We're preparing roadmap data for 4,500 systems")).not.toBeInTheDocument();
      });
    });

    test('handles API failure gracefully', async () => {
      const errorMessage = 'Not authorized to access host inventory';
      mockGetAllUpcomingChanges.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent(
          'Not authorized to access host inventory'
        );
      });
    });

    test('handles workspace filtering error', async () => {
      const errorMessage = 'Error: Workspace filtering is not yet implemented';

      mockGetAllUpcomingChanges.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        renderComponent();
      });

      // The component shows planning not enabled message
      await waitFor(() => {
        expect(screen.getByText('Planning is not yet enabled for your organization')).toBeInTheDocument();
      });
    });

    test('shows correlation errors in the Relevant content region', async () => {
      const timeoutError = { message: 'Gateway Timeout', status_code: 504 };

      mockGetAllUpcomingChanges.mockRejectedValue(timeoutError);

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent('Gateway Timeout');
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
      });
    });

    test('handles an error with a status code', async () => {
      const serverError = { message: 'Internal Server Error', status_code: 500 };

      mockGetAllUpcomingChanges.mockRejectedValue(serverError);

      await act(async () => {
        renderComponent();
      });

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent('Internal Server Error');
      });
    });
  });

  describe('View Filter Switching', () => {
    test('switches from relevant to all view', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      });

      // Switch to all view
      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-all'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });
    });

    test('relevant view excludes count 0 items that the all view keeps', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-names')).toBeInTheDocument();
      });

      // Relevant: only the item with count > 0
      expect(JSON.parse(screen.getByTestId('table-names').textContent!)).toEqual(['Test Change 1']);

      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-all'));
      });

      // All: the count 0 items are back
      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('table-names').textContent!)).toEqual([
          'Test Change 1',
          'Test Change 2',
          'Test Change 3',
        ]);
      });
    });

    test('auto-switches to all view when every count is 0', async () => {
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mockNoRelevantData));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        // Should auto-switch to all view since relevant data is empty
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });
    });

    test('prevents switching to relevant when no relevant data available', async () => {
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mockNoRelevantData));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });

      // Try to switch to relevant - should not work
      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-relevant'));
      });

      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
    });
  });

  describe('Card Interactions', () => {
    test('clicking deprecations card filters by deprecation type', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Find the clickable button in the deprecations card by its aria-labelledby
      const deprecationsButtons = screen.getAllByRole('button');
      const deprecationsButton = deprecationsButtons.find(
        (btn) => btn.getAttribute('aria-labelledby') === 'Deprecations'
      );
      expect(deprecationsButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(deprecationsButton!);
      });

      // URL should be updated with type filter
      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });
    });

    test('clicking changes card filters by change type', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Find the clickable button in the changes card by its aria-labelledby
      const changesButtons = screen.getAllByRole('button');
      const changesButton = changesButtons.find(
        (btn) => btn.getAttribute('aria-labelledby') === 'filter-by-type-2'
      );
      expect(changesButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(changesButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });
    });

    test('clicking additions card filters by addition and enhancement types', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Find the clickable button in the additions card by its aria-labelledby
      const additionsButtons = screen.getAllByRole('button');
      const additionsButton = additionsButtons.find(
        (btn) => btn.getAttribute('aria-labelledby') === 'filter-by-type-3'
      );
      expect(additionsButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(additionsButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });
    });

    test('preserves a card filter selected before initial URL filters finish applying', async () => {
      let resolveCatalog: (value: Awaited<ReturnType<typeof getUpcomingChanges>>) => void = () => undefined;
      let resolveCorrelation: (value: Awaited<ReturnType<typeof getAllUpcomingChanges>>) => void = () => undefined;
      mockGetUpcomingChanges.mockReturnValue(
        new Promise<Awaited<ReturnType<typeof getUpcomingChanges>>>((resolve) => (resolveCatalog = resolve))
      );
      mockGetAllUpcomingChanges.mockReturnValue(
        new Promise<Awaited<ReturnType<typeof getAllUpcomingChanges>>>((resolve) => (resolveCorrelation = resolve))
      );
      setupSearchParamsMock({ type: 'Deprecation' });

      renderComponent('type=Deprecation');

      const changesButton = screen
        .getAllByRole('button')
        .find((button) => button.getAttribute('aria-labelledby') === 'filter-by-type-2');
      expect(changesButton).toBeInTheDocument();
      fireEvent.click(changesButton!);

      await act(async () => {
        resolveCatalog({ data: mockCatalogData });
        resolveCorrelation(upcomingResponse(mockAllData));
      });

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('initial-type-filters').textContent!)).toEqual(['Change']);
      });
      const latestUrl = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
      expect(latestUrl).toContain('type=Change');
    });

    test('keeps unmatched catalog correlation counts unknown instead of showing zero', async () => {
      const mismatchedCorrelation = mockAllData.map((item, index) =>
        index === 0
          ? {
              ...item,
              details: { ...item.details!, summary: 'A different identity' },
            }
          : item
      );
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mismatchedCorrelation));

      renderComponent();

      await waitFor(() => expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready'));
      fireEvent.click(screen.getByTestId('switch-to-all'));

      await waitFor(() => {
        expect(JSON.parse(screen.getByTestId('table-affected-counts').textContent!)).toEqual([null, 0, 0]);
      });
    });
  });

  describe('Filter Reset', () => {
    test('resets filters to default state', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Reset filters
      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-filters'));
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });
    });

    test('resets to all view when no relevant data available', async () => {
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mockNoRelevantData));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-filters'));
      });

      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
    });
  });

  describe('URL Parameters', () => {
    test('preserves initial URL filters when switching views before loading completes', async () => {
      type CatalogResponse = Awaited<ReturnType<typeof getUpcomingChanges>>;
      type CorrelationResponse = Awaited<ReturnType<typeof getAllUpcomingChanges>>;
      let resolveCatalog: (value: CatalogResponse) => void = () => undefined;
      let resolveCorrelation: (value: CorrelationResponse) => void = () => undefined;
      mockGetUpcomingChanges.mockReturnValue(
        new Promise<CatalogResponse>((resolve) => (resolveCatalog = resolve))
      );
      mockGetAllUpcomingChanges.mockReturnValue(
        new Promise<CorrelationResponse>((resolve) => (resolveCorrelation = resolve))
      );
      setupSearchParamsMock({ name: 'Ruby', type: 'Change', release: 'Release 1.0' });

      renderComponent('name=Ruby&type=Change&release=Release%201.0');

      fireEvent.click(screen.getByTestId('switch-to-all'));

      const latestUrl = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
      expect(latestUrl).toContain('name=Ruby');
      expect(latestUrl).toContain('type=Change');
      expect(latestUrl).toContain('release=Release 1.0');
      expect(latestUrl).toContain('viewFilter=all');

      await act(async () => {
        resolveCatalog({ data: mockCatalogData });
        resolveCorrelation(upcomingResponse(mockAllData));
      });
    });

    test('initializes with view filter from URL', async () => {
      setupSearchParamsMock({ viewFilter: 'all' });

      await act(async () => {
        renderComponent('viewFilter=all');
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      });
    });

    // RSPEED-2766: verify that clicking a type card preserves viewFilter=all when set via URL on page load
    test('U1: clicking Changes card preserves viewFilter=all after URL-initialized load', async () => {
      setupSearchParamsMock({ viewFilter: 'all' });

      await act(async () => {
        renderComponent('viewFilter=all');
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });

      mockSetSearchParams.mockClear();

      const allButtonsU1 = screen.getAllByRole('button');
      const changesButton = allButtonsU1.find((btn) => btn.getAttribute('aria-labelledby') === 'filter-by-type-2');
      expect(changesButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(changesButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
        const callArg = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
        expect(callArg).toContain('viewFilter=all');
        expect(callArg).toContain('type=Change');
      });
    });

    test('U2: clicking Deprecations card preserves viewFilter=all after URL-initialized load', async () => {
      setupSearchParamsMock({ viewFilter: 'all' });

      await act(async () => {
        renderComponent('viewFilter=all');
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });

      mockSetSearchParams.mockClear();

      const allButtonsU2 = screen.getAllByRole('button');
      const deprecationsButton = allButtonsU2.find(
        (btn) => btn.getAttribute('aria-labelledby') === 'Deprecations'
      );
      expect(deprecationsButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(deprecationsButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
        const callArg = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
        expect(callArg).toContain('viewFilter=all');
        expect(callArg).toContain('type=Deprecation');
      });
    });

    test('U3: clicking Additions card preserves viewFilter=all after URL-initialized load', async () => {
      setupSearchParamsMock({ viewFilter: 'all' });

      await act(async () => {
        renderComponent('viewFilter=all');
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });

      mockSetSearchParams.mockClear();

      const allButtonsU3 = screen.getAllByRole('button');
      const additionsButton = allButtonsU3.find(
        (btn) => btn.getAttribute('aria-labelledby') === 'filter-by-type-3'
      );
      expect(additionsButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(additionsButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
        const callArg = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
        expect(callArg).toContain('viewFilter=all');
        expect(callArg).toContain('Addition');
        expect(callArg).toContain('Enhancement');
      });
    });

    test('accepts type=Change URL param even when data only contains addition items', async () => {
      const additionOnlyData: UpcomingChanges[] = [
        { name: 'New Feature', type: 'addition', release: 'Release 1.0', date: '2024-12-01', package: 'ruby' },
      ];
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(additionOnlyData));

      setupSearchParamsMock({ type: 'Change' });

      await act(async () => {
        renderComponent('type=Change');
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      await waitFor(() => {
        const typeFilters = JSON.parse(screen.getByTestId('initial-type-filters').textContent!);
        expect(typeFilters).toContain('Change');
      });
    });

    test('accepts type=Deprecation URL param even when data only contains addition items', async () => {
      const additionOnlyData: UpcomingChanges[] = [
        { name: 'New Feature', type: 'addition', release: 'Release 1.0', date: '2024-12-01', package: 'ruby' },
      ];
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(additionOnlyData));

      setupSearchParamsMock({ type: 'Deprecation' });

      await act(async () => {
        renderComponent('type=Deprecation');
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      await waitFor(() => {
        const typeFilters = JSON.parse(screen.getByTestId('initial-type-filters').textContent!);
        expect(typeFilters).toContain('Deprecation');
      });
    });

    test('accepts compound type URL param with types not in data', async () => {
      const additionOnlyData: UpcomingChanges[] = [
        { name: 'New Feature', type: 'addition', release: 'Release 1.0', date: '2024-12-01', package: 'ruby' },
      ];
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(additionOnlyData));

      setupSearchParamsMock({ type: 'Change,Deprecation' });

      await act(async () => {
        renderComponent('type=Change%2CDeprecation');
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      await waitFor(() => {
        const typeFilters = JSON.parse(screen.getByTestId('initial-type-filters').textContent!);
        expect(typeFilters).toContain('Change');
        expect(typeFilters).toContain('Deprecation');
      });
    });

    test('rejects invalid type URL param', async () => {
      setupSearchParamsMock({ type: 'InvalidType' });

      await act(async () => {
        renderComponent('type=InvalidType');
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      await waitFor(() => {
        const typeFilters = JSON.parse(screen.getByTestId('initial-type-filters').textContent!);
        expect(typeFilters).toEqual([]);
      });
    });

    test('U4: clicking a type card with default viewFilter preserves viewFilter=relevant', async () => {
      // No viewFilter param — default is 'relevant'
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
      });

      mockSetSearchParams.mockClear();

      const allButtonsU4 = screen.getAllByRole('button');
      const changesButton = allButtonsU4.find((btn) => btn.getAttribute('aria-labelledby') === 'filter-by-type-2');
      expect(changesButton).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(changesButton!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
        const callArg = mockSetSearchParams.mock.calls[mockSetSearchParams.mock.calls.length - 1][0];
        expect(callArg).toContain('viewFilter=relevant');
        expect(callArg).toContain('type=Change');
      });
    });
  });

  describe('Empty States', () => {
    test('displays no data available state when all data sources are empty', async () => {
      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse([]));
      mockGetUpcomingChanges.mockResolvedValue({ data: [] } as Awaited<ReturnType<typeof getUpcomingChanges>>);

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Data Processing', () => {
    test('correctly capitalizes type values', async () => {
      const dataWithLowerCaseTypes = [
        { ...mockNoRelevantData[0], type: 'deprecation' },
        { ...mockNoRelevantData[1], type: 'addition' },
        { ...mockNoRelevantData[2], type: 'change' },
      ];

      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(dataWithLowerCaseTypes));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Should auto-switch to all view and show the count
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('3');
      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');

      const types = JSON.parse(screen.getByTestId('table-types').textContent!);
      expect(types).toEqual(['Deprecation', 'Addition', 'Change']);
    });

    test('correctly calculates counts for different types', async () => {
      const mixedData = [
        { name: 'Test 1', type: 'Deprecation', release: 'R1', date: '2024-01-01', package: 'ruby' },
        { name: 'Test 2', type: 'Addition', release: 'R1', date: '2024-01-01', package: 'postgresql' },
        { name: 'Test 3', type: 'Enhancement', release: 'R1', date: '2024-01-01', package: 'rust' },
        { name: 'Test 4', type: 'Change', release: 'R1', date: '2024-01-01', package: 'python' },
        { name: 'Test 5', type: 'Change', release: 'R1', date: '2024-01-01', package: 'nodejs' },
      ];

      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(mixedData));
      mockGetUpcomingChanges.mockResolvedValue({ data: mixedData } as Awaited<
        ReturnType<typeof getUpcomingChanges>
      >);

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      // Check that data is rendered
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('5');

      // Check cards are present
      expect(screen.getByText('Deprecations')).toBeInTheDocument();
      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('Additions and enhancements')).toBeInTheDocument();
    });

    test('fills in todays date when deployedDate is null', async () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const dataWithNullDeployedDate: UpcomingChanges[] = [
        {
          name: 'Null Date Item',
          type: 'deprecation',
          release: 'R1',
          date: '2024-12-01',
          package: 'ruby',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 0,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TEST-1',
            deployedDate: null,
            lastModified: '2024-01-01',
            detailFormat: 0,
          },
        },
      ];

      mockGetAllUpcomingChanges.mockResolvedValue(upcomingResponse(dataWithNullDeployedDate));
      mockGetUpcomingChanges.mockResolvedValue({
        data: dataWithNullDeployedDate.map(withoutAffectedSystems),
      } as Awaited<ReturnType<typeof getUpcomingChanges>>);

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('ready');
      });

      const deployedDates = JSON.parse(screen.getByTestId('table-deployed-dates').textContent!);
      expect(deployedDates).toEqual([todayStr]);
    });
  });

  describe('Error Handling', () => {
    test('handles redirect to dashboard for workspace filtering error', async () => {
      // Mock window.location
      const mockLocation = { origin: 'http://localhost:3000', href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      const workspaceError = new Error('Error: Workspace filtering is not yet implemented');

      mockGetAllUpcomingChanges.mockImplementation(() => {
        throw workspaceError;
      });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        // The test output shows this text appears
        expect(screen.getByText('Planning is not yet enabled for your organization')).toBeInTheDocument();
        expect(screen.getByText('Return to home page')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Return to home page'));
      });

      expect(mockLocation.href).toBe('http://localhost:3000/insights/dashboard');
    });

    test('handles general API errors', async () => {
      mockGetAllUpcomingChanges.mockRejectedValue(new Error('General API Error'));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-content-status')).toHaveTextContent('error');
        expect(screen.getByTestId('table-content-error')).toHaveTextContent('General API Error');
      });
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to UpcomingTable', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('upcoming-table')).toBeInTheDocument();
        expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
        expect(screen.getByTestId('no-data-available')).toHaveTextContent('false');
      });
    });

    test('handles UpcomingTable callbacks correctly', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('upcoming-table')).toBeInTheDocument();
      });

      // Test reset filters callback
      await act(async () => {
        fireEvent.click(screen.getByTestId('reset-filters'));
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });

      // Test view filter change callback
      await act(async () => {
        fireEvent.click(screen.getByTestId('switch-to-all'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('all');
      });
    });
  });
});
