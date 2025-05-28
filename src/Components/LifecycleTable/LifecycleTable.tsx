import React, { lazy } from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import { SystemsDetail } from '../../types/SystemsDetail';
import {
  Button,
  Pagination,
  PaginationVariant,
  Popover,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { formatDate } from '../../utils/utils';
const LifecycleModalWindow = lazy(() => import('../../Components/LifecycleModalWindow/LifecycleModalWindow'));

interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
  viewFilter?: string;
  chartSortByValue?: string;
  setTableSortByValue: (tableSortByValue: string) => void;
}

const SYSTEM_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  start_date: 'Release date',
  end_date: 'Retirement date',
  count: 'Systems',
  status: 'Status',
};

const APP_LIFECYCLE_COLUMN_NAMES = {
  name: 'Name',
  release: 'Initial release',
  start_date: 'Release date',
  end_date: 'Retirement date',
  count: 'Systems',
  status: 'Status',
};

const DEFAULT_ARIA_LABEL = 'Lifecycle information';

// Component to render status icon based on support_status field
const StatusIcon: React.FunctionComponent<{ supportStatus: string }> = ({ supportStatus }) => {
  switch (supportStatus) {
    case 'Supported':
      return <CheckCircleIcon color="var(--pf-v5-global--success-color--100)" />;
    case 'Near retirement':
      return <ExclamationTriangleIcon color="var(--pf-v5-global--warning-color--100)" />;
    case 'Retired':
      return <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />;
    default:
      return null;
  }
};

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({
  data,
  viewFilter,
  chartSortByValue,
  setTableSortByValue,
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
  const [modalData, setModalData] = React.useState<SystemsDetail[]>();

  //check data type and contruct a chart array
  const checkDataType = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('display_name' in lifecycleData[0] && 'os_major' in lifecycleData[0]) {
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
      // Pass default index and direction for consistent initial sorting
      sortedData = sortAppLifecycleData(0, 'asc');
    } else {
      sortedData = sortSystemLifecycleData(0, 'asc');
    }
    setSortedRows(sortedData);
    setPaginatedRows(sortedData.slice(0, 10));
  }, [data]);

  React.useEffect(() => {
    // Synchronize sorting from chart dropdown to table
    if (chartSortByValue) {
      // Order match with headers in Lifecycle table, names match with sorting dropdown which is above chart.
      // This contains also specification for sorting - if the SortBy is sorted in ascending or descending way.
      const chartSortByDefaultValuesStreams = {
        Name: SortByDirection.asc,
        'Release version': SortByDirection.asc,
        'Release date': SortByDirection.asc,
        'Retirement date': SortByDirection.asc,
        Systems: SortByDirection.desc,
      };
      const chartSortByDefaultValuesSystems = {
        Name: SortByDirection.asc,
        'Release date': SortByDirection.asc,
        'Retirement date': SortByDirection.asc,
        Systems: SortByDirection.desc,
      };

      if (type === 'streams') {
        // Get the index of item in chartSortByMapArray - the index is the same one as the index used for sorting in table
        const indexChartSortBy = Object.keys(chartSortByDefaultValuesStreams).indexOf(chartSortByValue);

        if (indexChartSortBy === -1) {
          // Not found
          console.debug('Cannot find matching name. Failed to synchronize sorting between chart and table.');
          return;
        }
        sortAppStreamsWithPagination(
          indexChartSortBy,
          Object.values(chartSortByDefaultValuesStreams)[indexChartSortBy]
        );
      } else {
        // Get the index of item in chartSortByMapArray - the index is the same one as the index used for sorting in table
        const indexChartSortBy = Object.keys(chartSortByDefaultValuesSystems).indexOf(chartSortByValue);

        if (indexChartSortBy === -1) {
          // Not found
          console.debug('Cannot find matching name. Failed to synchronize sorting between chart and table.');
          return;
        }
        sortSystemsWithPagination(
          indexChartSortBy,
          Object.values(chartSortByDefaultValuesSystems)[indexChartSortBy]
        );
      }
    }
  }, [chartSortByValue]);

  React.useEffect(() => {
    // Set the table sort to be able to synchronize chart sorting with table
    // Mapping index into name of the selected key for sorting
    const tableIndexToChartMappingStreams = [
      'Name',
      'Release version',
      'Release date',
      'Retirement date',
      'Systems',
    ];
    const tableIndexToChartMappingSystems = [
      'Name',
      'Release version',
      'Release date',
      'Retirement date',
      'Systems',
    ];

    if (type === 'streams' && activeAppSortIndex !== undefined) {
      setTableSortByValue(tableIndexToChartMappingStreams[activeAppSortIndex]);
    } else if (type === 'rhel' && activeSystemSortIndex !== undefined) {
      setTableSortByValue(tableIndexToChartMappingSystems[activeSystemSortIndex]);
    }
  }, [activeAppSortIndex, activeSystemSortIndex]);

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
    const { name, start_date, end_date, count, support_status } = repo;
    return [name, start_date, end_date, count, support_status || ''];
  };

  const getAppSortableRowValues = (repo: Stream): (string | number)[] => {
    const { display_name, os_major, os_minor, start_date, end_date, count, support_status } = repo;

    // Create a sortable version number by combining major and minor
    // Multiply major by 1000 and add minor to create a numeric value for sorting
    // Handle null/undefined os_minor by defaulting to 0
    const sortableVersion = os_major * 1000 + (os_minor ?? 0);

    return [
      display_name,
      sortableVersion, // This will sort properly: 9000, 9001, 9002, etc.
      start_date ?? 'Not available',
      end_date ?? 'Not available',
      count,
      support_status || '',
    ];
  };

  const getSystemSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSystemSortIndex,
      direction: activeSystemSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      sortSystemsWithPagination(index, direction);
    },
    columnIndex,
  });

  const sortSystemsWithPagination = (index: number, direction: SortByDirection) => {
    const sortedData = sortSystemLifecycleData(index, direction);
    setSortedRows(sortedData);
    const startIndex = (page - 1) * perPage;
    const endIndex = (page - 1) * perPage + perPage;
    setPaginatedRows(sortedData.slice(startIndex, endIndex));
    setActiveSystemSortIndex(index);
    setActiveSystemSortDirection(direction);
  };

  const getAppSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeAppSortIndex,
      direction: activeAppSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      sortAppStreamsWithPagination(index, direction);
    },
    columnIndex,
  });

  const sortAppStreamsWithPagination = (index: number, direction: SortByDirection) => {
    const sortedData = sortAppLifecycleData(index, direction);
    setSortedRows(sortedData);
    const startIndex = (page - 1) * perPage;
    const endIndex = (page - 1) * perPage + perPage;
    setPaginatedRows(sortedData.slice(startIndex, endIndex));
    setActiveAppSortIndex(index);
    setActiveAppSortDirection(direction);
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
        return (aValue as string).localeCompare(bValue as string, undefined, { numeric: true });
      }
      return (bValue as string).localeCompare(aValue as string, undefined, { numeric: true });
    }
  };

  const sortAppLifecycleData = (index?: number, direction?: string) => {
    // Create a copy of the data
    let sortedRepositories = [...(data as Stream[])];
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
    return (paginatedRows as Stream[]).map((repo: Stream, index: number) => {
      if (!repo.display_name || !repo.os_major) {
        return;
      }

      // Create a clean, unique key
      const cleanKey = `${repo.display_name}-${repo.os_major}-${repo.os_minor ?? 0}-${repo.start_date}-${
        repo.end_date
      }-${repo.count}-${index}`;

      return (
        <Tr key={cleanKey}>
          <Td style={{ paddingRight: '140px', maxWidth: '200px' }} dataLabel={APP_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.display_name}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release}>
            {repo.os_major}.{repo.os_minor ?? 0}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.start_date}>{formatDate(repo.start_date)}</Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.end_date}>{formatDate(repo.end_date)}</Td>
          {viewFilter !== 'all' && (
            <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.count ?? 'N/A'}>
              {repo.count !== 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <StatusIcon supportStatus={repo.support_status || ''} />
                  <Button
                    variant="link"
                    style={{
                      margin: 0,
                      padding: 0,
                      paddingLeft:
                        repo.support_status === 'Supported' ||
                        repo.support_status === 'Near retirement' ||
                        repo.support_status === 'Retired'
                          ? '0'
                          : '18px',
                    }}
                    onClick={(event) => {
                      handleModalToggle(event);
                      setModalDataName(String(repo.display_name));
                      setModalData(repo.systems_detail);
                    }}
                  >
                    {repo.count}
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '18px' }}>
                  {repo.count}
                </div>
              )}
            </Td>
          )}
        </Tr>
      );
    });
  };

  const sortSystemLifecycleData = (index?: number, direction?: string) => {
    // Create a copy of the data
    let sortedRepositories = [...(data as SystemLifecycleChanges[])];
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
    return (paginatedRows as SystemLifecycleChanges[]).map((repo: SystemLifecycleChanges, index: number) => {
      if (!repo.display_name || !repo.start_date || !repo.end_date) {
        return;
      }
      const cleanKey = `${repo.name}-${repo.start_date}-${repo.end_date}-${repo.count}-${
        repo.support_status ?? ''
      }-${index}`;

      return (
        <Tr key={cleanKey}>
          <Td style={{ paddingRight: '140px', maxWidth: '200px' }} dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.name}
          </Td>
          <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.start_date}>{formatDate(repo.start_date)}</Td>
          <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.end_date}>{formatDate(repo.end_date)}</Td>
          {viewFilter !== 'all' && (
            <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.count}>
              {repo.count !== 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <StatusIcon supportStatus={repo.support_status || ''} />
                  <Button
                    variant="link"
                    style={{
                      margin: 0,
                      padding: 0,
                      paddingLeft:
                        repo.support_status === 'Supported' ||
                        repo.support_status === 'Near retirement' ||
                        repo.support_status === 'Retired'
                          ? '0'
                          : '18px',
                    }}
                    onClick={(event) => {
                      handleModalToggle(event);
                      setModalDataName(String(repo.name));
                      setModalData(repo.systems_detail);
                    }}
                  >
                    {repo.count}
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '18px' }}>
                  {repo.count}
                </div>
              )}
            </Td>
          )}
        </Tr>
      );
    });
  };

  const renderHeaders = (viewFilter?: string) => {
    const popoverContent = (
      <div>
        This is the version of RHEL the application stream was initially released for, which is the minimum RHEL
        version required for installation.
      </div>
    );

    // Reusable header content for the "Initial release" column
    const initialReleaseHeader = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{APP_LIFECYCLE_COLUMN_NAMES.release}</span>
        <Popover headerContent="Initial release" bodyContent={popoverContent} position="right">
          <Button
            variant="plain"
            aria-label="More info for initial release"
            style={{
              padding: 0,
              minHeight: 'auto',
              height: '16px',
              width: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <OutlinedQuestionCircleIcon style={{ fontSize: '14px' }} />
          </Button>
        </Popover>
      </div>
    );

    switch (type) {
      case 'streams':
        if (viewFilter === 'all') {
          return (
            <Tr key={APP_LIFECYCLE_COLUMN_NAMES.name}>
              <Th sort={getAppSortParams(0)}>{APP_LIFECYCLE_COLUMN_NAMES.name}</Th>
              <Th modifier="wrap" sort={getAppSortParams(1)}>
                {initialReleaseHeader}
              </Th>
              <Th modifier="wrap" sort={getAppSortParams(2)}>
                {APP_LIFECYCLE_COLUMN_NAMES.start_date}
              </Th>
              <Th modifier="wrap" sort={getAppSortParams(3)}>
                {APP_LIFECYCLE_COLUMN_NAMES.end_date}
              </Th>
            </Tr>
          );
        }
        return (
          <Tr key={APP_LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getAppSortParams(0)}>{APP_LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getAppSortParams(1)}>
              {initialReleaseHeader}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(2)}>
              {APP_LIFECYCLE_COLUMN_NAMES.start_date}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(3)}>
              {APP_LIFECYCLE_COLUMN_NAMES.end_date}
            </Th>
            <Th modifier="wrap" sort={getAppSortParams(4)}>
              {APP_LIFECYCLE_COLUMN_NAMES.count}
            </Th>
          </Tr>
        );
      case 'rhel':
        if (viewFilter === 'all') {
          return (
            <Tr key={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
              <Th sort={getSystemSortParams(0)}>{SYSTEM_LIFECYCLE_COLUMN_NAMES.name}</Th>
              <Th modifier="wrap" sort={getSystemSortParams(1)}>
                {SYSTEM_LIFECYCLE_COLUMN_NAMES.start_date}
              </Th>
              <Th modifier="wrap" sort={getSystemSortParams(2)}>
                {SYSTEM_LIFECYCLE_COLUMN_NAMES.end_date}
              </Th>
            </Tr>
          );
        }
        return (
          <Tr key={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}>
            <Th sort={getSystemSortParams(0)}>{SYSTEM_LIFECYCLE_COLUMN_NAMES.name}</Th>
            <Th modifier="wrap" sort={getSystemSortParams(1)}>
              {SYSTEM_LIFECYCLE_COLUMN_NAMES.start_date}
            </Th>
            <Th modifier="wrap" sort={getSystemSortParams(2)}>
              {SYSTEM_LIFECYCLE_COLUMN_NAMES.end_date}
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
