import React, { useEffect } from "react";
import {
  SortByDirection,
  Table,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from "@patternfly/react-table";
import {
  Button,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from "@patternfly/react-core";
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalVariant,
} from "@patternfly/react-core/next";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

/**
The modal window requires following parameters to be set in the parent component:
- name - of the package/system to be shown in the title
- modalData - list of the affected systems for the package/system
- isModalOpen - value managing if modal is open in UI, React.UseState()
- handleModalToggle - function for handling close/open modal window, _event: React.MouseEvent | React.KeyboardEvent
*/
interface ModalWindowProps {
  name: String | undefined;
  modalData: string[] | undefined;
  setModalData: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  isModalOpen: boolean;
  handleModalToggle: (_event: any) => void; // any because <Modal onClose> stops working with anything else
}

export const LifecycleModalWindow: React.FunctionComponent<
  ModalWindowProps
> = ({ name, modalData, setModalData, isModalOpen, handleModalToggle }) => {
  const [modalDataFiltered, setModalDataFiltered] = React.useState<
    string[] | undefined
  >();
  const [activeSortIndex, setActiveSortIndex] = React.useState<
    number | undefined
  >();
  const [activeSortDirection, setActiveSortDirection] =
    React.useState<SortByDirection>();
  const [inputValue, setInputValue] = React.useState("");

  // When the modal window is opened, update it with new data/default values
  React.useEffect(() => {
    setModalDataFiltered(modalData);
    setActiveSortIndex(undefined);
    setActiveSortDirection(undefined);
    setInputValue("");
  }, [isModalOpen]);

  const renderModalWindow = () => {
    return (
      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={handleModalToggle} // TODO: problem when handleModalToggle = (_event: React.MouseEvent | React.KeyboardEvent) this doesn't work
        aria-labelledby="scrollable-modal-title"
        aria-describedby="modal-box-body-scrollable"
      >
        <ModalHeader
          title="Systems"
          labelId="scrollable-modal-title"
          description={`${name} is installed on these systems. Click on a system name to view system details in Inventory.`}
        />
        <ModalBody
          tabIndex={0}
          id="modal-box-body-scrollable"
          aria-label="Scrollable modal content"
        >
          {renderModalWindowTable(modalDataFiltered)}
        </ModalBody>
        <ModalFooter></ModalFooter>
      </Modal>
    );
  };

  const renderModalWindowTable = (data: string[] | undefined) => {
    if (data === undefined) {
      return "";
    }

    return (
      <div>
        <div style={{ marginTop: "20px" }}>{renderFilterBoxModalWindow()}</div>
        <div style={{ height: "16px" }}></div>
        <Table variant="compact">
          <Thead>
            <Tr>
              <Th sort={getSortParamsModalWindow(0, data)}>Name</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data?.map((item, index) => (
              <Tr key={index}>
                <Td dataLabel="Name">
                  <Button variant="link">{item}</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </div>
    );
  };

  const renderFilterBoxModalWindow = () => {
    return (
      <TextInputGroup style={{ maxWidth: "140px" }}>
        <TextInputGroupMain
          icon={<SearchIcon />}
          value={inputValue}
          onChange={handleInputChange}
        />
        {showUtilities && (
          <TextInputGroupUtilities>
            {showClearButton && (
              <Button
                variant="plain"
                onClick={clearInput}
                aria-label="Clear button and input"
              >
                <TimesIcon />
              </Button>
            )}
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    );
  };

  const getSortParamsModalWindow = (
    columnIndex: number,
    data: string[]
  ): ThProps["sort"] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
      defaultDirection: "asc", // starting sort direction when first sorting a column. Defaults to 'asc'
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction);
      setModalData(sortModalWindowData(data, direction, index));
    },
    columnIndex,
  });

  const sortModalWindowData = (
    data: string[] | undefined,
    direction: String,
    index: number
  ) => {
    if (data === undefined) {
      return undefined;
    }

    let sortedSystemsModalWindow = data;
    if (index !== undefined) {
      sortedSystemsModalWindow = data.sort((a, b) => {
        const aValue = a;
        const bValue = b;
        debugger;
        // string sort
        if (direction === "asc") {
          return (aValue as string).localeCompare(bValue as string);
        }
        return (bValue as string).localeCompare(aValue as string);
      });
    }
    return sortedSystemsModalWindow;
  };

  /** callback for updating the inputValue state in this component so that the input can be controlled */
  const handleInputChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setInputValue(value);
    filterModalWindowData(value);
  };

  /** show the input clearing button only when the input is not empty */
  const showClearButton = !!inputValue;

  /** render the utilities component only when a component it contains is being rendered */
  const showUtilities = showClearButton;

  /** callback for clearing the text input */
  const clearInput = () => {
    setInputValue("");
  };

  const filterModalWindowData = (value: String) => {
    if (modalData === undefined) {
      return;
    }

    if (value) {
      // For filtering using the original list!
      setModalDataFiltered(
        modalData.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setModalDataFiltered(modalData);
    }
  };

  return renderModalWindow();
};

export default LifecycleModalWindow;
