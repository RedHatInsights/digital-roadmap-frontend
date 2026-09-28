import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import UpcomingTab from './Upcoming';
import { getAllUpcomingChanges } from '../../api';
import { UpcomingChanges } from '../../types/UpcomingChanges';

// Polyfill for structuredClone in test environment
if (!global.structuredClone) {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

// Mock the API functions
jest.mock('../../api', () => ({
  getAllUpcomingChanges: jest.fn(),
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
  }: any) {
    return (
      <div data-testid="upcoming-table">
        <div data-testid="table-data-count">{data.length}</div>
        <div data-testid="table-types">{JSON.stringify(data.map((d: any) => d.type))}</div>
        <div data-testid="table-names">{JSON.stringify(data.map((d: any) => d.name))}</div>
        <div data-testid="table-deployed-dates">
          {JSON.stringify(data.map((d: any) => d.details?.deployedDate ?? null))}
        </div>
        <div data-testid="initial-type-filters">{JSON.stringify([...initialTypeFilters])}</div>
        <div data-testid="selected-view-filter">{selectedViewFilter}</div>
        <div data-testid="no-data-available">{noDataAvailable.toString()}</div>
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
    mockGetAllUpcomingChanges.mockResolvedValue({ data: mockAllData });
  });

  describe('Initial Loading', () => {
    test('displays loading spinner initially', async () => {
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

      // Check loading spinner is present
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Resolve the promise
      await act(async () => {
        resolveAll!({ data: mockAllData });
      });

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    test('fetches data on mount and displays summary cards', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check summary cards are rendered
      expect(screen.getByText('Deprecations')).toBeInTheDocument();
      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('Additions and enhancements')).toBeInTheDocument();

      // Should show relevant data initially (1 item)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
    });
  });

  describe('Data Fetching', () => {
    // RHINENG-30470: page load must issue a single inventory request, not two
    test('fetches upcoming changes with one request and derives the relevant view', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toBeInTheDocument();
      });

      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);

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

      expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
    });

    test('handles API failure gracefully', async () => {
      const errorMessage = 'Not authorized to access host inventory';
      mockGetAllUpcomingChanges.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-description')).toHaveTextContent(
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

    test('handles timeout error (504)', async () => {
      const timeoutError = { message: 'Timeout reached when calculating response', status_code: 504 };

      mockGetAllUpcomingChanges.mockRejectedValue(timeoutError);

      await act(async () => {
        renderComponent();
      });

      // Should show timeout message
      await waitFor(() => {
        expect(screen.getByText('Timeout reached when calculating response')).toBeInTheDocument();
      });
    });

    test('handles non-504 error with status code', async () => {
      const serverError = { message: 'Internal Server Error', status_code: 500 };

      mockGetAllUpcomingChanges.mockRejectedValue(serverError);

      await act(async () => {
        renderComponent();
      });

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-description')).toHaveTextContent('Internal Server Error');
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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: mockNoRelevantData });

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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: mockNoRelevantData });

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
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
  });

  describe('Filter Reset', () => {
    test('resets filters to default state', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: mockNoRelevantData });

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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: additionOnlyData });

      setupSearchParamsMock({ type: 'Change' });

      await act(async () => {
        renderComponent('type=Change');
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: additionOnlyData });

      setupSearchParamsMock({ type: 'Deprecation' });

      await act(async () => {
        renderComponent('type=Deprecation');
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: additionOnlyData });

      setupSearchParamsMock({ type: 'Change,Deprecation' });

      await act(async () => {
        renderComponent('type=Change%2CDeprecation');
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
      mockGetAllUpcomingChanges.mockResolvedValue({ data: [] });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByText('No roadmap data available')).toBeInTheDocument();
        expect(
          screen.getByText(
            'We could not find any Roadmap data. Please add systems to inventory to view Roadmap information.'
          )
        ).toBeInTheDocument();
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

      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithLowerCaseTypes });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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

      mockGetAllUpcomingChanges.mockResolvedValue({ data: mixedData });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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

      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithNullDeployedDate });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
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
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-description')).toHaveTextContent('General API Error');
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
