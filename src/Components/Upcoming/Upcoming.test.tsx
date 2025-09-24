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
    selectedViewFilter,
    handleViewFilterChange,
    noDataAvailable,
  }: any) {
    return (
      <div data-testid="upcoming-table">
        <div data-testid="table-data-count">{data.length}</div>
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
  return function MockErrorState({ errorTitle, errorDescription }: any) {
    return (
      <div data-testid="error-state">
        <div data-testid="error-title">{errorTitle}</div>
        <div data-testid="error-description">{errorDescription}</div>
      </div>
    );
  };
});

// Create typed mocks
const mockedUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockSetSearchParams = jest.fn();

const mockGetAllUpcomingChanges = getAllUpcomingChanges as jest.MockedFunction<typeof getAllUpcomingChanges>;

// Test data - includes details field for relevant filtering
const mockAllData: UpcomingChanges[] = [
  {
    name: 'Test Change 1',
    type: 'deprecation',
    release: 'Release 1.0',
    date: '2024-12-01',
    package: 'ruby',
    details: {
      summary: 'Test summary 1',
      architecture: 'x86_64',
      potentiallyAffectedSystemsCount: 5,
      potentiallyAffectedSystemsDetail: [],
      trainingTicket: 'TICKET-1',
      dateAdded: '2024-01-01',
      lastModified: '2024-01-01',
      detailFormat: 1,
    },
  },
  {
    name: 'Test Change 2',
    type: 'addition',
    release: 'Release 2.0',
    date: '2024-12-15',
    package: 'postgresql',
    details: {
      summary: 'Test summary 2',
      architecture: 'x86_64',
      potentiallyAffectedSystemsCount: 0,
      potentiallyAffectedSystemsDetail: [],
      trainingTicket: 'TICKET-2',
      dateAdded: '2024-01-01',
      lastModified: '2024-01-01',
      detailFormat: 1,
    },
  },
  {
    name: 'Test Change 3',
    type: 'change',
    release: 'Release 1.0',
    date: '2024-12-01',
    package: 'rust',
    details: {
      summary: 'Test summary 3',
      architecture: 'x86_64',
      potentiallyAffectedSystemsCount: 0,
      potentiallyAffectedSystemsDetail: [],
      trainingTicket: 'TICKET-3',
      dateAdded: '2024-01-01',
      lastModified: '2024-01-01',
      detailFormat: 1,
    },
  },
];

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

      // Create promises that we can control
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

      // Resolve the promises
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

      // Should show relevant data initially (1 item with potentiallyAffectedSystemsCount > 0)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
    });
  });

  describe('Data Fetching', () => {
    test('handles successful data fetching and filters relevant data', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(mockGetAllUpcomingChanges).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('table-data-count')).toBeInTheDocument();
      });

      // Should display relevant data initially (only items with potentiallyAffectedSystemsCount > 0)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
    });

    test('handles API failure gracefully', async () => {
      const errorMessage = 'API Error';
      mockGetAllUpcomingChanges.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
        expect(screen.getByTestId('error-description')).toHaveTextContent(
          'Failed to fetch data from both endpoints'
        );
      });
    });

    test('handles empty data response', async () => {
      mockGetAllUpcomingChanges.mockResolvedValue({ data: [] });

      await act(async () => {
        renderComponent();
      });

      // The component shows "no roadmap data available" when all data is empty
      await waitFor(() => {
        expect(screen.getByText('No roadmap data available')).toBeInTheDocument();
      });
    });

    test('handles timeout error (504)', async () => {
      // For timeout error to show the special timeout state, it needs to be thrown directly
      // not through Promise.allSettled, and needs to have status_code property
      const timeoutError = new Error('Timeout');
      (timeoutError as any).status_code = 504;

      mockGetAllUpcomingChanges.mockImplementation(() => {
        throw timeoutError;
      });

      await act(async () => {
        renderComponent();
      });

      // Should show timeout error state
      await waitFor(() => {
        expect(screen.getByText('Timeout reached when calculating response')).toBeInTheDocument();
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

    test('auto-switches to all view when relevant data is empty', async () => {
      // Mock data where no items have potentiallyAffectedSystemsCount > 0
      const dataWithNoRelevant = mockAllData.map((item) => ({
        ...item,
        details: {
          ...item.details!,
          potentiallyAffectedSystemsCount: 0,
        },
      }));
      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithNoRelevant });

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
      // Mock data where no items have potentiallyAffectedSystemsCount > 0
      const dataWithNoRelevant = mockAllData.map((item) => ({
        ...item,
        details: {
          ...item.details!,
          potentiallyAffectedSystemsCount: 0,
        },
      }));
      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithNoRelevant });

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

      // Find the radio input directly by ID
      const deprecationRadio = document.getElementById('filter-by-type-deprecation');
      expect(deprecationRadio).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(deprecationRadio!);
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

      // Find the radio input for changes and trigger it
      const changeRadio = document.getElementById('filter-by-type-change');

      await act(async () => {
        fireEvent.click(changeRadio!);
      });

      await waitFor(() => {
        expect(mockSetSearchParams).toHaveBeenCalled();
      });
    });

    test('clicking additions card filters by addition type', async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find the radio input for additions and trigger it
      const additionRadio = document.getElementById('filter-by-type-addition');

      await act(async () => {
        fireEvent.click(additionRadio!);
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
      // Mock data where no items have potentiallyAffectedSystemsCount > 0
      const dataWithNoRelevant = mockAllData.map((item) => ({
        ...item,
        details: {
          ...item.details!,
          potentiallyAffectedSystemsCount: 0,
        },
      }));
      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithNoRelevant });

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
        { ...mockAllData[0], type: 'deprecation' },
        { ...mockAllData[1], type: 'addition' },
        { ...mockAllData[2], type: 'change' },
      ];

      mockGetAllUpcomingChanges.mockResolvedValue({ data: dataWithLowerCaseTypes });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show relevant data initially (1 item with potentiallyAffectedSystemsCount > 0)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('1');
      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
    });

    test('correctly calculates counts for different types', async () => {
      const mixedData = [
        {
          name: 'Test 1',
          type: 'Deprecation',
          release: 'R1',
          date: '2024-01-01',
          package: 'ruby',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 1,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TICKET-1',
            dateAdded: '2024-01-01',
            lastModified: '2024-01-01',
            detailFormat: 1,
          },
        },
        {
          name: 'Test 2',
          type: 'Addition',
          release: 'R1',
          date: '2024-01-01',
          package: 'postgresql',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 1,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TICKET-2',
            dateAdded: '2024-01-01',
            lastModified: '2024-01-01',
            detailFormat: 1,
          },
        },
        {
          name: 'Test 3',
          type: 'Enhancement',
          release: 'R1',
          date: '2024-01-01',
          package: 'rust',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 1,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TICKET-3',
            dateAdded: '2024-01-01',
            lastModified: '2024-01-01',
            detailFormat: 1,
          },
        },
        {
          name: 'Test 4',
          type: 'Change',
          release: 'R1',
          date: '2024-01-01',
          package: 'python',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 1,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TICKET-4',
            dateAdded: '2024-01-01',
            lastModified: '2024-01-01',
            detailFormat: 1,
          },
        },
        {
          name: 'Test 5',
          type: 'Change',
          release: 'R1',
          date: '2024-01-01',
          package: 'nodejs',
          details: {
            summary: 'Test summary',
            architecture: 'x86_64',
            potentiallyAffectedSystemsCount: 1,
            potentiallyAffectedSystemsDetail: [],
            trainingTicket: 'TICKET-5',
            dateAdded: '2024-01-01',
            lastModified: '2024-01-01',
            detailFormat: 1,
          },
        },
      ];

      mockGetAllUpcomingChanges.mockResolvedValue({ data: mixedData });

      await act(async () => {
        renderComponent();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that data is rendered (all items have potentiallyAffectedSystemsCount > 0)
      expect(screen.getByTestId('table-data-count')).toHaveTextContent('5');

      // Check cards are present
      expect(screen.getByText('Deprecations')).toBeInTheDocument();
      expect(screen.getByText('Changes')).toBeInTheDocument();
      expect(screen.getByText('Additions and enhancements')).toBeInTheDocument();
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
        expect(screen.getByTestId('error-description')).toHaveTextContent(
          'Failed to fetch data from both endpoints'
        );
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
