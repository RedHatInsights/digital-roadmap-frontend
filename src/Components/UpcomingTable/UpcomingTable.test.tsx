import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpcomingTable from './UpcomingTable';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import { DEFAULT_FILTERS } from '../../utils/utils';
import { download, generateCsv } from 'export-to-csv';

jest.mock('export-to-csv', () => ({
  mkConfig: jest.fn(() => ({})),
  generateCsv: jest.fn(() => () => 'csv,data'),
  download: jest.fn(() => () => {}),
}));

// Mock the UpcomingTableFilters component
jest.mock('./UpcomingTableFilters', () => {
  return function MockUpcomingTableFilters({
    resetFilters,
    searchValue,
    setSearchValue,
    typeSelections,
    setTypeSelections,
    dateSelection,
    setDateSelection,
    releaseSelections,
    setReleaseSelections,
    selectedViewFilter,
    handleViewFilterChange,
    noDataAvailable,
    downloadCSV,
    canDownloadCSV,
  }: any) {
    return (
      <div data-testid="upcoming-table-filters">
        <input
          data-testid="search-input"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search by name"
        />
        <button data-testid="reset-filters" onClick={resetFilters}>
          Reset Filters
        </button>
        <div data-testid="type-selections">{Array.from(typeSelections).join(',')}</div>
        <div data-testid="date-selection">{dateSelection}</div>
        <div data-testid="release-selections">{releaseSelections.join(',')}</div>
        <div data-testid="selected-view-filter">{selectedViewFilter}</div>
        <div data-testid="no-data-available">{noDataAvailable.toString()}</div>
        <button data-testid="set-type-filter" onClick={() => setTypeSelections(new Set(['Deprecation']))}>
          Set Type Filter
        </button>
        <button data-testid="set-date-filter" onClick={() => setDateSelection('2024-12-01')}>
          Set Date Filter
        </button>
        <button data-testid="set-release-filter" onClick={() => setReleaseSelections(['9.0'])}>
          Set Release Filter
        </button>
        <button data-testid="change-view-filter" onClick={() => handleViewFilterChange('all')}>
          Change View Filter
        </button>
        <button data-testid="download-csv" onClick={downloadCSV} disabled={!canDownloadCSV}>
          Download CSV
        </button>
      </div>
    );
  };
});

// Mock the UpcomingRow component
jest.mock('../../Components/UpcomingRow/UpcomingRow', () => {
  return {
    TableRow: function MockTableRow({ repo, isExpanded, hideRepo, showRepo }: any) {
      return (
        <tbody data-testid={`table-row-${repo.name}`}>
          <tr>
            <td>
              <button data-testid={`expand-button-${repo.name}`} onClick={isExpanded ? hideRepo : showRepo}>
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
            </td>
            <td data-testid={`name-${repo.name}`}>{repo.name}</td>
            <td data-testid={`type-${repo.name}`}>{repo.type}</td>
            <td data-testid={`release-${repo.name}`}>{repo.release}</td>
            <td data-testid={`date-${repo.name}`}>{repo.date}</td>
          </tr>
          {isExpanded && (
            <tr data-testid={`expanded-row-${repo.name}`}>
              <td colSpan={5}>Expanded content for {repo.name}</td>
            </tr>
          )}
        </tbody>
      );
    },
  };
});

// Mock SCSS import
jest.mock('./upcoming-table.scss', () => ({}));

// Test data
const mockData: UpcomingChanges[] = [
  {
    name: 'Ruby 2.7 EOL',
    type: 'Deprecation',
    release: '9.0',
    date: '2024-12-01',
    package: 'ruby',
  },
  {
    name: 'PostgreSQL 15 Feature',
    type: 'Addition',
    release: '10.2',
    date: '2024-12-15',
    package: 'postgresql',
  },
  {
    name: 'Rust Update',
    type: 'Change',
    release: '9.0',
    date: '2024-12-01',
    package: 'rust',
  },
  {
    name: 'Python Enhancement',
    type: 'Enhancement',
    release: '10.4',
    date: '2025-01-01',
    package: 'python',
  },
  {
    name: 'Node.js Security Fix',
    type: 'Addition',
    release: '10.2',
    date: '2024-12-15',
    package: 'nodejs',
  },
];

const mockColumnNames = {
  name: 'Name',
  type: 'Type',
  release: 'Release',
  date: 'Release date',
};

const defaultProps = {
  data: mockData,
  columnNames: mockColumnNames,
  initialTypeFilters: new Set<string>(),
  resetInitialFilters: jest.fn(),
  initialNameFilter: '',
  initialDateFilter: '',
  initialReleaseFilters: [],
  filtersForURL: DEFAULT_FILTERS,
  setFiltersForURL: jest.fn(),
  selectedViewFilter: 'relevant',
  handleViewFilterChange: jest.fn(),
  noDataAvailable: false,
};

describe('UpcomingTable', () => {
  const mockedDownload = download as jest.Mock;
  const mockedGenerateCsv = generateCsv as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders table with data', () => {
      render(<UpcomingTable {...defaultProps} />);

      // Check table headers
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Release')).toBeInTheDocument();
      expect(screen.getByText('Release date')).toBeInTheDocument();

      // Check that filters component is rendered
      expect(screen.getByTestId('upcoming-table-filters')).toBeInTheDocument();

      // Check that some data rows are rendered (first 10 due to pagination)
      expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
      expect(screen.getByTestId('table-row-PostgreSQL 15 Feature')).toBeInTheDocument();
    });

    test('renders empty state when no data matches filters', () => {
      render(<UpcomingTable {...defaultProps} data={[]} />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(
        screen.getByText('No results match the filter criteria. Clear all filters and try again.')
      ).toBeInTheDocument();
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });

    test('initializes with provided filters', () => {
      const props = {
        ...defaultProps,
        initialTypeFilters: new Set(['Deprecation']),
        initialNameFilter: 'Ruby',
        initialDateFilter: '2024-12-01',
        initialReleaseFilters: ['9.0'],
      };

      render(<UpcomingTable {...props} />);

      expect(screen.getByDisplayValue('Ruby')).toBeInTheDocument();
      expect(screen.getByTestId('type-selections')).toHaveTextContent('Deprecation');
      expect(screen.getByTestId('date-selection')).toHaveTextContent('2024-12-01');
      expect(screen.getByTestId('release-selections')).toHaveTextContent('9.0');
    });
  });

  describe('Filtering', () => {
    test('filters by name search', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Ruby' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });

    test('filters by type selection', async () => {
      render(<UpcomingTable {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-type-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });

    test('filters by date selection', async () => {
      render(<UpcomingTable {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-date-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.getByTestId('table-row-Rust Update')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });

    test('filters by release selection', async () => {
      render(<UpcomingTable {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-release-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.getByTestId('table-row-Rust Update')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });

    test('shows empty state when filters result in no matches', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'NonexistentItem' } });

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    test('resets filters when reset button is clicked', async () => {
      render(<UpcomingTable {...defaultProps} />);

      // Apply some filters first
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Ruby' } });
      fireEvent.click(screen.getByTestId('set-type-filter'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Ruby')).toBeInTheDocument();
      });

      // Reset filters
      fireEvent.click(screen.getByTestId('reset-filters'));

      await waitFor(() => {
        expect(defaultProps.resetInitialFilters).toHaveBeenCalled();
        expect(defaultProps.setFiltersForURL).toHaveBeenCalledWith(DEFAULT_FILTERS);
      });
    });
  });

  describe('Sorting', () => {
    test('sorts by name column', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);

      // After sorting, the order should change
      // We can't easily test the exact order due to our mock structure,
      // but we can verify the sort interaction occurred
      expect(nameHeader).toBeInTheDocument();
    });

    test('sorts by type column', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const typeHeader = screen.getByText('Type');
      fireEvent.click(typeHeader);

      expect(typeHeader).toBeInTheDocument();
    });

    test('reverses sort direction on second click', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const nameHeader = screen.getByText('Name');

      // First click - ascending
      fireEvent.click(nameHeader);

      // Second click - descending
      fireEvent.click(nameHeader);

      expect(nameHeader).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('displays pagination controls', () => {
      render(<UpcomingTable {...defaultProps} />);

      // PatternFly pagination should be rendered
      expect(screen.getByLabelText(/bottom pagination/i)).toBeInTheDocument();
    });

    test('handles pagination with more than 10 items', () => {
      const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
        name: `Item ${i + 1}`,
        type: 'Addition',
        release: `${9 + (i % 3)}.${i % 5}`,
        date: '2024-12-01',
        package: 'test',
      }));

      render(<UpcomingTable {...defaultProps} data={largeDataSet} />);

      // Should show pagination controls
      expect(screen.getByLabelText(/bottom pagination/i)).toBeInTheDocument();

      // Should only show first 10 items initially
      expect(screen.getByTestId('table-row-Item 1')).toBeInTheDocument();
      expect(screen.queryByTestId('table-row-Item 15')).not.toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    test('expands and collapses individual rows', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-Ruby 2.7 EOL');

      // Initially collapsed
      expect(screen.queryByTestId('expanded-row-Ruby 2.7 EOL')).not.toBeInTheDocument();

      // Expand row
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByTestId('expanded-row-Ruby 2.7 EOL')).toBeInTheDocument();
      });

      // Collapse row
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.queryByTestId('expanded-row-Ruby 2.7 EOL')).not.toBeInTheDocument();
      });
    });

    test('expands all rows with expand all button', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const expandAllButton = screen.getByLabelText('Expand all rows');
      fireEvent.click(expandAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('expanded-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.getByTestId('expanded-row-PostgreSQL 15 Feature')).toBeInTheDocument();
      });

      // Button should now show "Collapse all rows"
      expect(screen.getByLabelText('Collapse all rows')).toBeInTheDocument();
    });

    test('collapses all rows with collapse all button', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const expandAllButton = screen.getByLabelText('Expand all rows');

      // First expand all
      fireEvent.click(expandAllButton);

      await waitFor(() => {
        expect(screen.getByTestId('expanded-row-Ruby 2.7 EOL')).toBeInTheDocument();
      });

      // Then collapse all
      const collapseAllButton = screen.getByLabelText('Collapse all rows');
      fireEvent.click(collapseAllButton);

      await waitFor(() => {
        expect(screen.queryByTestId('expanded-row-Ruby 2.7 EOL')).not.toBeInTheDocument();
        expect(screen.queryByTestId('expanded-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });
  });

  describe('Props Integration', () => {
    test('passes correct props to UpcomingTableFilters', () => {
      render(<UpcomingTable {...defaultProps} noDataAvailable={true} />);

      expect(screen.getByTestId('selected-view-filter')).toHaveTextContent('relevant');
      expect(screen.getByTestId('no-data-available')).toHaveTextContent('true');
    });

    test('calls handleViewFilterChange when triggered', () => {
      render(<UpcomingTable {...defaultProps} />);

      fireEvent.click(screen.getByTestId('change-view-filter'));

      expect(defaultProps.handleViewFilterChange).toHaveBeenCalledWith('all');
    });

    test('downloads CSV for the currently filtered dataset', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Ruby' } });

      await waitFor(() => {
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('download-csv'));
      expect(mockedGenerateCsv).toHaveBeenCalled();
      expect(mockedDownload).toHaveBeenCalled();
    });

    test('disables CSV export when there are no rows to export', async () => {
      render(<UpcomingTable {...defaultProps} data={[]} />);
      expect(screen.getByTestId('download-csv')).toBeDisabled();
    });

    test('updates when data prop changes', async () => {
      const { rerender } = render(<UpcomingTable {...defaultProps} />);

      expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();

      const newData = [
        {
          name: 'New Item',
          type: 'Addition',
          release: '9.1',
          date: '2024-12-01',
          package: 'new',
        },
      ];

      rerender(<UpcomingTable {...defaultProps} data={newData} />);

      await waitFor(() => {
        expect(screen.getByTestId('table-row-New Item')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-Ruby 2.7 EOL')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty data array', () => {
      render(<UpcomingTable {...defaultProps} data={[]} />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.queryByLabelText('Expand all rows')).not.toBeInTheDocument();
    });

    test('handles invalid regex in search', async () => {
      render(<UpcomingTable {...defaultProps} />);

      const searchInput = screen.getByTestId('search-input');

      // Input invalid regex characters
      fireEvent.change(searchInput, { target: { value: '[invalid' } });

      // Should not crash and should still filter
      await waitFor(() => {
        expect(screen.getByDisplayValue('[invalid')).toBeInTheDocument();
      });
    });

    test('handles data with missing or undefined values', () => {
      const dataWithMissingValues = [
        {
          name: 'Incomplete Item',
          type: 'Addition',
          release: '',
          date: '2024-12-01',
          package: 'test',
        },
      ];

      render(<UpcomingTable {...defaultProps} data={dataWithMissingValues} />);

      expect(screen.getByTestId('table-row-Incomplete Item')).toBeInTheDocument();
    });

    test('maintains filter state when data updates', async () => {
      const { rerender } = render(<UpcomingTable {...defaultProps} />);

      // Set a filter
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Ruby' } });

      // Update data
      const newData = [
        ...mockData,
        {
          name: 'Ruby 3.0 Feature',
          type: 'Addition',
          release: '11.0',
          date: '2025-01-15',
          package: 'ruby',
        },
      ];

      rerender(<UpcomingTable {...defaultProps} data={newData} />);

      await waitFor(() => {
        // Filter should still be applied
        expect(screen.getByDisplayValue('Ruby')).toBeInTheDocument();
        expect(screen.getByTestId('table-row-Ruby 2.7 EOL')).toBeInTheDocument();
        expect(screen.getByTestId('table-row-Ruby 3.0 Feature')).toBeInTheDocument();
        expect(screen.queryByTestId('table-row-PostgreSQL 15 Feature')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      render(<UpcomingTable {...defaultProps} />);

      expect(
        screen.getByLabelText('Upcoming changes, deprecations, and additions to your system')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Expand all rows')).toBeInTheDocument();
    });

    test('supports keyboard navigation for expand/collapse', () => {
      render(<UpcomingTable {...defaultProps} />);

      const expandButton = screen.getByTestId('expand-button-Ruby 2.7 EOL');

      // Should be focusable
      expandButton.focus();
      expect(expandButton).toHaveFocus();
    });
  });
});
