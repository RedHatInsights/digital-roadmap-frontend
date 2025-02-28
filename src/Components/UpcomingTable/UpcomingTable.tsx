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
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { TableRow } from '../../Components/UpcomingRow/UpcomingRow';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import './upcoming-table.scss';
import { UpcomingChanges } from '../../types/UpcomingChanges';
import UpcomingTableFilters from './UpcomingTableFilters';
import { TypeFilter } from '../../types/TypeFilter';

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
  typeOptions: TypeFilter[];
  resetInitialFilters: () => void;
}

export const UpcomingTable: React.FunctionComponent<UpcomingTableProps> = ({
  data,
  columnNames,
  initialFilters,
  typeOptions,
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

  useEffect(() => {
    if (initialFilters.size === 0) {
      setTypeSelections(new Set());
      return;
    }
    setTypeSelections(new Set([...initialFilters]));
  }, [initialFilters]);

  const handleSetPage = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(filteredData.slice(startIdx, endIdx));
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(filteredData.slice(startIdx, endIdx));
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
  };

  const resetTypeFilter = () => {
    resetInitialFilters(); // resets type and parent data
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
    setFilteredData(filteredData);
    setPaginatedRows(filteredData.slice(0, perPage));
  }, [data]);

  useEffect(() => {
    const filteredData = data.filter(onFilter);
    setFilteredData(filteredData);
    const startIndex = (page - 1) * perPage;
    const endIndex = (page - 1) * perPage + perPage;
    setPaginatedRows(filteredData.slice(startIndex, endIndex));
  }, [searchValue, typeSelections, dateSelection, releaseSelections]);

  const releaseUniqueOptions = Array.from(new Set(data.map((repo) => repo.release))).map((release) => ({
    release: release,
  }));

  const dateUniqueOptions = Array.from(new Set(data.map((repo) => repo.date))).map((date) => ({
    date: date,
  }));

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
        typeOptions={typeOptions}
        resetTypeFilter={resetTypeFilter}
      />
      <Table aria-label="Upcoming changes, deprecations, and additions to your system" variant="compact">
        <Thead>
          <Tr>
            {filteredData.length > 0 && (
              <Th>
                <span className="pf-v5-u-screen-reader">Row expansion</span>
              </Th>
            )}
            <Th width={10}>{columnNames.name}</Th>
            <Th width={10}>{columnNames.type}</Th>
            <Th width={10}>{columnNames.release}</Th>
            <Th width={10}>{columnNames.date}</Th>
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
