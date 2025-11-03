import React, { lazy, useEffect } from 'react';
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
import {
  filterChartDataByName,
  filterChartDataByRelease,
  filterChartDataByReleaseDate,
  filterChartDataByRetirementDate,
  filterChartDataBySystems,
} from '../Lifecycle/filteringUtils';

interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
  viewFilter?: string;
  chartSortByValue?: string;
  orderingValue?: string;
  updateChartSortValue: (tableSortByValue: string, order?: string) => void;
  lifecycleDropdownValue: string;
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
      return <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" />;
    case 'Near retirement':
      return <ExclamationTriangleIcon color="var(--pf-t--global--color--status--warning--default)" />;
    case 'Retired':
      return <ExclamationCircleIcon color="var(--pf-t--global--color--status--danger--default)" />;
    default:
      return null;
  }
};

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({
  data,
  viewFilter,
  chartSortByValue,
  orderingValue,
  updateChartSortValue,
  lifecycleDropdownValue,
}: LifecycleTableProps) => {
  // Index of the currently sorted column
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

  // Check data type and construct a chart array
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

  // Mapping between chart sort values and table column indices
  const chartSortToTableIndexMapping = {
    streams: {
      Name: 0,
      'Release version': 1,
      'Release date': 2,
      'Retirement date': 3,
      Systems: 4,
    },
    rhel: {
      Name: 0,
      'Release date': 1,
      'Retirement date': 2,
      Systems: 3,
    },
  };

  const tableIndexToChartMapping = {
    streams: ['Name', 'Release version', 'Release date', 'Retirement date', 'Systems'],
    rhel: ['Name', 'Release date', 'Retirement date', 'Systems'],
  };

  // Function to apply sorting using the filtering functions
  const applySorting = (
    dataToSort: Stream[] | SystemLifecycleChanges[],
    columnIndex: number,
    direction: string
  ): Stream[] | SystemLifecycleChanges[] => {
    const mappingKey = type as keyof typeof tableIndexToChartMapping;
    const chartSortValue = tableIndexToChartMapping[mappingKey][columnIndex];

    switch (chartSortValue) {
      case 'Name':
        return filterChartDataByName(dataToSort, lifecycleDropdownValue, direction);
      case 'Release version':
        return filterChartDataByRelease(dataToSort, lifecycleDropdownValue, direction);
      case 'Release date':
        return filterChartDataByReleaseDate(dataToSort, lifecycleDropdownValue, direction);
      case 'Retirement date':
        return filterChartDataByRetirementDate(dataToSort, lifecycleDropdownValue, direction);
      case 'Systems':
        return filterChartDataBySystems(dataToSort, lifecycleDropdownValue, direction);
      default:
        // Use the retirement date sorting as the default fallback
        return filterChartDataByRetirementDate(dataToSort, lifecycleDropdownValue, direction);
    }
  };

  // Function to update sorting and pagination
  const updateSortingAndPagination = (columnIndex: number, direction: SortByDirection) => {
    const sortedData = applySorting(data, columnIndex, direction);
    setSortedRows(sortedData);

    // Reset to first page when sorting changes
    setPage(1);
    setPaginatedRows(sortedData.slice(0, perPage));

    // Update active sort states
    if (type === 'streams') {
      setActiveAppSortIndex(columnIndex);
      setActiveAppSortDirection(direction);
      // Clear system sort states
      setActiveSystemSortIndex(undefined);
      setActiveSystemSortDirection(undefined);
    } else {
      setActiveSystemSortIndex(columnIndex);
      setActiveSystemSortDirection(direction);
      // Clear app sort states
      setActiveAppSortIndex(undefined);
      setActiveAppSortDirection(undefined);
    }
  };

  // Effect to handle data changes - reset sorting and pagination
  React.useEffect(() => {
    setActiveAppSortDirection(undefined);
    setActiveSystemSortDirection(undefined);
    setActiveAppSortIndex(undefined);
    setActiveSystemSortIndex(undefined);
    setPage(1);
    setPerPage(10);

    // Set initial data without sorting
    setSortedRows(data);
    setPaginatedRows(data.slice(0, 10));
  }, [data]);

  // Effect to synchronize chart sorting with table
  React.useEffect(() => {
    if (chartSortByValue && orderingValue) {
      const mappingKey = type as keyof typeof chartSortToTableIndexMapping;
      const mapping = chartSortToTableIndexMapping[mappingKey];

      // Check if mapping exists and the chartSortByValue is a valid key
      if (mapping && chartSortByValue in mapping) {
        const columnIndex = mapping[chartSortByValue as keyof typeof mapping];

        if (columnIndex !== undefined) {
          const direction = orderingValue as SortByDirection;
          updateSortingAndPagination(columnIndex, direction);
        }
      }
    }
  }, [chartSortByValue, orderingValue, lifecycleDropdownValue, type]);

  // Effect to handle pagination when sortedRows changes
  React.useEffect(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    setPaginatedRows(sortedRows.slice(startIndex, endIndex));
  }, [sortedRows, page, perPage]);

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
      itemCount={sortedRows.length}
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

  const getSystemSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSystemSortIndex,
      direction: activeSystemSortDirection,
      defaultDirection:
        columnIndex === 0
          ? 'asc' // Name
          : columnIndex === 1
          ? 'desc' // Release date
          : columnIndex === 2
          ? 'asc' // Retirement date
          : 'desc', // Systems
    },
    onSort: (_event, index, direction) => {
      handleSortUpdate(index, direction as SortByDirection);
    },
    columnIndex,
  });

  const getAppSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeAppSortIndex,
      direction: activeAppSortDirection,
      defaultDirection:
        columnIndex === 0
          ? 'asc' // Name
          : columnIndex === 1
          ? 'desc' // Release version
          : columnIndex === 2
          ? 'desc' // Release date
          : columnIndex === 3
          ? 'asc' // Retirement date
          : 'desc', // Systems
    },
    onSort: (_event, index, direction) => {
      handleSortUpdate(index, direction as SortByDirection);
    },
    columnIndex,
  });

  // Unified sort handler
  const handleSortUpdate = (index: number, direction: SortByDirection) => {
    const mappingKey = type as keyof typeof tableIndexToChartMapping;
    const chartSortValue = tableIndexToChartMapping[mappingKey][index];

    // Update chart sort value
    updateChartSortValue(chartSortValue, direction);

    // Update local sorting and pagination
    updateSortingAndPagination(index, direction);
  };

  const renderAppLifecycleData = () => {
    return (paginatedRows as Stream[]).map((repo: Stream, index: number) => {
      if (!repo.display_name || !repo.os_major) {
        return null;
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '32px' }}>
                  {repo.count}
                </div>
              )}
            </Td>
          )}
        </Tr>
      );
    });
  };

  const renderSystemLifecycleData = () => {
    return (paginatedRows as SystemLifecycleChanges[]).map((repo: SystemLifecycleChanges, index: number) => {
      if (!repo.display_name || !repo.start_date || !repo.end_date) {
        return null;
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
          <Button icon={<OutlinedQuestionCircleIcon style={{ fontSize: '14px' }} />}
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
           />
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
        return null;
    }
  };

  const renderData = () => {
    switch (type) {
      case 'streams':
        return renderAppLifecycleData();
      case 'rhel':
        return renderSystemLifecycleData();
      default:
        return null;
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
      />
      {buildPagination('bottom', false)}
    </>
  );
};

export default LifecycleTable;
