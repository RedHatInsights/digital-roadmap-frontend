import React, { lazy } from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import {
  Button,
  Pagination,
  PaginationVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { formatDate } from '../../utils/utils';
const LifecycleModalWindow = lazy(() => import('../../Components/LifecycleModalWindow/LifecycleModalWindow'));
import { SYSTEM_ID } from '../../__mocks__/mockData';

interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
  viewFilter?: string;
}

const SYSTEM_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  count: 'Systems',
};

const APP_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Release',
  release_date: 'Release date',
  retirement_date: 'Retirement date',
  count: 'Systems',
};

const DEFAULT_ARIA_LABEL = 'Lifecycle information';

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({ 
  data, 
  viewFilter 
}: LifecycleTableProps) => {
  // Index of the currently sorted column
  // Note: if you intend to make columns reorderable, you may instead want to use a non-numeric key
  // as the identifier of the sorted column. See the "Compound expandable" example.
  const [activeSystemSortIndex, setActiveSystemSortIndex] = React.useState<number | undefined>();
  const [activeAppSortIndex, setActiveAppSortIndex] = React.useState<number | undefined>();
  // Sort direction of the currently sorted column
  const [activeSystemSortDirection, setActiveSystemSortDirection] = React.useState<SortByDirection>();
  const [activeAppSortDirection, setActiveAppSortDirection] = React.useState<SortByDirection>();
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [sortedRows, setSortedRows] = React.useState(data);
  const [paginatedRows, setPaginatedRows] = React.useState(data.slice(0, 10));

  // Modal related
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalDataName, setModalDataName] = React.useState<string>();
  const [modalData, setModalData] = React.useState<string[]>();

  //check data type and contruct a chart array
  const checkDataType = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('application_stream_name' in lifecycleData[0]) {
      return 'streams';
    }
    return 'rhel';
  };

  const type = checkDataType(data);

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
  }, [data]);

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

  // _event is needed as it's provided by onClick handler
  const handleModalToggle = (_event: React.MouseEvent | React.KeyboardEvent) => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
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
        <ToolbarItem variant="pagination">{buildPagination('top', true)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  // Since OnSort specifies sorted columns by index, we need sortable values for our object by column index.
  // This example is trivial since our data objects just contain strings, but if the data was more complex
  // this would be a place to return simplified string or number versions of each column to sort by.
  const getSystemSortableRowValues = (repo: SystemLifecycleChanges): (string | number)[] => {
    const { name, release_date, retirement_date, count } = repo;
    return [name, release_date, retirement_date, count];
  };

  const getAppSortableRowValues = (repo: Stream): (string | number)[] => {
    const { name, os_major, start_date, end_date, count } = repo;
    return [name, os_major, start_date ?? 'Not available', end_date ?? 'Not available', count];
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
      if (!repo.name || !repo.application_stream_name || !repo.os_major) {
        return;
      }
      return (
        <Tr
          key={`
            ${repo.name}-${repo.application_stream_name}-
            ${repo.os_major}-${repo.start_date}-${repo.end_date}-${repo.count}
          `}
        >
          <Td style={{ paddingRight: '140px', maxWidth: '200px' }} dataLabel={APP_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.display_name}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release}>{repo.os_major}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release_date}>{formatDate(repo.start_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.retirement_date}>{formatDate(repo.end_date)}</Td>
          {viewFilter !== "all" && (
            <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.count ?? 'N/A'}>
              <Button
                variant="link"
                onClick={(event) => {
                  handleModalToggle(event);
                  setModalDataName(String(repo.name));
                  setModalData(repo.systems);
                }}
              >
                {repo.count}
              </Button>
            </Td>
          )}
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
      if (!repo.name || !repo.release_date || !repo.retirement_date) {
        return;
      }
      return (
        <Tr key={`${repo.name}-${repo.release_date}-${repo.retirement_date}-${repo.count}`}>
          <Td style={{ paddingRight: '140px', maxWidth: '200px' }} dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.name}
          </Td>
          <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.release_date}>{formatDate(repo.release_date)}</Td>
          <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.retirement_date}>{formatDate(repo.retirement_date)}</Td>
          {viewFilter !== "all" && (
            <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.count}>
              {repo.count !== 0 ? (
                <Button
                  variant="link"
                  onClick={(event) => {
                    handleModalToggle(event);
                    setModalDataName(String(repo.name));
                    setModalData(SYSTEM_ID);
                  }}
                >
                  {repo.count}
                </Button>
              ) : (
                <>{repo.count}</>
              )}
            </Td>
          )}
        </Tr>
      );
    });
  };
  
  const renderHeaders = (viewFilter?: string) => {
    switch (type) {
      case 'streams':
        if (viewFilter === "all") {
          return (
            <Tr key={APP_LIFECYCLE_COLUMN_NAMES.name}>
              <Th sort={getAppSortParams(0)}>{APP_LIFECYCLE_COLUMN_NAMES.name}</Th>
              <Th modifier="wrap" sort={getAppSortParams(1)}>
                {APP_LIFECYCLE_COLUMN_NAMES.release}
              </Th>
              <Th modifier="wrap" sort={getAppSortParams(2)}>
                {APP_LIFECYCLE_COLUMN_NAMES.release_date}
              </Th>
              <Th modifier="wrap" sort={getAppSortParams(3)}>
                {APP_LIFECYCLE_COLUMN_NAMES.retirement_date}
              </Th>
            </Tr>
          );
        }
        return (
          <Tr key={APP_LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getAppSortParams(0)}>{APP_LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getAppSortParams(1)}>
              {APP_LIFECYCLE_COLUMN_NAMES.release}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(2)}>
              {APP_LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(3)}>
              {APP_LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(4)}>
              {APP_LIFECYCLE_COLUMN_NAMES.count}
            </Th>
          </Tr>
        );
      case 'rhel':
        if (viewFilter === "all") {
          return (
            <Tr key={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
              <Th sort={getSystemSortParams(0)}>{SYSTEM_LIFECYCLE_COLUMN_NAMES.name}</Th>
              <Th modifier="wrap" sort={getSystemSortParams(1)}>
                {SYSTEM_LIFECYCLE_COLUMN_NAMES.release_date}
              </Th>
              <Th modifier="wrap" sort={getSystemSortParams(2)}>
                {SYSTEM_LIFECYCLE_COLUMN_NAMES.retirement_date}
              </Th>
            </Tr>
          );
        }
        return (
          <Tr key={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getSystemSortParams(0)}>{SYSTEM_LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getSystemSortParams(1)}>
              {SYSTEM_LIFECYCLE_COLUMN_NAMES.release_date}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(2)}>
              {SYSTEM_LIFECYCLE_COLUMN_NAMES.retirement_date}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(3)}>
              {SYSTEM_LIFECYCLE_COLUMN_NAMES.count}
            </Th>
          </Tr>
        );
      default:
        return;
    }
  };

  const renderData = () => {
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
        return 'RHEL 9 Application Streams Lifecycle information';
      case 'rhel':
        return 'Red Hat Enterprise Linux Lifecycle information';
      default:
        return DEFAULT_ARIA_LABEL;
    }
  };

  return (
    <>
      {toolbar}
      <Table aria-label={getAriaLabel()} variant="compact">
        <Thead>{renderHeaders(viewFilter)}</Thead>
        <Tbody>{renderData()}</Tbody>
      </Table>
      <LifecycleModalWindow
        name={modalDataName}
        modalData={modalData}
        setModalData={setModalData}
        isModalOpen={isModalOpen}
        handleModalToggle={handleModalToggle}
      ></LifecycleModalWindow>
      {buildPagination('bottom', false)}
    </>
  );
};

export default LifecycleTable;