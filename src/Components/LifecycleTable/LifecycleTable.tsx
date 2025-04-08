import React from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';
import { Stream } from '../../types/Stream';
import {
  Pagination,
  PaginationVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Button, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities
} from '@patternfly/react-core';
import { formatDate } from '../../utils/utils';
import { Modal, ModalBody, ModalHeader, ModalFooter, ModalVariant } from '@patternfly/react-core/next';
import { SYSTEM_ID } from '../../__mocks__/mockData';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';

interface LifecycleTableProps {
  data: Stream[] | SystemLifecycleChanges[];
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

export const LifecycleTable: React.FunctionComponent<LifecycleTableProps> = ({ data }: LifecycleTableProps) => {
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
  const [modalDataOriginal, setModalDataOriginal] = React.useState<string[]>();
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>();
  const [inputValue, setInputValue] = React.useState('');

  //check data type and contruct a chart array
  const checkDataType = (lifecycleData: Stream[] | SystemLifecycleChanges[]) => {
    if (!lifecycleData || lifecycleData.length === 0) {
      return '';
    }
    if ('stream' in lifecycleData[0]) {
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

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
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

  const renderModalWindow = () => {
    return (
        <Modal
          variant={ModalVariant.small}
          isOpen={isModalOpen}
          onClose={handleModalToggle}
          aria-labelledby="scrollable-modal-title"
          aria-describedby="modal-box-body-scrollable"
        >
          <ModalHeader title="Systems" labelId="scrollable-modal-title" description={`${modalDataName} is installed on these sytems. Click on a system name to view system details in Inventory.`}/>
          <ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
            {renderModalWindowTable(modalData)}
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={handleModalToggle}>
              Confirm
            </Button>
            <Button key="cancel" variant="link" onClick={handleModalToggle}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
    )
  }

  const renderModalWindowTable = (data: string[] | undefined) => {
    if (data === undefined) {
      return '';
    }

    return (
      <div>
        {renderFilterBoxModalWindow()}
        <Table variant='compact'>
          <Thead><Tr><Th sort={getSortParamsModalWindow(0, data)}>Name</Th></Tr></Thead>
            <Tbody>{data?.map((item, index) =>
              <Tr key={index}>
                <Td dataLabel='Name'>
                  <Button variant='link'>{item}</Button>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </div>
    );
  }

  const sortModalWindowData = (data: string[] | undefined, direction: String, index:  number) => {
    if (data === undefined){
      return undefined;
    }

    let sortedSystemsModalWindow = data;
    if (index !== undefined) {
      sortedSystemsModalWindow = data.sort((a, b) => {
        const aValue = a;
        const bValue = b;
        debugger;
        // string sort
        if (direction === 'asc') {
          return (aValue as string).localeCompare(bValue as string);
        }
        return (bValue as string).localeCompare(aValue as string);
      });
    }
    return sortedSystemsModalWindow;
  }

  const getSortParamsModalWindow = (columnIndex: number, data: string[]): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc' // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      setModalData(sortModalWindowData(data, direction, index));
    },
    columnIndex
  });

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    filterModalWindowData(value);
  };

  /** show the input clearing button only when the input is not empty */
  const showClearButton = !!inputValue;

  /** render the utilities component only when a component it contains is being rendered */
  const showUtilities = showClearButton;

  /** callback for clearing the text input */
  const clearInput = () => {
    setInputValue('');
  };

  const filterModalWindowData = (value: String) => {
    if (modalDataOriginal === undefined) {
      return
    }

    if (value) {
      setModalData(modalDataOriginal.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      ));
    } else {
      setModalData(modalDataOriginal);
    }
  }

  const renderFilterBoxModalWindow = () => {
    return (
      <TextInputGroup>
        <TextInputGroupMain icon={<SearchIcon />} value={inputValue} onChange={handleInputChange} />
        {showUtilities && (
          <TextInputGroupUtilities>
            {showClearButton && (
              <Button variant="plain" onClick={clearInput} aria-label="Clear button and input">
                <TimesIcon />
              </Button>
            )}
        </TextInputGroupUtilities>
      )}
    </TextInputGroup>
    )
  }

  const renderAppLifecycleData = () => {
    return (paginatedRows as Stream[]).map((repo: Stream) => {
      if (!repo.name || !repo.stream || !repo.os_major) {
        return;
      }
      return (
        <Tr key={`${repo.name}-${repo.stream}-${repo.os_major}-${repo.start_date}-${repo.end_date}-${repo.count}`}>
          <Td style={{ paddingRight: '140px', maxWidth: '200px' }} dataLabel={APP_LIFECYCLE_COLUMN_NAMES.name}>
            {repo.name} {repo.stream}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release}>
            {repo.os_major}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.release_date}>
            {formatDate(repo.start_date)}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.retirement_date}>
            {formatDate(repo.end_date)}
          </Td>
          <Td dataLabel={APP_LIFECYCLE_COLUMN_NAMES.count}>
          <Button variant="link" onClick={(event) =>{ handleModalToggle(event); setModalDataName(String(repo.name)); setModalData(SYSTEM_ID); setModalDataOriginal(SYSTEM_ID);}}>
              {repo.count}
            </Button>
          </Td>
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
    return (paginatedRows as SystemLifecycleChanges[]).map(
      (repo: SystemLifecycleChanges) => {
        if (
          !repo.name ||
          !repo.release_date ||
          !repo.retirement_date ||
          !repo.count
        ) {
          return;
        }

        return (
          <Tr
            key={`${repo.name}-${repo.release_date}-${repo.retirement_date}-${repo.count}`}
          >
            <Td
              style={{ paddingRight: '140px', maxWidth: '200px' }}
              dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.name}
            >
              {repo.name}
            </Td>
            <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.release_date}>
              {formatDate(repo.release_date)}
            </Td>
            <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.retirement_date}>
              {formatDate(repo.retirement_date)}
            </Td>
            <Td dataLabel={SYSTEM_LIFECYCLE_COLUMN_NAMES.count}>
            <Button variant="link" onClick={(event) =>{ handleModalToggle(event); setModalDataName(String(repo.name)); setModalData(SYSTEM_ID); setModalDataOriginal(SYSTEM_ID);}}>
              {repo.count}
            </Button>
            </Td>
          </Tr>
        );
      }
    );
  };

  const renderHeaders = () => {
    switch (type) {
      case 'streams':
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
        <Thead>{renderHeaders()}</Thead>
        <Tbody>{renderData()}</Tbody>
      </Table>
      {renderModalWindow()}
      {buildPagination('bottom', false)}
    </>
  );
};

export default LifecycleTable;
