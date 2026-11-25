import React, { useEffect, useState } from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Pagination,
  PaginationVariant,
  Skeleton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { TableRow } from '../../Components/UpcomingRow/UpcomingRow';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import './upcoming-table.scss';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import UpcomingTableFilters from './UpcomingTableFilters';
import { Filter } from '../../types/Filter';
import { DEFAULT_FILTERS, KNOWN_TYPES } from '../../utils/utils';
import { exportData as exportToFile } from '../../utils/export';
import { itemKey } from '../../utils/relevantUpcomingLoader';

export type UpcomingContentStatus = 'loading' | 'ready' | 'error';

interface UpcomingTableProps {
  data: UpcomingChanges[];
  columnNames: {
    name: string;
    type: string;
    release: string;
    date: string;
    addedToRoadmap: string;
  };
  details?: {
    summary: string;
    potentiallyAffectedSystems: number;
    trainingTicket: string;
    deployedDate: string | null;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
  initialTypeFilters: Set<string>;
  resetInitialFilters: () => void;
  initialNameFilter: string;
  initialDateFilter: string;
  initialReleaseFilters: string[];
  initialAddedToRoadmapFilter: string;
  filtersForURL: Filter;
  setFiltersForURL: (filters: Filter) => void;
  selectedViewFilter: string;
  handleViewFilterChange: (filter: string) => void;
  noDataAvailable?: boolean;
  contentStatus?: UpcomingContentStatus;
  contentError?: string;
  onRetryContent?: () => void;
  contentRetryLabel?: string;
  countsPending?: boolean;
  countsFailed?: boolean;
  isExportDisabled?: boolean;
  exportDisabledTooltipContent?: string;
}

export const UpcomingTable: React.FunctionComponent<UpcomingTableProps> = ({
  data,
  columnNames,
  initialTypeFilters,
  resetInitialFilters,
  initialNameFilter,
  initialDateFilter,
  initialReleaseFilters,
  initialAddedToRoadmapFilter,
  filtersForURL,
  setFiltersForURL,
  selectedViewFilter,
  handleViewFilterChange,
  noDataAvailable = false, // Default to false if not provided
  contentStatus = 'ready',
  contentError,
  onRetryContent,
  contentRetryLabel = 'Retry all',
  countsPending = false,
  countsFailed = false,
  isExportDisabled = false,
  exportDisabledTooltipContent = 'Still loading',
}) => {
  const [searchValue, setSearchValue] = useState(initialNameFilter ?? '');
  const [typeSelections, setTypeSelections] = useState<Set<string>>(initialTypeFilters);
  const [dateSelection, setDateSelection] = useState(initialDateFilter ?? '');
  const [releaseSelections, setReleaseSelections] = useState<string[]>(initialReleaseFilters ?? []);
  const [addedToRoadmapSelection, setAddedToRoadmapSelection] = useState(initialAddedToRoadmapFilter ?? '');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [paginatedRows, setPaginatedRows] = React.useState(data.slice(0, 10));
  const [filteredData, setFilteredData] = React.useState(data);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>();
  const [sortedFilteredData, setSortedFilteredData] = React.useState<UpcomingChanges[]>(data);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  useEffect(() => {
    if (initialTypeFilters.size === 0) {
      setTypeSelections(new Set());
      return;
    }
    setTypeSelections(new Set([...initialTypeFilters]));
  }, [initialTypeFilters]);

  useEffect(() => {
    setSearchValue(initialNameFilter);
  }, [initialNameFilter]);

  useEffect(() => {
    setDateSelection(initialDateFilter);
  }, [initialDateFilter]);

  useEffect(() => {
    setReleaseSelections(initialReleaseFilters);
  }, [initialReleaseFilters]);

  useEffect(() => {
    setAddedToRoadmapSelection(initialAddedToRoadmapFilter);
  }, [initialAddedToRoadmapFilter]);

  const getSortableRowValues = (repo: UpcomingChanges): (string | number)[] => {
    const { name, type, release, date } = repo;
    const addedToRoadmap = repo.details?.deployedDate ?? '';
    return [name, type, release, addedToRoadmap, date];
  };

  const sortFilteredData = (dataToSort: UpcomingChanges[]) => {
    if (typeof activeSortIndex !== 'undefined' && typeof activeSortDirection !== 'undefined') {
      return sortData(activeSortIndex, activeSortDirection, dataToSort);
    }
    return dataToSort;
  };

  const sortData = (index: number, direction: SortByDirection, currentData: UpcomingChanges[]) => {
    return currentData.sort((a, b) => {
      const aValue = getSortableRowValues(a)[index];
      const bValue = getSortableRowValues(b)[index];

      // Special handling for release column (index 2) - semantic version sorting
      if (index === 2 && typeof aValue === 'string' && typeof bValue === 'string') {
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        const comparison = aNum - bNum;
        return direction === 'asc' ? comparison : -comparison;
      }

      // Default sorting for other columns
      if (typeof aValue === 'number') {
        // Numeric sort
        if (direction === 'asc') {
          return (aValue as number) - (bValue as number);
        }
        return (bValue as number) - (aValue as number);
      } else {
        // String sort
        if (direction === 'asc') {
          return (aValue as string).localeCompare(bValue as string);
        }
        return (bValue as string).localeCompare(aValue as string);
      }
    });
  };

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      const sortedData = sortData(index, direction, filteredData);
      const startIndex = (page - 1) * perPage;
      const endIndex = (page - 1) * perPage + perPage;
      setPaginatedRows(sortedData.slice(startIndex, endIndex));
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
    },
    columnIndex,
  });

  const handleSetPage = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(sortedFilteredData.slice(startIdx, endIdx));
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(sortedFilteredData.slice(startIdx, endIdx));
    setPage(newPage);
    setPerPage(newPerPage);
  };

  const buildPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={filteredData.length}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      variant={variant}
      titles={{
        paginationAriaLabel: `${variant} pagination`,
      }}
    />
  );

  // Helper function to check if a date falls within a date range
  const isDateInRange = (dateString: string | undefined, rangeType: string): boolean => {
    if (!dateString) return false;

    // Normalize the target date: Force to local midnight to avoid time drift
    // Once year, month and day is set, time is the default local midnight
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // months are zero-indexed.
    // Define "today" normalized to midnight
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (rangeType) {
      case 'lastMonthToDate': {
        // From the 1st of the previous month to today
        const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return date >= firstOfLastMonth && date <= today;
      }
      case 'last90Days': {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        return date >= ninetyDaysAgo && date <= today;
      }
      case 'lastYear': {
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return date >= oneYearAgo && date <= today;
      }
      case 'moreThan1YearAgo': {
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return date < oneYearAgo;
      }
      default:
        return false;
    }
  };

  const onFilter = (repo: UpcomingChanges) => {
    // Search name with search value
    let searchValueInput: RegExp;
    try {
      searchValueInput = new RegExp(searchValue, 'i');
    } catch (err) {
      searchValueInput = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const matchesNameValue = repo.name.search(searchValueInput) >= 0;

    // Search release with release selections
    const matchesReleaseValue = releaseSelections.includes(repo.release);

    // Search type with type selections
    const matchesTypeValue = typeSelections.has(repo.type);

    // Search date with date selection
    const matchesDateValue = repo.date.toLowerCase() === dateSelection.toLowerCase();

    // Search added to roadmap with date range
    const matchesAddedToRoadmapValue =
      addedToRoadmapSelection === '' ||
      isDateInRange(repo.details?.deployedDate ?? undefined, addedToRoadmapSelection);

    return (
      (searchValue === '' || matchesNameValue) &&
      (releaseSelections.length === 0 || matchesReleaseValue) &&
      (typeSelections.size === 0 || matchesTypeValue) &&
      (dateSelection === '' || matchesDateValue) &&
      matchesAddedToRoadmapValue
    );
  };

  const resetFilters = () => {
    resetInitialFilters(); // resets type and parent data
    setSearchValue('');
    setReleaseSelections([]);
    setDateSelection('');
    setAddedToRoadmapSelection('');
    setPage(1);
    setFiltersForURL(DEFAULT_FILTERS);
  };

  const resetTypeFilter = () => {
    resetInitialFilters(); // resets type and parent data
    setPage(1);
  };

  const emptyState = (
    <EmptyState headingLevel="h4" icon={SearchIcon} titleText="No results found">
      <EmptyStateBody>No results match the filter criteria. Clear all filters and try again.</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="link" onClick={resetFilters}>
            Clear all filters
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );

  useEffect(() => {
    const filteredData = data.filter(onFilter);
    const sortedData = sortFilteredData(filteredData);
    setFilteredData(filteredData);
    setSortedFilteredData(sortedData);
    const maxPage = Math.max(1, Math.ceil(sortedData.length / perPage));
    const nextPage = Math.min(page, maxPage);
    if (nextPage !== page) {
      setPage(nextPage);
    }
    const startIndex = (nextPage - 1) * perPage;
    setPaginatedRows(sortedData.slice(startIndex, startIndex + perPage));
  }, [data, page, perPage]);

  useEffect(() => {
    const filteredData = data.filter(onFilter);
    setFilteredData(filteredData);
    const sortedData = sortFilteredData(filteredData);
    setPage(1);
    setSortedFilteredData(sortedData);
    setPaginatedRows(sortedData.slice(0, perPage));
  }, [searchValue, typeSelections, dateSelection, releaseSelections, addedToRoadmapSelection]);

  const releaseUniqueOptions = Array.from(new Set(data.map((repo) => repo.release))).map((release) => ({
    release: release,
  }));

  const dateUniqueOptions = Array.from(new Set(data.map((repo) => repo.date))).map((date) => ({
    date: date,
  }));

  const typeUniqueOptions = Array.from(new Set([...KNOWN_TYPES, ...data.map((repo) => repo.type)])).map(
    (type) => ({ type })
  );

  const onClickArrow = () => {
    const visibleKeys = paginatedRows.map(itemKey);
    setExpandedRows((currentExpandedRows) => {
      const allVisibleRowsExpanded =
        visibleKeys.length > 0 && visibleKeys.every((key) => currentExpandedRows.has(key));
      if (allVisibleRowsExpanded) {
        return new Set();
      }
      return new Set([...currentExpandedRows, ...visibleKeys]);
    });
  };

  const removeRepo = (repo: UpcomingChanges) => {
    setExpandedRows((currentExpandedRows) => {
      const nextExpandedRows = new Set(currentExpandedRows);
      nextExpandedRows.delete(itemKey(repo));
      return nextExpandedRows;
    });
  };

  const addRepo = (repo: UpcomingChanges) => {
    setExpandedRows((currentExpandedRows) => new Set([...currentExpandedRows, itemKey(repo)]));
  };

  const allVisibleRowsExpanded =
    paginatedRows.length > 0 && paginatedRows.every((repo) => expandedRows.has(itemKey(repo)));

  const buildExportData = () =>
    sortedFilteredData.map((item) => ({
      Name: item.name,
      Type: item.type,
      Release: item.release,
      'Release date': item.date,
      Summary: item.details?.summary ?? '',
      'Affected systems': item.details?.potentiallyAffectedSystemsCount ?? '',
      'Tracking ticket': item.details?.trainingTicket ?? '',
    }));

  const handleExport = (format: 'csv' | 'json' | 'xml') => {
    const data = buildExportData();
    exportToFile(format, data);
  };

  return (
    <React.Fragment>
      <UpcomingTableFilters
        itemCount={filteredData.length}
        resetFilters={resetFilters}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleSetPage={handleSetPage}
        handlePerPageSelect={handlePerPageSelect}
        page={page}
        perPage={perPage}
        typeSelections={typeSelections}
        setTypeSelections={setTypeSelections}
        dateSelection={dateSelection}
        setDateSelection={setDateSelection}
        releaseSelections={releaseSelections}
        setReleaseSelections={setReleaseSelections}
        addedToRoadmapSelection={addedToRoadmapSelection}
        setAddedToRoadmapSelection={setAddedToRoadmapSelection}
        releaseOptions={releaseUniqueOptions}
        dateOptions={dateUniqueOptions}
        typeOptions={typeUniqueOptions}
        resetTypeFilter={resetTypeFilter}
        filtersForURL={filtersForURL}
        setFiltersForURL={setFiltersForURL}
        selectedViewFilter={selectedViewFilter}
        handleViewFilterChange={handleViewFilterChange}
        noDataAvailable={noDataAvailable}
        onExport={handleExport}
        canExport={sortedFilteredData.length > 0}
        isExportDisabled={isExportDisabled}
        exportDisabledTooltipContent={exportDisabledTooltipContent}
      />
      {contentStatus === 'loading' ? (
        <div role="status" aria-label="Loading roadmap data" className="drf-upcoming__table-skeleton">
          <Stack hasGutter>
            <StackItem>
              <Skeleton width="70%" />
            </StackItem>
            <StackItem>
              <Skeleton width="90%" />
            </StackItem>
            <StackItem>
              <Skeleton width="80%" />
            </StackItem>
          </Stack>
        </div>
      ) : contentStatus === 'error' ? (
        <EmptyState headingLevel="h2" titleText="Failed to load data" variant="sm">
          <EmptyStateBody>{contentError ?? 'The data could not be loaded.'}</EmptyStateBody>
          {onRetryContent && (
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="link" onClick={onRetryContent}>
                  {contentRetryLabel}
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          )}
        </EmptyState>
      ) : (
        <>
          <Table
            aria-label="Upcoming changes, deprecations, and additions to your system"
            variant="compact"
            isExpandable
          >
            <Thead>
              {filteredData.length > 0 && (
                <Tr>
                  <Th>
                    <span className="pf-v6-c-table__toggle ">
                      <Button
                        icon={
                          <div className="pf-v6-c-table__toggle-icon">
                            <AngleDownIcon />
                          </div>
                        }
                        aria-expanded={allVisibleRowsExpanded}
                        aria-label={allVisibleRowsExpanded ? 'Collapse all rows' : 'Expand all rows'}
                        variant="plain"
                        onClick={onClickArrow}
                        className={allVisibleRowsExpanded ? 'pf-m-expanded' : ''}
                      />
                    </span>
                  </Th>

                  <Th width={10} sort={getSortParams(0)}>
                    {columnNames.name}
                  </Th>
                  <Th width={10} sort={getSortParams(1)}>
                    {columnNames.type}
                  </Th>
                  <Th width={10} sort={getSortParams(2)}>
                    {columnNames.release}
                  </Th>
                  <Th width={10} sort={getSortParams(3)}>
                    {columnNames.addedToRoadmap}
                  </Th>
                  <Th width={10} sort={getSortParams(4)}>
                    {columnNames.date}
                  </Th>
                </Tr>
              )}
            </Thead>
            {filteredData.length === 0 ? (
              <Tbody>
                <Tr>
                  <Td colSpan={5}>
                    <Bullseye>{emptyState}</Bullseye>
                  </Td>
                </Tr>
              </Tbody>
            ) : (
              paginatedRows.map((repo, rowIndex) => {
                return (
                  <TableRow
                    key={itemKey(repo)}
                    repo={repo}
                    columnNames={columnNames}
                    rowIndex={rowIndex}
                    isExpanded={expandedRows.has(itemKey(repo))}
                    countsPending={countsPending}
                    countsFailed={countsFailed}
                    hideRepo={() => removeRepo(repo)}
                    showRepo={() => addRepo(repo)}
                  />
                );
              })
            )}
          </Table>
          {buildPagination('bottom', false)}
        </>
      )}
    </React.Fragment>
  );
};

export default UpcomingTable;
