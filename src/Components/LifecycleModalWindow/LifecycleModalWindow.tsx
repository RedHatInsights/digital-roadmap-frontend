import React from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemsDetail } from '../../types/SystemsDetail';
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Pagination,
  PaginationVariant,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';

/**
The modal window requires following parameters to be set in the parent component:
- name - of the package/system to be shown in the title
- modalData - list of the affected systems for the package/system
- isModalOpen - value managing if modal is open in UI, React.UseState()
- handleModalToggle - function for handling close/open modal window, _event: React.MouseEvent | React.KeyboardEvent
*/
interface ModalWindowProps {
  name: string | undefined;
  modalData: SystemsDetail[] | undefined;
  isModalOpen: boolean;
  // any because <Modal onClose> stops working with anything else (including unknown)
  handleModalToggle: (_event: any) => void;
}

export const LifecycleModalWindow: React.FunctionComponent<ModalWindowProps> = ({
  name,
  modalData,
  isModalOpen,
  handleModalToggle,
}) => {
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>();
  const [inputValue, setInputValue] = React.useState('');

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  // When the modal window is opened, update it with new data/default values
  React.useEffect(() => {
    setActiveSortIndex(undefined);
    setActiveSortDirection(undefined);
    setInputValue('');
    setPage(1);
  }, [isModalOpen]);

  // Filtering, sorting and pagination are applied to the complete data set, in that
  // order, so that sorting is never limited to the systems of the current page.
  const modalDataFiltered = React.useMemo(() => {
    if (modalData === undefined) {
      return undefined;
    }

    if (!inputValue) {
      return modalData;
    }

    return modalData.filter((item) => item.display_name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [modalData, inputValue]);

  const modalDataSorted = React.useMemo(() => {
    if (modalDataFiltered === undefined || activeSortIndex === undefined) {
      return modalDataFiltered;
    }

    // Copy the data, Array.sort() would otherwise reorder the parent's data in place
    return [...modalDataFiltered].sort((a, b) => {
      const aValue = a.display_name;
      const bValue = b.display_name;
      // string sort
      if (activeSortDirection === 'desc') {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });
  }, [modalDataFiltered, activeSortIndex, activeSortDirection]);

  const paginatedData = React.useMemo(() => {
    if (modalDataSorted === undefined) {
      return undefined;
    }

    const startIdx = (page - 1) * perPage;
    return modalDataSorted.slice(startIdx, startIdx + perPage);
  }, [modalDataSorted, page, perPage]);

  const renderModalWindow = () => {
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
              {/* Add spacing between title and description */}
              <div style={{ marginTop: '8px' }}></div>
              <span>
                <strong>{name}</strong>
                {` is installed on these systems. Click a system name to view system details in Inventory.`}
              </span>
            </>
          }
        />
        {/* Added padding after the description */}
        <div style={{ padding: '0 0 16px 0' }}></div>

        {/* Toolbar with filter and pagination */}
        <div>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>{renderFilterBoxModalWindow()}</ToolbarItem>
              <ToolbarItem align={{ default: 'alignEnd' }}>{renderPagination('top', true)}</ToolbarItem>
            </ToolbarContent>
          </Toolbar>
        </div>

        <ModalBody tabIndex={0} id="modal-box-body-scrollable" aria-label="Scrollable modal content">
          {renderModalWindowTable(paginatedData)}
        </ModalBody>
        <ModalFooter>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            {renderPagination('top', false)}
          </div>
        </ModalFooter>
      </Modal>
    );
  };

  const renderModalWindowTable = (data: SystemsDetail[] | undefined) => {
    if (data === undefined) {
      return '';
    }

    const baseUrl = window.location.origin;

    // Custom styles for the button
    const buttonStyles = {
      padding: '0',
      textAlign: 'left' as const,
      justifyContent: 'flex-start',
      marginLeft: '-22px',
    };

    return (
      <div>
        <Table variant="compact" ouiaSafe={true}>
          <Thead>
            <Tr>
              <Th sort={getSortParamsModalWindow(0)} modifier="fitContent" style={{ paddingLeft: '4px' }}>
                Name
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.map((item, index) => (
              <Tr key={index}>
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
      </div>
    );
  };

  const renderPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => {
    if (!modalDataFiltered || modalDataFiltered.length === 0) {
      return null;
    }

    return (
      <Pagination
        itemCount={modalDataFiltered.length}
        perPage={perPage}
        page={page}
        onSetPage={(_, newPage) => setPage(newPage)}
        onPerPageSelect={(_, newPerPage) => {
          setPerPage(newPerPage);
          setPage(1); // Reset to first page when changing items per page
        }}
        widgetId="pagination-options-menu"
        variant={variant}
        isCompact={isCompact}
      />
    );
  };

  const renderFilterBoxModalWindow = () => {
    return (
      <div style={{ width: '210px', marginLeft: '22px' }}>
        <TextInputGroup>
          <TextInputGroupMain
            icon={<SearchIcon />}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Filter by name"
            aria-label="Filter systems by name"
          />
          {showUtilities && (
            <TextInputGroupUtilities>
              {showClearButton && (
                <Button
                  icon={<TimesIcon />}
                  variant="plain"
                  onClick={clearInput}
                  aria-label="Clear button and input"
                />
              )}
            </TextInputGroupUtilities>
          )}
        </TextInputGroup>
      </div>
    );
  };

  const getSortParamsModalWindow = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      // Sorting reorders every system, so show the new beginning of the list
      setPage(1);
    },
    columnIndex,
  });

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    // Reset to first page when filtering
    setPage(1);
  };

  /** show the input clearing button only when the input is not empty */
  const showClearButton = !!inputValue;

  /** render the utilities component only when a component it contains is being rendered */
  const showUtilities = showClearButton;

  /** callback for clearing the text input */
  const clearInput = () => {
    setInputValue('');
    setPage(1);
  };

  return renderModalWindow();
};

export default LifecycleModalWindow;
