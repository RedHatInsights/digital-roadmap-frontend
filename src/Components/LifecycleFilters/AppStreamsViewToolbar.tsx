import React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  MenuToggle,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import ExportDataButton from '../ExportDataButton/ExportDataButton';

const DROPDOWN_ITEMS = ['Retirement date', 'Name', 'Release version', 'Release date', 'Systems'];

interface AppStreamsViewToolbarProps {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  selectedViewFilter: string;
  handleItemClick: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => void;
  noDataAvailable: boolean;
  getTooltipContent: (buttonId: string) => string | undefined;
  selectedChartSortBy: string;
  isOpen: boolean;
  onToggleClick: () => void;
  onSelect: (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined
  ) => void;
  setIsOpen: (open: boolean) => void;
  downloadCSV: () => void;
}

export const AppStreamsViewToolbar: React.FunctionComponent<AppStreamsViewToolbarProps> = ({
  nameFilter,
  setNameFilter,
  selectedViewFilter,
  handleItemClick,
  noDataAvailable,
  getTooltipContent,
  selectedChartSortBy,
  isOpen,
  onToggleClick,
  onSelect,
  setIsOpen,
  downloadCSV,
}) => {
  return (
    <div className="drf-lifecycle__toolbar-row">
      <ToolbarContent className="drf-lifecycle__filters-toolbar-group">
        <ToolbarGroup>
          <ToolbarItem>
            {/* Name input for AppStreams view */}
            <SearchInput
              placeholder="Filter by name"
              value={nameFilter}
              onChange={(_event, value) => setNameFilter(value)}
              onClear={() => setNameFilter('')}
              aria-label="Filter by name"
            />
          </ToolbarItem>
        </ToolbarGroup>

        <ToolbarGroup>
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
                    <div>
                      <ToggleGroupItem
                        text="Installed and related"
                        buttonId="installed-and-related"
                        isSelected={selectedViewFilter === 'installed-and-related'}
                        isDisabled={noDataAvailable}
                        onChange={handleItemClick}
                      />
                    </div>
                  </Tooltip>
                  <Tooltip
                    content={getTooltipContent('installed-only')}
                    trigger={noDataAvailable ? 'mouseenter' : 'manual'}
                  >
                    <div>
                      <ToggleGroupItem
                        text="Installed only"
                        buttonId="installed-only"
                        isSelected={selectedViewFilter === 'installed-only'}
                        isDisabled={noDataAvailable}
                        onChange={handleItemClick}
                      />
                    </div>
                  </Tooltip>
                  <div>
                    <ToggleGroupItem
                      text="All"
                      buttonId="all"
                      isSelected={selectedViewFilter === 'all'}
                      onChange={handleItemClick}
                    />
                  </div>
                </ToggleGroup>
              </FormGroup>
            </Form>
          </ToolbarItem>
          <ToolbarItem>
            <ExportDataButton className="drf-lifecycle__filter-download" onClick={downloadCSV} />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
      <ToolbarContent className="drf-lifecycle__sort-toolbar-content">
        <ToolbarGroup className="drf-lifecycle__sort-group">
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
      </ToolbarContent>
    </div>
  );
};

export default AppStreamsViewToolbar;
