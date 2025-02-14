import React from 'react';
import { Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import Moment from 'moment';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { Pagination, PaginationVariant, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
  type: 'streams' | 'rhel';
}

const LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  systems: 'Systems',
};

const APP_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  systems: 'Systems',
};

const DEFAULT_ARIA_LABEL = 'Table displaying lifecycle information';

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({ data, type }: LifecycleTableProps) => {
  // Index of the currently sorted column
  // Note: if you intend to make columns reorderable, you may instead want to use a non-numeric key
  // as the identifier of the sorted column. See the "Compound expandable" example.
  const [activeSystemSortIndex, setActiveSystemSortIndex] = React.useState<number | undefined>(undefined);
  const [activeAppSortIndex, setActiveAppSortIndex] = React.useState<number | undefined>(undefined);

  // Sort direction of the currently sorted column
  const [activeSystemSortDirection, setActiveSystemSortDirection] = React.useState<'asc' | 'desc' | undefined>(
    undefined
  );
  const [activeAppSortDirection, setActiveAppSortDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [sortedRows, setSortedRows] = React.useState(data);
  const [paginatedRows, setPaginatedRows] = React.useState(data.slice(0, 10));

  React.useEffect(() => {
    setActiveAppSortDirection(undefined);
    setActiveSystemSortDirection(undefined);
    setActiveAppSortIndex(undefined);
    setActiveSystemSortIndex(undefined);
    setPage(1);
    setPerPage(10);
    let sortedData;
    if (type === 'streams') {
      sortedData = sortAppLifecycleData();
    } else {
      sortedData = sortSystemLifecycleData();
    }
    setSortedRows(sortedData);
    setPaginatedRows(sortedData.slice(0, 10));
  }, [data, type]);

  const handleSetPage = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(sortedRows.slice(startIdx, endIdx));
    setPage(newPage);
  };

  const handlePerPageSelect = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPaginatedRows(sortedRows.slice(startIdx, endIdx));
    setPage(newPage);
    setPerPage(newPerPage);
  };

  const buildPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={data.length}
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

  const toolbar = (
    <Toolbar>
      <ToolbarContent>
        <ToolbarItem variant="pagination">{buildPagination('top', false)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  // Since OnSort specifies sorted columns by index, we need sortable values for our object by column index.
  // This example is trivial since our data objects just contain strings, but if the data was more complex
  // this would be a place to return simplified string or number versions of each column to sort by.
  const getSystemSortableRowValues = (repo: SystemLifecycleChanges): (string | number)[] => {
    const { name, release, release_date, retirement_date, systems } = repo;
    return [name, release, release_date, retirement_date, systems];
  };

  const getAppSortableRowValues = (repo: Stream): (string | number)[] => {
    const { name, rhel_major_version, start_date, end_date, systems } = repo;
    return [name, rhel_major_version, start_date, end_date, systems];
  };

  const getSystemSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSystemSortIndex,
      direction: activeSystemSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      const sortedData = sortSystemLifecycleData(index, direction);
      setSortedRows(sortedData);
      const startIndex = (page - 1) * perPage;
      const endIndex = (page - 1) * perPage + perPage;
      setPaginatedRows(sortedData.slice(startIndex, endIndex));
      setActiveSystemSortIndex(index);
      setActiveSystemSortDirection(direction);
    },
    columnIndex,
  });

  const getAppSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeAppSortIndex,
      direction: activeAppSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      const sortedData = sortAppLifecycleData(index, direction);
      setSortedRows(sortedData);
      const startIndex = (page - 1) * perPage;
      const endIndex = (page - 1) * perPage + perPage;
      setPaginatedRows(sortedData.slice(startIndex, endIndex));
      setActiveAppSortIndex(index);
      setActiveAppSortDirection(direction);
    },
    columnIndex,
  });

  const formatDate = (date: string) => {
    if (date === 'Unknown') {
      return 'Not available';
    }
    return Moment(date).format('MMM YYYY');
  };

  const sort = (aValue: number | string, bValue: number | string, direction?: string) => {
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
  };

  const sortAppLifecycleData = (index?: number, direction?: string) => {
    let sortedRepositories = data as Stream[];

    if (typeof index !== 'undefined') {
      sortedRepositories = sortedRepositories.sort((a: Stream, b: Stream) => {
        const aValue = getAppSortableRowValues(a)[index];
        const bValue = getAppSortableRowValues(b)[index];
        return sort(aValue, bValue, direction);
      });
    }

    return sortedRepositories;
  };

  const renderAppLifecycleData = () => {
    return (paginatedRows as Stream[]).map((repo: Stream) => {
      if (!repo.name || !repo.stream || !repo.rhel_major_version) {
        return;
      }
      return (
        <Tr
          key={`${repo.name}-${repo.stream}-${repo.rhel_major_version}-${repo.start_date}-${repo.end_date}-${repo.systems}`}
        >
          <Td style={{ paddingRight: '140px' }} dataLabel={APP_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.name}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release}>{repo.rhel_major_version}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release_date}>{formatDate(repo.start_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.retirement_date}>{formatDate(repo.end_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.systems}>N/A</Td>
        </Tr>
      );
    });
  };

  const sortSystemLifecycleData = (index?: number, direction?: string) => {
    let sortedRepositories = data as SystemLifecycleChanges[];
    if (typeof index !== 'undefined') {
      sortedRepositories = sortedRepositories.sort((a: SystemLifecycleChanges, b: SystemLifecycleChanges) => {
        const aValue = getSystemSortableRowValues(a)[index];
        const bValue = getSystemSortableRowValues(b)[index];
        return sort(aValue, bValue, direction);
      });
    }
    return sortedRepositories;
  };

  const renderSystemLifecycleData = () => {
    return (paginatedRows as SystemLifecycleChanges[]).map((repo: SystemLifecycleChanges) => {
      if (!repo.name || !repo.release || !repo.systems) {
        return;
      }
      return (
        <Tr key={`${repo.name}-${repo.release}-${repo.release_date}-${repo.retirement_date}-${repo.systems}`}>
          <Td style={{ paddingRight: '140px' }} dataLabel={LIFECYCLE_COLUMN_NAMES.name}>
            {repo.name}
          </Td>
          <Td dataLabel={LIFECYCLE_COLUMN_NAMES.release}>{repo.release}</Td>
          <Td dataLabel={LIFECYCLE_COLUMN_NAMES.release_date}>{Moment(repo.release_date).format('MMM YYYY')}</Td>
          <Td dataLabel={LIFECYCLE_COLUMN_NAMES.retirement_date}>{Moment(repo.retirement_date).format('MMM YYYY')}</Td>
          <Td dataLabel={LIFECYCLE_COLUMN_NAMES.systems}>{repo.systems}</Td>
        </Tr>
      );
    });
  };

  const renderHeaders = () => {
    switch (type) {
      case 'streams':
        return (
          <Tr key={LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getAppSortParams(0)}>{LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getAppSortParams(1)}>
              {LIFECYCLE_COLUMN_NAMES.release}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(2)}>
              {LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(3)}>
              {LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th>{LIFECYCLE_COLUMN_NAMES.systems}</Th>
          </Tr>
        );
      case 'rhel':
        return (
          <Tr key={LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getSystemSortParams(0)}>{LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getSystemSortParams(1)}>
              {LIFECYCLE_COLUMN_NAMES.release}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(2)}>
              {LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(3)}>
              {LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(4)}>
              {LIFECYCLE_COLUMN_NAMES.systems}
            </Th>
          </Tr>
        );
      default:
        return;
    }
  };

  const renderData = (): React.ReactNode => {
    switch (type) {
      case 'streams':
        return renderAppLifecycleData();
      case 'rhel':
        return renderSystemLifecycleData();
      default:
        return;
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'streams':
        return 'Table displaying RHEL 9 Application Streams Lifecycle information';
      case 'rhel':
        return 'Table displaying Red Hat Enterprise Linux Lifecycle information';
      default:
        return DEFAULT_ARIA_LABEL;
    }
  };

  return (
    <>
      {toolbar}
      <Table aria-label={getAriaLabel()}>
        <Thead>{renderHeaders()}</Thead>
        <Tbody>{renderData()}</Tbody>
      </Table>
      {buildPagination('bottom', true)}
    </>
  );
};

export default LifecycleTable;
