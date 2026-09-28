import React from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemInfo } from '../../types/PaginatedSystems';
import { SortOrder } from '../../types/SystemsQueryParams';
import { getAppStreamSystems, getRhelSystems, getUpcomingSystems } from '../../api';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Pagination,
  PaginationVariant,
  Spinner,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';

export type SystemsIdentifier =
  | { type: 'rhel'; major: number; minor: number | null; lifecycleType: string }
  | { type: 'appStream'; name: string; osMajor: number; osMinor?: number | null }
  | { type: 'upcoming'; name: string; release: string };

interface ModalWindowProps {
  displayName: string | undefined;
  identifier: SystemsIdentifier | undefined;
  isModalOpen: boolean;
  handleModalToggle: (_event: any) => void;
}

const OpenLifecycleModalWindow: React.FunctionComponent<ModalWindowProps> = ({
  displayName,
  identifier,
  isModalOpen,
  handleModalToggle,
}) => {
  const [systems, setSystems] = React.useState<SystemInfo[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Keep query changes atomic, including timer updates under ReactDOM.render.
  const [query, setQuery] = React.useState({ page: 1, perPage: 10, search: '', sortOrder: 'asc' as SortOrder });
  const { page, perPage, search: debouncedSearch, sortOrder } = query;
  const [searchValue, setSearchValue] = React.useState('');
  const [retryCount, setRetryCount] = React.useState(0);

  // Debounce search input
  React.useEffect(() => {
    if (searchValue === debouncedSearch) return;
    const timer = setTimeout(() => {
      setQuery((current) => ({ ...current, search: searchValue, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue, debouncedSearch]);

  // Fetch systems when modal opens or pagination/search changes
  React.useEffect(() => {
    if (!isModalOpen || !identifier) return;

    let cancelled = false;

    const fetchSystems = async () => {
      let correctingPage = false;
      setIsLoading(true);
      setError(null);
      try {
        const offset = (page - 1) * perPage;
        const params = {
          offset,
          limit: perPage,
          search: debouncedSearch || undefined,
          sort_order: sortOrder,
        };

        let response;
        switch (identifier.type) {
          case 'rhel':
            response = await getRhelSystems(identifier.major, identifier.minor, identifier.lifecycleType, params);
            break;
          case 'appStream':
            response = await getAppStreamSystems(identifier.name, identifier.osMajor, identifier.osMinor, params);
            break;
          case 'upcoming':
            response = await getUpcomingSystems(identifier.name, identifier.release, params);
            break;
        }

        if (!cancelled) {
          const lastPage = Math.max(1, Math.ceil(response.meta.total / perPage));
          if (page > lastPage) {
            // Inventory can shrink between requests. Fetch a valid page before publishing its data.
            correctingPage = true;
            setQuery((current) => ({ ...current, page: lastPage }));
            return;
          }
          setSystems(response.data);
          setTotal(response.meta.total);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load systems');
        }
      } finally {
        if (!cancelled && !correctingPage) {
          setIsLoading(false);
        }
      }
    };

    fetchSystems();

    return () => {
      cancelled = true;
    };
  }, [isModalOpen, identifier, page, perPage, debouncedSearch, sortOrder, retryCount]);

  const handleRetry = () => {
    setRetryCount((count) => count + 1);
  };

  const renderPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => {
    if (total === 0) {
      return null;
    }

    return (
      <Pagination
        itemCount={total}
        perPage={perPage}
        page={page}
        onSetPage={(_, newPage) => setQuery((current) => ({ ...current, page: newPage }))}
        onPerPageSelect={(_, newPerPage) => {
          setQuery((current) => ({ ...current, perPage: newPerPage, page: 1 }));
        }}
        widgetId="modal-pagination-options-menu"
        variant={variant}
        isCompact={isCompact}
      />
    );
  };

  const renderSearchBox = () => {
    const showClearButton = !!searchValue;

    return (
      <div style={{ width: '210px', marginLeft: '22px' }}>
        <TextInputGroup>
          <TextInputGroupMain
            icon={<SearchIcon />}
            value={searchValue}
            onChange={(_event: React.FormEvent<HTMLInputElement>, value: string) => setSearchValue(value)}
            placeholder="Filter by name"
            aria-label="Filter systems by name"
          />
          {showClearButton && (
            <TextInputGroupUtilities>
              <Button
                icon={<TimesIcon />}
                variant="plain"
                onClick={() => setSearchValue('')}
                aria-label="Clear button and input"
              />
            </TextInputGroupUtilities>
          )}
        </TextInputGroup>
      </div>
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <Bullseye>
          <Spinner aria-label="Loading systems" />
        </Bullseye>
      );
    }

    if (error) {
      return (
        <Bullseye>
          <EmptyState
            headingLevel="h4"
            icon={ExclamationCircleIcon}
            titleText="Unable to load systems"
            variant={EmptyStateVariant.sm}
          >
            <EmptyStateBody>{error}</EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="link" onClick={handleRetry}>
                  Retry
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </Bullseye>
      );
    }

    if (total === 0) {
      return (
        <Bullseye>
          <EmptyState
            headingLevel="h4"
            titleText={debouncedSearch ? 'No matching systems' : 'No systems found'}
            variant={EmptyStateVariant.sm}
          >
            <EmptyStateBody>
              {debouncedSearch
                ? `No systems match "${debouncedSearch}".`
                : 'There are no systems associated with this item.'}
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      );
    }

    const baseUrl = window.location.origin;
    const buttonStyles = {
      padding: '0',
      textAlign: 'left' as const,
      justifyContent: 'flex-start',
      marginLeft: '-22px',
    };

    const getSortParams = (): ThProps['sort'] => ({
      sortBy: {
        index: 0,
        direction: sortOrder === 'asc' ? SortByDirection.asc : SortByDirection.desc,
        defaultDirection: SortByDirection.asc,
      },
      onSort: (_event, _index, direction) => {
        setQuery((current) => ({
          ...current,
          sortOrder: direction === SortByDirection.asc ? 'asc' : 'desc',
          page: 1,
        }));
      },
      columnIndex: 0,
    });

    return (
      <Table variant="compact" ouiaSafe={true}>
        <Thead>
          <Tr>
            <Th sort={getSortParams()} modifier="fitContent" style={{ paddingLeft: '4px' }}>
              Name
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {systems.map((item, index) => (
            <Tr key={`${item.id}-${index}`}>
              <Td dataLabel="Name">
                <Button
                  variant="link"
                  onClick={() => window.open(`${baseUrl}/insights/inventory/${item.id}`)}
                  style={buttonStyles}
                >
                  {item.display_name}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      aria-labelledby="scrollable-modal-title"
      aria-describedby="modal-box-body-scrollable"
      style={{ padding: '0' }}
    >
      <ModalHeader
        title="Systems"
        labelId="scrollable-modal-title"
        description={
          <>
            <div style={{ marginTop: '8px' }}></div>
            <span>
              <strong>{displayName}</strong>
              {` is installed on these systems. Click a system name to view system details in Inventory.`}
            </span>
          </>
        }
      />
      <div style={{ padding: '0 0 16px 0' }}></div>

      {/* Toolbar with search and pagination */}
      <div>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>{renderSearchBox()}</ToolbarItem>
            <ToolbarItem align={{ default: 'alignEnd' }}>{renderPagination('top', true)}</ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </div>

      <ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
        {renderBody()}
      </ModalBody>
      <ModalFooter>
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {renderPagination('top', false)}
        </div>
      </ModalFooter>
    </Modal>
  );
};

// A new open session starts with fresh query state, before its first request.
export const LifecycleModalWindow: React.FunctionComponent<ModalWindowProps> = (props) =>
  props.isModalOpen ? <OpenLifecycleModalWindow key={JSON.stringify(props.identifier)} {...props} /> : null;

export default LifecycleModalWindow;
