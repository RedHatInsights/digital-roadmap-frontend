import React from 'react';
import {
  Badge,
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import ExportDataButton from '../ExportDataButton/ExportDataButton';

const FIELD_OPTIONS = ['Name', 'Version'] as const;
const DROPDOWN_ITEMS = ['Retirement date', 'Name', 'Release version', 'Release date', 'Systems'];

interface SystemsViewToolbarProps {
  selectedField: (typeof FIELD_OPTIONS)[number];
  isFieldOpen: boolean;
  onFieldToggle: () => void;
  onFieldSelect: (_event?: React.MouseEvent, value?: string | number) => void;
  nameFilter: string;
  setNameFilter: (name: string) => void;
  selectedRhelVersions: string[];
  setSelectedRhelVersions: (versions: string[]) => void;
  onRhelVersionsChange?: (versions: string[]) => void;
  isRhelSelectOpen: boolean;
  setIsRhelSelectOpen: (open: boolean) => void;
  onRhelSelect: (event?: React.MouseEvent, value?: string | number) => void;
  rhelVersionOptions: string[];
  nameSearchInput: React.ReactNode;
  rhelVersionSelect: React.ReactNode;
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

export const SystemsViewToolbar: React.FunctionComponent<SystemsViewToolbarProps> = ({
  selectedField,
  isFieldOpen,
  onFieldToggle,
  onFieldSelect,
  nameFilter,
  setNameFilter,
  selectedRhelVersions,
  setSelectedRhelVersions,
  onRhelVersionsChange,
  isRhelSelectOpen,
  setIsRhelSelectOpen,
  onRhelSelect,
  rhelVersionOptions,
  nameSearchInput,
  rhelVersionSelect,
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
    <>
      <div className="drf-lifecycle__toolbar-row">
        <ToolbarContent className="drf-lifecycle__filters-toolbar-group">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>
              <Select
                aria-label="Select filter field"
                isOpen={isFieldOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    onFieldToggle();
                  }
                }}
                onSelect={onFieldSelect}
                selected={selectedField}
                toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={onFieldToggle}
                    isExpanded={isFieldOpen}
                    icon={<FilterIcon />}
                  >
                    {selectedField}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {FIELD_OPTIONS.map((opt) => (
                    <SelectOption key={opt} value={opt} isSelected={selectedField === opt}>
                      {opt}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>

            {selectedField === 'Name' && (
              <ToolbarItem key="name-search">
                <SearchInput
                  placeholder="Filter by name"
                  value={nameFilter}
                  onChange={(_event, value) => setNameFilter(value)}
                  onClear={() => setNameFilter('')}
                  aria-label="Filter by name"
                />
              </ToolbarItem>
            )}

            {selectedField === 'Version' && <ToolbarItem key="version-select">{rhelVersionSelect}</ToolbarItem>}
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

      {/* Chips row below the toolbar */}
      {nameFilter !== '' || selectedRhelVersions.length > 0 ? (
        <div style={{ paddingLeft: '0px', paddingRight: '24px', paddingTop: '8px' }}>
          {nameFilter !== '' && (
            <LabelGroup categoryName="Name" numLabels={1}>
              <Label variant="outline" onClose={() => setNameFilter('')}>
                {nameFilter}
              </Label>
            </LabelGroup>
          )}

          {selectedRhelVersions.length > 0 && (
            <LabelGroup
              categoryName="RHEL versions"
              numLabels={3}
              isClosable
              onClick={() => {
                setSelectedRhelVersions([]);
                onRhelVersionsChange?.([]);
              }}
            >
              {selectedRhelVersions.map((version) => (
                <Label
                  key={version}
                  variant="outline"
                  onClose={() => {
                    const next = selectedRhelVersions.filter((v) => v !== version);
                    setSelectedRhelVersions(next);
                    onRhelVersionsChange?.(next);
                  }}
                >
                  {version}
                </Label>
              ))}
            </LabelGroup>
          )}
        </div>
      ) : null}
    </>
  );
};

export default SystemsViewToolbar;
