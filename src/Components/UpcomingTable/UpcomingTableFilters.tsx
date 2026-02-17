import React, { useState } from 'react';
import {
  Badge,
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  MenuToggle,
  Pagination,
  PaginationVariant,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
  Tooltip,
} from '@patternfly/react-core';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import './upcoming-table.scss';
import { Filter } from '../../types/Filter';
import ExportDataButton from '../ExportDataButton/ExportDataButton';

interface UpcomingTableFiltersProps {
  resetFilters: () => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  handleSetPage: (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    _perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => void;
  handlePerPageSelect: (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => void;
  page: number;
  perPage: number;
  itemCount: number;
  typeSelections: Set<string>;
  setTypeSelections: (values: Set<string>) => void;
  dateSelection: string;
  setDateSelection: (value: string) => void;
  releaseSelections: string[];
  setReleaseSelections: (values: string[]) => void;
  releaseOptions: {
    release: string;
  }[];
  dateOptions: {
    date: string;
  }[];
  typeOptions: {
    type: string;
  }[];
  resetTypeFilter: () => void;
  filtersForURL: Filter;
  setFiltersForURL: (filters: Filter) => void;
  selectedViewFilter: string;
  handleViewFilterChange: (filter: string) => void;
  noDataAvailable?: boolean; // Add noDataAvailable prop with optional flag
  downloadCSV: () => void;
  canDownloadCSV: boolean;
}

export const UpcomingTableFilters: React.FunctionComponent<UpcomingTableFiltersProps> = ({
  itemCount,
  resetFilters,
  searchValue,
  setSearchValue,
  handleSetPage,
  handlePerPageSelect,
  page,
  perPage,
  typeSelections,
  setTypeSelections,
  dateSelection,
  setDateSelection,
  releaseSelections,
  setReleaseSelections,
  releaseOptions,
  dateOptions,
  typeOptions,
  resetTypeFilter,
  filtersForURL,
  setFiltersForURL,
  selectedViewFilter,
  handleViewFilterChange,
  noDataAvailable = false, // Default to false if not provided
  downloadCSV,
  canDownloadCSV,
}) => {
  const [isReleaseMenuOpen, setIsReleaseMenuOpen] = useState<boolean>(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState<boolean>(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState<boolean>(false);
  const [activeAttributeMenu, setActiveAttributeMenu] = useState<'Name' | 'Type' | 'Release' | 'Date'>('Name');
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);

  const buildPagination = (variant: 'bottom' | 'top' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={itemCount}
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

  const handleItemClick = (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent) => {
    const id = event.currentTarget.id;
    handleViewFilterChange(id);
  };

  // Helper function to get tooltip content for relevant only view
  const getTooltipContent = () => {
    return 'Add systems to Inventory to view only upcoming features relevant to your organization.';
  };

  const onReleaseToggleClick = (ev: React.MouseEvent) => {
    setIsReleaseMenuOpen(!isReleaseMenuOpen);
  };

  function onReleaseSelect(event: React.MouseEvent | undefined, releaseId: string | number | undefined) {
    if (typeof releaseId === 'undefined') {
      return;
    }

    const releaseStr = releaseId.toString();
    const selections = releaseSelections.includes(releaseStr)
      ? releaseSelections.filter((selection) => selection !== releaseStr)
      : [releaseStr, ...releaseSelections];

    setReleaseSelections(selections);
    const newFilters = structuredClone(filtersForURL);
    newFilters['release'] = selections;
    setFiltersForURL(newFilters);
  }

  const releaseSelect = (
    <Dropdown
      isOpen={isReleaseMenuOpen}
      id="attribute-search-status-menu"
      onSelect={onReleaseSelect}
      selected={releaseSelections}
      onOpenChange={(isOpen: boolean) => setIsReleaseMenuOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onReleaseToggleClick}
          isExpanded={isReleaseMenuOpen}
          {...(releaseSelections.length > 0 && {
            badge: <Badge isRead>{releaseSelections.length}</Badge>,
          })}
          style={
            {
              width: '200px',
            } as React.CSSProperties
          }
        >
          Filter by release
        </MenuToggle>
      )}
      ouiaId="attribute-search-type-menu"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        {releaseOptions.map((option) => (
          <DropdownItem
            hasCheckbox
            key={option.release}
            isSelected={releaseSelections.includes(option.release)}
            itemId={option.release}
          >
            {option.release}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );

  const onDateToggleClick = (ev: React.MouseEvent) => {
    setIsDateMenuOpen(!isDateMenuOpen);
  };

  function onDateSelect(event: React.MouseEvent | undefined, itemId: string | number | undefined) {
    if (typeof itemId === 'undefined') {
      return;
    }
    const itemIdAsString = itemId.toString();
    setDateSelection(itemIdAsString);
    setIsDateMenuOpen(!isDateMenuOpen);
    const newFilters = structuredClone(filtersForURL);
    newFilters['date'] = itemIdAsString;
    setFiltersForURL(newFilters);
  }

  const dateSelect = (
    <Dropdown
      isOpen={isDateMenuOpen}
      id="attribute-search-status-menu"
      onSelect={onDateSelect}
      selected={dateSelection}
      onOpenChange={(isOpen: boolean) => setIsDateMenuOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onDateToggleClick}
          isExpanded={isDateMenuOpen}
          style={
            {
              width: '200px',
            } as React.CSSProperties
          }
        >
          Filter by date
        </MenuToggle>
      )}
      ouiaId="attribute-search-type-menu"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        {dateOptions.map((option) => (
          <DropdownItem key={option.date} isSelected={dateSelection === option.date} itemId={option.date}>
            {option.date}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );

  const onTypeMenuToggleClick = (ev: React.MouseEvent) => {
    setIsTypeMenuOpen(!isTypeMenuOpen);
  };

  function onTypeMenuSelect(event: React.MouseEvent | undefined, typeId: string | number | undefined) {
    if (typeof typeId === 'undefined') {
      return;
    }

    const typeStr = typeId.toString();
    const selections = typeSelections.has(typeStr)
      ? new Set([...typeSelections].filter((selection) => selection !== typeStr))
      : new Set([typeStr, ...typeSelections]);

    setTypeSelections(selections);
    const newFilters = structuredClone(filtersForURL);
    newFilters['type'] = selections;
    setFiltersForURL(newFilters);
  }

  const typeMenu = (
    <Dropdown
      isOpen={isTypeMenuOpen}
      onSelect={onTypeMenuSelect}
      selected={typeSelections}
      onOpenChange={(isOpen: boolean) => setIsTypeMenuOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onTypeMenuToggleClick}
          isExpanded={isTypeMenuOpen}
          {...(typeSelections.size > 0 && {
            badge: <Badge isRead>{typeSelections.size}</Badge>,
          })}
          style={
            {
              width: '200px',
            } as React.CSSProperties
          }
        >
          Filter by type
        </MenuToggle>
      )}
      ouiaId="attribute-search-type-menu"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        {typeOptions.map((option) => (
          <DropdownItem
            hasCheckbox
            key={option.type}
            isSelected={typeSelections.has(option.type)}
            itemId={option.type}
          >
            {option.type}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const attributeDropdown = (
    <Dropdown
      isOpen={isAttributeMenuOpen}
      onSelect={(_ev, itemId) => {
        setActiveAttributeMenu(itemId?.toString() as 'Name' | 'Type' | 'Release' | 'Date');
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
      onOpenChange={(isOpen: boolean) => setIsAttributeMenuOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onAttributeToggleClick}
          isExpanded={isAttributeMenuOpen}
          icon={<FilterIcon />}
        >
          {activeAttributeMenu}
        </MenuToggle>
      )}
      ouiaId="attribute-dropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DropdownItem value="Name" key="name">
          Name
        </DropdownItem>
        <DropdownItem value="Type" key="type">
          Type
        </DropdownItem>
        <DropdownItem value="Release" key="release">
          Release
        </DropdownItem>
        <DropdownItem value="Date" key="date">
          Date
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );

  const resetName = () => {
    setSearchValue('');
    const newFilters = structuredClone(filtersForURL);
    newFilters['name'] = '';
    setFiltersForURL(newFilters);
  };

  const resetRelease = () => {
    setReleaseSelections([]);
    const newFilters = structuredClone(filtersForURL);
    delete newFilters['release'];
    setFiltersForURL(newFilters);
  };

  const resetDate = () => {
    setDateSelection('');
    const newFilters = structuredClone(filtersForURL);
    delete newFilters['date'];
    setFiltersForURL(newFilters);
  };

  // Set up name search input
  const searchInput = (
    <SearchInput
      placeholder="Filter by name"
      value={searchValue}
      onChange={(_event, value) => {
        setSearchValue(value);
        const newFilters = structuredClone(filtersForURL);
        newFilters['name'] = value;
        setFiltersForURL(newFilters);
      }}
      onClear={resetName}
    />
  );

  return (
    <Toolbar id="attribute-search-filter-toolbar" clearAllFilters={resetFilters}>
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
            <ToolbarFilter
              labels={searchValue !== '' ? [searchValue] : ([] as string[])}
              deleteLabel={resetName}
              deleteLabelGroup={resetName}
              categoryName="Name"
              showToolbarItem={activeAttributeMenu === 'Name'}
            >
              {searchInput}
            </ToolbarFilter>
            <ToolbarFilter
              labels={[...typeSelections]}
              deleteLabel={(category, chip) => onTypeMenuSelect(undefined, chip as string)}
              deleteLabelGroup={() => {
                const newFilters = structuredClone(filtersForURL);
                delete newFilters['type'];
                setFiltersForURL(newFilters);
                resetTypeFilter();
              }}
              categoryName="Type"
              showToolbarItem={activeAttributeMenu === 'Type'}
            >
              {typeMenu}
            </ToolbarFilter>
            <ToolbarFilter
              labels={releaseSelections}
              deleteLabel={(category, chip) => onReleaseSelect(undefined, chip as string)}
              deleteLabelGroup={resetRelease}
              categoryName="Release"
              showToolbarItem={activeAttributeMenu === 'Release'}
            >
              {releaseSelect}
            </ToolbarFilter>
            <ToolbarFilter
              labels={dateSelection !== '' ? [dateSelection] : ([] as string[])}
              deleteLabel={resetDate}
              deleteLabelGroup={resetDate}
              categoryName="Date"
              showToolbarItem={activeAttributeMenu === 'Date'}
            >
              {dateSelect}
            </ToolbarFilter>
            <ToolbarItem>
              <Form>
                <FormGroup className="drf-upcoming__filter-formgroup" label="View" fieldId="view-filter">
                  <ToggleGroup aria-label="Whether only relevant or all items are displayed">
                    <Tooltip content={getTooltipContent()} trigger={noDataAvailable ? 'mouseenter' : 'manual'}>
                      <ToggleGroupItem
                        text="Relevant only"
                        buttonId="relevant"
                        isSelected={selectedViewFilter === 'relevant'}
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
              <ExportDataButton
                className="drf-upcoming__filter-download"
                onClick={downloadCSV}
                isDisabled={!canDownloadCSV}
                disabledTooltipContent="No data to export"
              />
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarToggleGroup>
        <ToolbarItem variant="pagination">{buildPagination('top', true)}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default UpcomingTableFilters;
