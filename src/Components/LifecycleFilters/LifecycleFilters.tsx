import {
  Alert,
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
import { DEFAULT_DROPDOWN_VALUE, RHEL_8_STREAMS_DROPDOWN_VALUE } from '../Lifecycle/filteringUtils';

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

  // Handle switching to "all" view when sort is set to "Systems"
  React.useEffect(() => {
    if (selectedViewFilter === 'all' && selectedChartSortBy === 'Systems') {
      // Default to the first available option when "Systems" becomes disabled
      setSelectedChartSortBy('Retirement date');
    }
  }, [selectedViewFilter, selectedChartSortBy, setSelectedChartSortBy]);

  const handleItemClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
    const id = event.currentTarget.id;

    // Prevent mouse clicks to "All" view filter when no data is available
    // Without this when clicking "All" the previously disabled views are no longer grayed out
    if (noDataAvailable && id === 'all') {
      return;
    }
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
    const isRHEL9AppStream = lifecycleDropdownValue === 'RHEL 9 Application Streams';
    const isRHEL8AppStream = lifecycleDropdownValue === 'RHEL 8 Application Streams';

    if (buttonId === 'installed-and-related') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on or related to those systems.';
      } else if (isRHEL9AppStream) {
        return 'Add systems to Inventory to view only RHEL 9 application streams installed on or related to those systems.';
      } else if (isRHEL8AppStream) {
        return 'Add systems to Inventory to view only RHEL 8 application streams installed on or related to those systems.';
      }
    } else if (buttonId === 'installed-only') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on those systems.';
      } else if (isRHEL9AppStream) {
        return 'Add systems to Inventory to view only RHEL 9 application streams installed on those systems.';
      } else if (isRHEL8AppStream) {
        return 'Add systems to Inventory to view only RHEL 8 application streams installed on those systems.';
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

        {(lifecycleDropdownValue === DEFAULT_DROPDOWN_VALUE ||
          lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE) && (
          <Alert
            variant="info"
            isInline
            title="Rolling application streams are not shown"
            isExpandable
            toggleAriaLabel="Rolling application streams are not shown"
          >
            <p>
              Rolling application streams are fully supported for the full life of the Red Hat Enterprise Linux
              major release, with new versions made available within the latest minor release of RHEL and replacing
              support for prior application versions. Like all application streams, rolling application streams do
              not receive Extended Update Support (EUS) or Extended Life Cycle Support (ELS) coverage.{' '}
              <a href="https://access.redhat.com/support/policy/updates/rhel-app-streams-life-cycle">
                Learn more about the application streams life cycle.
              </a>
            </p>
          </Alert>
        )}

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
                  <ToggleGroup
                    className="drf-lifecycle__toggle-group-fixed-height"
                    aria-label="Whether installed and related, only installed or all items are displayed"
                  >
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
        {selectedViewFilter === 'all' && !noDataAvailable && (
          <Alert
            variant="info"
            isInline
            title="Connected systems are not considered in this view"
            style={{ marginBottom: '32px' }}
          >
            <p>
              This chart differs from the other views, as the color-coding below applies to all releases and not
              just those installed on the systems in your inventory.
            </p>
          </Alert>
        )}
      </Toolbar>
    </div>
  );
};

export default LifecycleFilters;
