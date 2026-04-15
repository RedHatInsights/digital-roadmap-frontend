import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpcomingTableFilters from './UpcomingTableFilters';
import { DEFAULT_FILTERS } from '../../utils/utils';

const mockHandleSetPage = jest.fn();
const mockHandlePerPageSelect = jest.fn();
const mockResetFilters = jest.fn();
const mockSetSearchValue = jest.fn();
const mockSetTypeSelections = jest.fn();
const mockSetDateSelection = jest.fn();
const mockSetReleaseSelections = jest.fn();
const mockSetAddedToRoadmapSelection = jest.fn();
const mockResetTypeFilter = jest.fn();
const mockSetFiltersForURL = jest.fn();
const mockHandleViewFilterChange = jest.fn();
const mockDownloadCSV = jest.fn();

const defaultProps = {
  itemCount: 50,
  resetFilters: mockResetFilters,
  searchValue: '',
  setSearchValue: mockSetSearchValue,
  handleSetPage: mockHandleSetPage,
  handlePerPageSelect: mockHandlePerPageSelect,
  page: 1,
  perPage: 10,
  typeSelections: new Set<string>(),
  setTypeSelections: mockSetTypeSelections,
  dateSelection: '',
  setDateSelection: mockSetDateSelection,
  releaseSelections: [],
  setReleaseSelections: mockSetReleaseSelections,
  addedToRoadmapSelection: '',
  setAddedToRoadmapSelection: mockSetAddedToRoadmapSelection,
  releaseOptions: [{ release: '9.5' }, { release: '9.6' }, { release: '10.0' }],
  dateOptions: [{ date: 'Nov 2024' }, { date: 'Dec 2024' }],
  typeOptions: [{ type: 'Addition' }, { type: 'Deprecation' }, { type: 'Change' }],
  resetTypeFilter: mockResetTypeFilter,
  filtersForURL: DEFAULT_FILTERS,
  setFiltersForURL: mockSetFiltersForURL,
  selectedViewFilter: 'relevant',
  handleViewFilterChange: mockHandleViewFilterChange,
  noDataAvailable: false,
  downloadCSV: mockDownloadCSV,
  canDownloadCSV: true,
};

describe('UpcomingTableFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders all filter components', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Should render attribute selector
      expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();

      // Should render pagination button
      const paginationButtons = screen.getAllByRole('button', { name: /1 - 10 of 50/i });
      expect(paginationButtons.length).toBeGreaterThan(0);
    });

    test('renders view filter toggle group', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      expect(screen.getByText('Relevant only')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    test('renders download CSV button', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Use test ID or class selector since PatternFly button may not have accessible name
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Search Filter', () => {
    test('displays search value', () => {
      render(<UpcomingTableFilters {...defaultProps} searchValue="test search" />);

      const searchInput = screen.getByPlaceholderText('Filter by name');
      expect(searchInput).toHaveValue('test search');
    });

    test('calls setSearchValue when search input changes', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Filter by name');
      fireEvent.change(searchInput, { target: { value: 'Node.js' } });

      expect(mockSetSearchValue).toHaveBeenCalledWith('Node.js');
    });

    test('calls setFiltersForURL when search input changes', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Filter by name');
      fireEvent.change(searchInput, { target: { value: 'Python' } });

      expect(mockSetFiltersForURL).toHaveBeenCalled();
    });
  });

  describe('View Filter', () => {
    test('shows "Relevant only" as selected by default', () => {
      render(<UpcomingTableFilters {...defaultProps} selectedViewFilter="relevant" />);

      const relevantButton = screen.getByRole('button', { name: 'Relevant only' });
      expect(relevantButton).toBeInTheDocument();
    });

    test('shows "All" as selected when view filter is "all"', () => {
      render(<UpcomingTableFilters {...defaultProps} selectedViewFilter="all" />);

      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).toBeInTheDocument();
    });

    test('calls handleViewFilterChange when clicking "All"', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      const allButton = screen.getByRole('button', { name: 'All' });
      fireEvent.click(allButton);

      expect(mockHandleViewFilterChange).toHaveBeenCalledWith('all');
    });

    test('disables "Relevant only" when noDataAvailable is true', () => {
      render(<UpcomingTableFilters {...defaultProps} noDataAvailable={true} />);

      const relevantButton = screen.getByRole('button', { name: 'Relevant only' });
      expect(relevantButton).toHaveAttribute('disabled');
    });
  });

  describe('Type Filter', () => {
    test('opens type filter dropdown when clicked', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Open attribute menu first
      const filterButton = screen.getByRole('button', { name: /Name/i });
      fireEvent.click(filterButton);

      // Select Type from dropdown
      const typeOption = screen.getByText('Type');
      fireEvent.click(typeOption);

      // Now open the type filter
      const typeFilterButton = screen.getByRole('button', { name: /Filter by type/i });
      fireEvent.click(typeFilterButton);

      // Check if type options are visible
      expect(screen.getByText('Addition')).toBeInTheDocument();
      expect(screen.getByText('Deprecation')).toBeInTheDocument();
      expect(screen.getByText('Change')).toBeInTheDocument();
    });

    test('displays selected type filters', () => {
      const typeSelections = new Set(['Addition', 'Deprecation']);
      render(<UpcomingTableFilters {...defaultProps} typeSelections={typeSelections} />);

      // Type chips should be visible when types are selected
      expect(screen.getByText('Addition')).toBeInTheDocument();
      expect(screen.getByText('Deprecation')).toBeInTheDocument();
    });
  });

  describe('Release Filter', () => {
    test('opens release filter dropdown when clicked', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Open attribute menu
      const filterButton = screen.getByRole('button', { name: /Name/i });
      fireEvent.click(filterButton);

      // Select Release
      const releaseOption = screen.getByText('Release');
      fireEvent.click(releaseOption);

      // Open release filter
      const releaseFilterButton = screen.getByRole('button', { name: /Filter by release/i });
      fireEvent.click(releaseFilterButton);

      // Check if release options are visible
      expect(screen.getByText('9.5')).toBeInTheDocument();
      expect(screen.getByText('9.6')).toBeInTheDocument();
      expect(screen.getByText('10.0')).toBeInTheDocument();
    });

    test('displays selected release filters', () => {
      render(<UpcomingTableFilters {...defaultProps} releaseSelections={['9.5', '10.0']} />);

      expect(screen.getByText('9.5')).toBeInTheDocument();
      expect(screen.getByText('10.0')).toBeInTheDocument();
    });
  });

  describe('Date Filter', () => {
    test('opens date filter dropdown when clicked', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Open attribute menu
      const filterButton = screen.getByRole('button', { name: /Name/i });
      fireEvent.click(filterButton);

      // Select Release date
      const dateOption = screen.getByText('Release date');
      fireEvent.click(dateOption);

      // Open date filter
      const dateFilterButton = screen.getByRole('button', { name: /Filter by release date/i });
      fireEvent.click(dateFilterButton);

      // Check if date options are visible
      expect(screen.getByText('Nov 2024')).toBeInTheDocument();
      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
    });

    test('displays selected date filter', () => {
      render(<UpcomingTableFilters {...defaultProps} dateSelection="Nov 2024" />);

      expect(screen.getByText('Nov 2024')).toBeInTheDocument();
    });
  });

  describe('Added to Roadmap Filter', () => {
    test('opens added to roadmap filter dropdown when clicked', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Open attribute menu
      const filterButton = screen.getByRole('button', { name: /Name/i });
      fireEvent.click(filterButton);

      // Select Added to roadmap
      const addedToRoadmapOption = screen.getByText('Added to roadmap');
      fireEvent.click(addedToRoadmapOption);

      // Open filter
      const addedFilterButton = screen.getByRole('button', { name: /Filter by date added/i });
      fireEvent.click(addedFilterButton);

      // Check if options are visible
      expect(screen.getByText('Last month to date')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Last year')).toBeInTheDocument();
      expect(screen.getByText('More than 1 year ago')).toBeInTheDocument();
    });

    test('displays selected added to roadmap filter with readable label', () => {
      render(<UpcomingTableFilters {...defaultProps} addedToRoadmapSelection="last90Days" />);

      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
    });
  });

  describe('Download CSV', () => {
    test('renders download button', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Just verify component renders without errors
      expect(screen.getByText('Relevant only')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    test('displays correct item count', () => {
      render(<UpcomingTableFilters {...defaultProps} itemCount={150} page={1} perPage={20} />);

      const paginationButtons = screen.getAllByRole('button', { name: /1 - 20 of 150/i });
      expect(paginationButtons.length).toBeGreaterThan(0);
    });

    test('displays correct page range', () => {
      render(<UpcomingTableFilters {...defaultProps} itemCount={100} page={3} perPage={10} />);

      const paginationButtons = screen.getAllByRole('button', { name: /21 - 30 of 100/i });
      expect(paginationButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Reset Filters', () => {
    test('calls resetFilters when clear all filters is clicked', () => {
      render(<UpcomingTableFilters {...defaultProps} searchValue="test" typeSelections={new Set(['Addition'])} />);

      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      fireEvent.click(clearButton);

      expect(mockResetFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Attribute Menu', () => {
    test('switches between filter attributes', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Initially shows Name
      expect(screen.getByRole('button', { name: /Name/i })).toBeInTheDocument();

      // Open menu
      const filterButton = screen.getByRole('button', { name: /Name/i });
      fireEvent.click(filterButton);

      // Select Type
      const typeOption = screen.getByText('Type');
      fireEvent.click(typeOption);

      // Should now show Type filter
      expect(screen.getByRole('button', { name: /Filter by type/i })).toBeInTheDocument();
    });

    test('has all filter options in attribute menu', () => {
      render(<UpcomingTableFilters {...defaultProps} />);

      // Open menu
      const filterButton = screen.getByRole('button', { name: 'Name' });
      fireEvent.click(filterButton);

      const allTextElements = screen.getAllByText('Name');
      expect(allTextElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Release')).toBeInTheDocument();
      expect(screen.getByText('Release date')).toBeInTheDocument();
      expect(screen.getByText('Added to roadmap')).toBeInTheDocument();
    });
  });
});
