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
  selectedChartSortBy: string;
  setSelectedChartSortBy: (name: string) => void;
  downloadCSV: () => void;
  selectedViewFilter: string;
  handleViewFilterChange: (filter: string) => void;
  noDataAvailable: boolean;
}

const DROPDOWN_ITEMS = ['Retirement date', 'Name', 'Release version', 'Release date', 'Systems'];

export const LifecycleFilters: React.FunctionComponent<LifecycleFiltersProps> = ({
  nameFilter,
  setNameFilter,
  lifecycleDropdownValue,
  setLifecycleDropdownValue,
  onLifecycleDropdownSelect,
  selectedChartSortBy,
  setSelectedChartSortBy,
  downloadCSV,
  selectedViewFilter,
  handleViewFilterChange,
  noDataAvailable,
}: LifecycleFiltersProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleItemClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
    const id = event.currentTarget.id;
    handleViewFilterChange(id);
  };

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

  // Helper function to determine tooltip content based on lifecycleDropdownValue
  const getTooltipContent = (buttonId: string) => {
    const isRHEL = lifecycleDropdownValue === 'Red Hat Enterprise Linux';
    const isAppStream =
      lifecycleDropdownValue === 'RHEL 8 Application Streams' ||
      lifecycleDropdownValue === 'RHEL 9 Application Streams';

    if (buttonId === 'installed-and-related') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on or related to those systems.';
      } else if (isAppStream) {
        return 'Add systems to Inventory to view only application streams installed on or related to those systems.';
      }
    } else if (buttonId === 'installed-only') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on those systems.';
      } else if (isAppStream) {
        return 'Add systems to Inventory to view only application streams installed on those systems.';
      }
    }
  };

  return (
    <div className="drf-lifecycle__filters">
      <Toolbar className="drf-lifecycle__filters-toolbar">
        <ToolbarGroup>
          <ToolbarItem variant="bulk-select">
            <Form>
              <FormGroup className="drf-lifecycle__filter-formgroup" label="Life Cycle" fieldId="data-switcher">
                <LifecycleDropdown
                  currentValue={lifecycleDropdownValue}
                  setCurrentValue={(value: string) => setLifecycleDropdownValue(value)}
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
              />
            </ToolbarItem>
            <ToolbarItem>
              <Form>
                <FormGroup className="drf-lifecycle__filter-formgroup" label="View" fieldId="view-filter">
                  <ToggleGroup aria-label="Whether installed and related, only installed or all items are displayed">
                    <Tooltip
                      content={getTooltipContent('installed-and-related')}
                      trigger={noDataAvailable ? 'mouseenter' : 'manual'}
                    >
                      <ToggleGroupItem
                        text="Installed and related"
                        buttonId="installed-and-related"
                        isSelected={selectedViewFilter === 'installed-and-related'}
                        isDisabled={noDataAvailable}
                        onChange={handleItemClick}
                      />
                    </Tooltip>
                    <Tooltip
                      content={getTooltipContent('installed-only')}
                      trigger={noDataAvailable ? 'mouseenter' : 'manual'}
                    >
                      <ToggleGroupItem
                        text="Installed only"
                        buttonId="installed-only"
                        isSelected={selectedViewFilter === 'installed-only'}
                        isDisabled={noDataAvailable}
                        onChange={handleItemClick}
                      />
                    </Tooltip>
                    <ToggleGroupItem
                      text="All"
                      buttonId="all"
                      isSelected={selectedViewFilter === 'all'}
                      onChange={handleItemClick}
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
                <FormGroup className="drf-lifecycle__filter-formgroup" label="Sort by" fieldId="sort-chart-by">
                  <Dropdown
                    isOpen={isOpen}
                    onSelect={onSelect}
                    onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
                    toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
                      <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
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
                          isDisabled={item === 'Systems' && selectedViewFilter === 'all'}
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