import React from 'react';
import { SortByDirection, Table, Tbody, Td, Th, ThProps, Thead, Tr } from '@patternfly/react-table';
import { SystemsDetail } from '../../types/SystemsDetail';
import {
	Button,
	Pagination,
	PaginationVariant,
	TextInputGroup,
	TextInputGroupMain,
	TextInputGroupUtilities,
	Toolbar,
	ToolbarContent,
	ToolbarItem,
	Modal /* data-codemods */,
	ModalBody /* data-codemods */,
	ModalFooter /* data-codemods */,
	ModalHeader /* data-codemods */,
	ModalVariant
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
  setModalData: React.Dispatch<React.SetStateAction<SystemsDetail[] | undefined>>;
  isModalOpen: boolean;
  // any because <Modal onClose> stops working with anything else (including unknown)
  handleModalToggle: (_event: any) => void;
}

export const LifecycleModalWindow: React.FunctionComponent<ModalWindowProps> = ({
  name,
  modalData,
  setModalData,
  isModalOpen,
  handleModalToggle,
}) => {
  const [modalDataFiltered, setModalDataFiltered] = React.useState<SystemsDetail[] | undefined>();
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>();
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>();
  const [inputValue, setInputValue] = React.useState('');

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [paginatedData, setPaginatedData] = React.useState<SystemsDetail[] | undefined>();

  // When the modal window is opened, update it with new data/default values
  React.useEffect(() => {
    setModalDataFiltered(modalData);
    setActiveSortIndex(undefined);
    setActiveSortDirection(undefined);
    setInputValue('');
    setPage(1);
  }, [isModalOpen]);

  // Update paginated data when filtered data or pagination settings change
  React.useEffect(() => {
    if (modalDataFiltered) {
      const startIdx = (page - 1) * perPage;
      const endIdx = startIdx + perPage;
      setPaginatedData(modalDataFiltered.slice(startIdx, endIdx));
    } else {
      setPaginatedData(undefined);
    }
  }, [modalDataFiltered, page, perPage]);

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
              <ToolbarItem align={{ default: "alignEnd" }}>{renderPagination('top', true)}</ToolbarItem>
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
              <Th sort={getSortParamsModalWindow(0, data)} modifier="fitContent" style={{ paddingLeft: '4px' }}>
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
                <Button icon={<TimesIcon />} variant="plain" onClick={clearInput} aria-label="Clear button and input" />
              )}
            </TextInputGroupUtilities>
          )}
        </TextInputGroup>
      </div>
    );
  };

  const getSortParamsModalWindow = (columnIndex: number, data: SystemsDetail[]): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: 'asc', // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      setModalData(sortModalWindowData(data, direction, index));
    },
    columnIndex,
  });

  const sortModalWindowData = (data: SystemsDetail[] | undefined, direction: string, index: number) => {
    if (data === undefined) {
      return undefined;
    }

    let sortedSystemsModalWindow = data;
    if (index !== undefined) {
      sortedSystemsModalWindow = data.sort((a, b) => {
        const aValue = a.display_name;
        const bValue = b.display_name;
        // string sort
        if (direction === 'asc') {
          return aValue.localeCompare(bValue);
        }
        return bValue.localeCompare(aValue);
      });
    }
    return sortedSystemsModalWindow;
  };

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value);
    filterModalWindowData(value);
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
    filterModalWindowData('');
  };

  const filterModalWindowData = (value: string) => {
    if (modalData === undefined) {
      return;
    }

    if (value) {
      // For filtering using the original list!
      setModalDataFiltered(
        modalData.filter((item) => item.display_name.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      setModalDataFiltered(modalData);
    }
  };

  return renderModalWindow();
};

export default LifecycleModalWindow;
