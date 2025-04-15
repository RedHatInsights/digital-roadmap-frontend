import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  MenuToggle,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import React from 'react';
import { ErrorObject } from '../../types/ErrorObject';
import LifecycleDropdown from '../FilterComponents/LifecycleDropdown';
import ExportIcon from '@patternfly/react-icons/dist/esm/icons/export-icon';

interface LifecycleFiltersProps {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  setError: (error: ErrorObject) => void;
  setIsLoading: (isLoading: boolean) => void;
  lifecycleDropdownValue: string;
  setLifecycleDropdownValue: (value: string) => void;
  onLifecycleDropdownSelect: (value: string) => void;
  selectedChartSortBy: NamedCurve;
  setSelectedChartSortBy: (name: string) => void;
  downloadCSV: () => void;
}

const DROPDOWN_ITEMS = [
  'Retirement date',
  'Name',
  'Release version',
  'Release date',
  'Systems',
];

export const LifecycleFilters: React.FunctionComponent<
  LifecycleFiltersProps
> = ({
  nameFilter,
  setNameFilter,
  lifecycleDropdownValue,
  setLifecycleDropdownValue,
  onLifecycleDropdownSelect,
  selectedChartSortBy,
  setSelectedChartSortBy,
  downloadCSV,
}: LifecycleFiltersProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedToggle = 'installed';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /*const handleItemClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
    // const id = event.currentTarget.id;
    //setIsSelected(id);
  };*/

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined
  ) => {
    setIsOpen(false);
    if (value && typeof value == 'string') {
      setSelectedChartSortBy(value);
    }
  };

  // Handle paste event in the search input
  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (document.activeElement === searchInputRef.current) {
        const pastedText = event.clipboardData?.getData('text') || '';
        setNameFilter(pastedText);
      }
    };

    // Add event listener to the document
    document.addEventListener('paste', handlePaste);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setNameFilter]);

  return (
    <div className="drf-lifecycle__filters">
      <Toolbar className="drf-lifecycle__filters-toolbar">
        <ToolbarGroup>
          <ToolbarItem variant="bulk-select">
            <Form>
              <FormGroup
                className="drf-lifecycle__filter-formgroup"
                label="Life Cycle"
                fieldId="data-switcher"
              >
                <LifecycleDropdown
                  currentValue={lifecycleDropdownValue}
                  setCurrentValue={(value: string) =>
                    setLifecycleDropdownValue(value)
                  }
                  onDropdownSelect={onLifecycleDropdownSelect}
                />
              </FormGroup>
            </Form>
          </ToolbarItem>
        </ToolbarGroup>
        <div className="drf-lifecycle__filters-toolbar-group">
          <ToolbarGroup>
            <ToolbarItem>
              <SearchInput
                placeholder="Filter by name"
                value={nameFilter}
                onChange={(_event, value) => setNameFilter(value)}
                onClear={() => setNameFilter('')}
                aria-label="Filter by name"
                ref={searchInputRef}
                onPaste={(event) => {
                  // Prevent default to avoid duplicate handling with the document listener
                  event.preventDefault();
                  const pastedText = event.clipboardData?.getData('text') || '';
                  setNameFilter(pastedText);
                }}
              />
            </ToolbarItem>
            <ToolbarItem>
              <Form>
                <FormGroup
                  className="drf-lifecycle__filter-formgroup"
                  label="View"
                  fieldId="view-filter"
                >
                  <ToggleGroup aria-label="Whether installed and related or only installed items are displayed">
                    <ToggleGroupItem
                      text="Installed and related"
                      buttonId="toggle-group-related"
                      isDisabled
                      //onChange={handleItemClick}
                    />
                    <ToggleGroupItem
                      text="Installed only"
                      buttonId="toggle-group-installed"
                      isSelected={selectedToggle === 'installed'}
                      //onChange={handleItemClick}
                    />
                  </ToggleGroup>
                </FormGroup>
              </Form>
            </ToolbarItem>
            <ToolbarItem>
              <Tooltip content="Export data">
                <Button
                  className="drf-lifecycle__filter-download"
                  variant="plain"
                  aria-label="Download visible dataset as CSV"
                  onClick={downloadCSV}
                  icon={<ExportIcon />}
                ></Button>
              </Tooltip>
            </ToolbarItem>
          </ToolbarGroup>
          <ToolbarGroup>
            <ToolbarItem>
              <Form>
                <FormGroup
                  className="drf-lifecycle__filter-formgroup"
                  label="Sort by"
                  fieldId="sort-chart-by"
                >
                  <Dropdown
                    isOpen={isOpen}
                    onSelect={onSelect}
                    onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
                    toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={onToggleClick}
                        isExpanded={isOpen}
                      >
                        {selectedChartSortBy}
                      </MenuToggle>
                    )}
                    ouiaId="Value to sort lifecycle chart by"
                    shouldFocusToggleOnSelect
                    popperProps={{ enableFlip: true, position: 'end' }}
                  >
                    <DropdownList>
                      {DROPDOWN_ITEMS.map((item) => (
                        <DropdownItem
                          value={item}
                          key={item}
                          isSelected={item === selectedChartSortBy}
                        >
                          {item}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                </FormGroup>
              </Form>
            </ToolbarItem>
          </ToolbarGroup>
        </div>
      </Toolbar>
    </div>
  );
};

export default LifecycleFilters;
