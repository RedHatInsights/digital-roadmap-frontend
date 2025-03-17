import React, { useEffect, useState } from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  Pagination,
  PaginationVariant,
} from '@patternfly/react-core';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { TableRow } from '../../Components/UpcomingRow/UpcomingRow';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import AngleDownIcon from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import './upcoming-table.scss';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import UpcomingTableFilters from './UpcomingTableFilters';

interface UpcomingTableProps {
  data: UpcomingChanges[];
  columnNames: {
    name: string;
    type: string;
    release: string;
    date: string;
  };
  details?: {
    summary: string;
    potentiallyAffectedSystems: number;
    trainingTicket: string;
    dateAdded: string;
    lastModified: string;
    detailFormat: 0 | 1 | 2 | 3;
  };
  initialFilters: Set<string>;
  resetInitialFilters: () => void;
}

export const UpcomingTable: React.FunctionComponent<UpcomingTableProps> = ({
  data,
  columnNames,
  initialFilters,
  resetInitialFilters,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [typeSelections, setTypeSelections] = useState<Set<string>>(initialFilters);
  const [dateSelection, setDateSelection] = useState('');
  const [releaseSelections, setReleaseSelections] = useState<string[]>([]);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [paginatedRows, setPaginatedRows] = React.useState(data.slice(0, 10));
  const [filteredData, setFilteredData] = React.useState(data);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>();
  const [sortedFilteredData, setSortedFilteredData] = React.useState<UpcomingChanges[]>(data);
  const [expandedRows, setExpandedRows] = React.useState<Set<UpcomingChanges>>(new Set([]));

  useEffect(() => {
    if (initialFilters.size === 0) {
      setTypeSelections(new Set());
      return;
    }
    setTypeSelections(new Set([...initialFilters]));
  }, [initialFilters]);

  const getSortableRowValues = (repo: UpcomingChanges): (string | number)[] => {
    const { name, type, release, date } = repo;
    return [name, type, release, date];
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

    return (
      (searchValue === '' || matchesNameValue) &&
      (releaseSelections.length === 0 || matchesReleaseValue) &&
      (typeSelections.size === 0 || matchesTypeValue) &&
      (dateSelection === '' || matchesDateValue)
    );
  };

  const resetFilters = () => {
    resetInitialFilters(); // resets type and parent data
    setSearchValue('');
    setReleaseSelections([]);
    setDateSelection('');
    setPage(1);
  };

  const resetTypeFilter = () => {
    resetInitialFilters(); // resets type and parent data
    setPage(1);
  };

  const emptyState = (
    <EmptyState>
      <EmptyStateHeader headingLevel="h4" titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon} />} />
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
    setPaginatedRows(sortedData.slice(0, perPage));
    setPage(1);
  }, [data]);

  useEffect(() => {
    const filteredData = data.filter(onFilter);
    setFilteredData(filteredData);
    const sortedData = sortFilteredData(filteredData);
    setPage(1);
    setSortedFilteredData(sortedData);
    setPaginatedRows(sortedData.slice(0, perPage));
  }, [searchValue, typeSelections, dateSelection, releaseSelections]);

  const releaseUniqueOptions = Array.from(new Set(data.map((repo) => repo.release))).map((release) => ({
    release: release,
  }));

  const dateUniqueOptions = Array.from(new Set(data.map((repo) => repo.date))).map((date) => ({
    date: date,
  }));

  const typeUniqueOptions = Array.from(new Set(data.map((repo) => repo.type))).map((type) => ({
    type: type,
  }));

  const onClickArrow = () => {
    if (expandedRows.size < paginatedRows.length) {
      setExpandedRows(new Set(paginatedRows));
    } else {
      setExpandedRows(new Set([]));
    }
  };

  const removeRepo = (repo: UpcomingChanges) => {
    const newExpandedRows = new Set([...expandedRows]);
    newExpandedRows.delete(repo);
    setExpandedRows(newExpandedRows);
  };

  const addRepo = (repo: UpcomingChanges) => {
    const newExpandedRows = new Set([...expandedRows]);
    newExpandedRows.add(repo);
    setExpandedRows(newExpandedRows);
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
        releaseOptions={releaseUniqueOptions}
        dateOptions={dateUniqueOptions}
        typeOptions={typeUniqueOptions}
        resetTypeFilter={resetTypeFilter}
      />
      <Table aria-label="Upcoming changes, deprecations, and additions to your system" variant="compact">
        <Thead>
          <Tr>
            {filteredData.length > 0 && (
              <Th>
                <span className="pf-v5-c-table__td pf-v5-c-table__toggle">
                  <Button
                    aria-expanded={expandedRows.size === paginatedRows.length}
                    aria-label={expandedRows.size === paginatedRows.length ? 'Collapse all rows' : 'Expand all rows'}
                    variant="plain"
                    onClick={onClickArrow}
                    className={expandedRows.size === paginatedRows.length ? 'pf-m-expanded' : ''}
                  >
                    <div className="pf-v5-c-table__toggle-icon">
                      <AngleDownIcon />
                    </div>
                  </Button>
                </span>
              </Th>
            )}
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
              {columnNames.date}
            </Th>
          </Tr>
        </Thead>
        {filteredData.length === 0 ? (
          <Tbody>
            <Tr>
              <Td colSpan={4}>
                <Bullseye>{emptyState}</Bullseye>
              </Td>
            </Tr>
          </Tbody>
        ) : (
          paginatedRows.map((repo, rowIndex) => {
            return (
              <TableRow
                key={`${repo.name}-${repo.type}-${repo.release}-${repo.date}`}
                repo={repo}
                columnNames={columnNames}
                rowIndex={rowIndex}
                isExpanded={expandedRows.has(repo)}
                hideRepo={() => removeRepo(repo)}
                showRepo={() => addRepo(repo)}
              />
            );
          })
        )}
      </Table>
      {buildPagination('bottom', false)}
    </React.Fragment>
  );
};

export default UpcomingTable;
