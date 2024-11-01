import React from 'react';
import {
  Badge,
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
  Pagination,
  PaginationVariant,
  Popper,
  SearchInput,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import './upcoming-table.scss';

import { Record } from '../Upcoming/mock_data';

interface UpcomingTableProps {
  data: Record[];
  columnNames: {
    name: string;
    release: string;
    date: string;
  };
}

export const UpcomingTable: React.FunctionComponent<UpcomingTableProps> = (
  props
) => {
  // Set up repo filtering
  const { data, columnNames } = props;
  const [searchValue, setSearchValue] = React.useState('');
  const [dateSelections, setDateSelections] = React.useState<string[]>([]);
  const [releaseSelection, setReleaseSelection] = React.useState('');

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilter = (repo: Record) => {
    // Search name with search value
    let searchValueInput: RegExp;
    try {
      searchValueInput = new RegExp(searchValue, 'i');
    } catch (err) {
      searchValueInput = new RegExp(
        searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      );
    }
    const matchesNameValue = repo.name.search(searchValueInput) >= 0;

    // Search release with status selection
    const matchesReleaseValue =
      repo.release.toLowerCase() === releaseSelection.toLowerCase();

    // Search location with location selections
    const matchesDateValue = dateSelections.includes(repo.date);

    console.log(
      `repo: ${repo.release} searchValue: ${searchValue}, matchesNameValue: ${matchesNameValue}, releaseSelection: ${releaseSelection}, matchesReleaseValue: ${matchesReleaseValue}, dateSelections: ${dateSelections}, matchesDateValue: ${matchesDateValue}`
    );
    return (
      (searchValue === '' || matchesNameValue) &&
      (releaseSelection === '' || matchesReleaseValue) &&
      (dateSelections.length === 0 || matchesDateValue)
    );
  };
  const filteredRepos = data.filter(onFilter);

  // Set up name search input
  const searchInput = (
    <SearchInput
      placeholder="Filter by name"
      value={searchValue}
      onChange={(_event, value) => onSearchChange(value)}
      onClear={() => onSearchChange('')}
    />
  );

  // Set up release single select
  const [isReleaseMenuOpen, setIsReleaseMenuOpen] =
    React.useState<boolean>(false);
  const releaseToggleRef = React.useRef<HTMLButtonElement>(null);
  const releaseMenuRef = React.useRef<HTMLDivElement>(null);
  const releaseContainerRef = React.useRef<HTMLDivElement>(null);

  const handleReleaseMenuKeys = (event: KeyboardEvent) => {
    if (
      isReleaseMenuOpen &&
      releaseMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsReleaseMenuOpen(!isReleaseMenuOpen);
        releaseToggleRef.current?.focus();
      }
    }
  };

  const handleReleaseClickOutside = (event: MouseEvent) => {
    if (
      isReleaseMenuOpen &&
      !releaseMenuRef.current?.contains(event.target as Node)
    ) {
      setIsReleaseMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleReleaseMenuKeys);
    window.addEventListener('click', handleReleaseClickOutside);
    return () => {
      window.removeEventListener('keydown', handleReleaseMenuKeys);
      window.removeEventListener('click', handleReleaseClickOutside);
    };
  }, [isReleaseMenuOpen, releaseMenuRef]);

  const onReleaseToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (releaseMenuRef.current) {
        const firstElement = releaseMenuRef.current.querySelector(
          'li > button:not(:disabled)'
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsReleaseMenuOpen(!isReleaseMenuOpen);
  };

  function onReleaseSelect(
    event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    setReleaseSelection(itemId.toString());
    setIsReleaseMenuOpen(!isReleaseMenuOpen);
  }

  const releaseToggle = (
    <MenuToggle
      ref={releaseToggleRef}
      onClick={onReleaseToggleClick}
      isExpanded={isReleaseMenuOpen}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by release
    </MenuToggle>
  );

  const releaseUniqueOptions = Array.from(
    new Set(data.map((repo) => repo.release))
  ).map((release) => ({
    release: release,
  }));

  const releaseMenu = (
    <Menu
      ref={releaseMenuRef}
      id="attribute-search-status-menu"
      onSelect={onReleaseSelect}
      selected={releaseSelection}
    >
      <MenuContent>
        <MenuList>
          {releaseUniqueOptions.map((option) => (
            <MenuItem
              key={option.release}
              isSelected={releaseSelection === option.release}
              itemId={option.release}
            >
              {option.release}
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const releaseSelect = (
    <div ref={releaseContainerRef}>
      <Popper
        trigger={releaseToggle}
        triggerRef={releaseToggleRef}
        popper={releaseMenu}
        popperRef={releaseMenuRef}
        appendTo={releaseContainerRef.current || undefined}
        isVisible={isReleaseMenuOpen}
      />
    </div>
  );

  // TODO: Rewrite this for our column
  // Set up location checkbox select
  const [isLocationMenuOpen, setIsLocationMenuOpen] =
    React.useState<boolean>(false);
  const locationToggleRef = React.useRef<HTMLButtonElement>(null);
  const locationMenuRef = React.useRef<HTMLDivElement>(null);
  const locationContainerRef = React.useRef<HTMLDivElement>(null);

  const handleLocationMenuKeys = (event: KeyboardEvent) => {
    if (
      isLocationMenuOpen &&
      locationMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsLocationMenuOpen(!isLocationMenuOpen);
        locationToggleRef.current?.focus();
      }
    }
  };

  const handleLocationClickOutside = (event: MouseEvent) => {
    if (
      isLocationMenuOpen &&
      !locationMenuRef.current?.contains(event.target as Node)
    ) {
      setIsLocationMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleLocationMenuKeys);
    window.addEventListener('click', handleLocationClickOutside);
    return () => {
      window.removeEventListener('keydown', handleLocationMenuKeys);
      window.removeEventListener('click', handleLocationClickOutside);
    };
  }, [isLocationMenuOpen, locationMenuRef]);

  const onLocationMenuToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (locationMenuRef.current) {
        const firstElement = locationMenuRef.current.querySelector(
          'li > button:not(:disabled)'
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsLocationMenuOpen(!isLocationMenuOpen);
  };

  function onLocationMenuSelect(
    event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    const itemStr = itemId.toString();

    setDateSelections(
      dateSelections.includes(itemStr)
        ? dateSelections.filter((selection) => selection !== itemStr)
        : [itemStr, ...dateSelections]
    );
  }

  const locationToggle = (
    <MenuToggle
      ref={locationToggleRef}
      onClick={onLocationMenuToggleClick}
      isExpanded={isLocationMenuOpen}
      {...(dateSelections.length > 0 && {
        badge: <Badge isRead>{dateSelections.length}</Badge>,
      })}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by date
    </MenuToggle>
  );

  const locationMenu = (
    <Menu
      ref={locationMenuRef}
      id="attribute-search-location-menu"
      onSelect={onLocationMenuSelect}
      selected={dateSelections}
    >
      <MenuContent>
        <MenuList>
          <MenuItem
            hasCheckbox
            isSelected={dateSelections.includes('Bangalore')}
            itemId="Bangalore"
          >
            Bangalore
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={dateSelections.includes('Boston')}
            itemId="Boston"
          >
            Boston
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={dateSelections.includes('Brno')}
            itemId="Brno"
          >
            Brno
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={dateSelections.includes('Raleigh')}
            itemId="Raleigh"
          >
            Raleigh
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={dateSelections.includes('Westford')}
            itemId="Westford"
          >
            Westford
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const locationSelect = (
    <div ref={locationContainerRef}>
      <Popper
        trigger={locationToggle}
        triggerRef={locationToggleRef}
        popper={locationMenu}
        popperRef={locationMenuRef}
        appendTo={locationContainerRef.current || undefined}
        isVisible={isLocationMenuOpen}
      />
    </div>
  );

  // Set up attribute selector
  const [activeAttributeMenu, setActiveAttributeMenu] = React.useState<
    'Name' | 'Release' | 'Date'
  >('Name');
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = React.useState(false);
  const attributeToggleRef = React.useRef<HTMLButtonElement>(null);
  const attributeMenuRef = React.useRef<HTMLDivElement>(null);
  const attributeContainerRef = React.useRef<HTMLDivElement>(null);

  const handleAttribueMenuKeys = (event: KeyboardEvent) => {
    if (!isAttributeMenuOpen) {
      return;
    }
    if (
      attributeMenuRef.current?.contains(event.target as Node) ||
      attributeToggleRef.current?.contains(event.target as Node)
    ) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
        attributeToggleRef.current?.focus();
      }
    }
  };

  const handleAttributeClickOutside = (event: MouseEvent) => {
    if (
      isAttributeMenuOpen &&
      !attributeMenuRef.current?.contains(event.target as Node)
    ) {
      setIsAttributeMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleAttribueMenuKeys);
    window.addEventListener('click', handleAttributeClickOutside);
    return () => {
      window.removeEventListener('keydown', handleAttribueMenuKeys);
      window.removeEventListener('click', handleAttributeClickOutside);
    };
  }, [isAttributeMenuOpen, attributeMenuRef]);

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (attributeMenuRef.current) {
        const firstElement = attributeMenuRef.current.querySelector(
          'li > button:not(:disabled)'
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const attributeToggle = (
    <MenuToggle
      ref={attributeToggleRef}
      onClick={onAttributeToggleClick}
      isExpanded={isAttributeMenuOpen}
      icon={<FilterIcon />}
    >
      {activeAttributeMenu}
    </MenuToggle>
  );
  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        setActiveAttributeMenu(
          itemId?.toString() as 'Name' | 'Release' | 'Date'
        );
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Name">Name</MenuItem>
          <MenuItem itemId="Release">Release</MenuItem>
          <MenuItem itemId="Date">Date</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const attributeDropdown = (
    <div ref={attributeContainerRef}>
      <Popper
        trigger={attributeToggle}
        triggerRef={attributeToggleRef}
        popper={attributeMenu}
        popperRef={attributeMenuRef}
        appendTo={attributeContainerRef.current || undefined}
        isVisible={isAttributeMenuOpen}
      />
    </div>
  );

  // Set up pagination and toolbar
  const toolbarPagination = (
    <Pagination
      titles={{ paginationAriaLabel: 'Attribute search pagination' }}
      itemCount={data.length}
      perPage={10}
      page={1}
      widgetId="attribute-search-mock-pagination"
      isCompact
    />
  );

  const toolbar = (
    <Toolbar
      id="attribute-search-filter-toolbar"
      clearAllFilters={() => {
        setSearchValue('');
        setReleaseSelection('');
        setDateSelections([]);
      }}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
            <ToolbarFilter
              chips={searchValue !== '' ? [searchValue] : ([] as string[])}
              deleteChip={() => setSearchValue('')}
              deleteChipGroup={() => setSearchValue('')}
              categoryName="Name"
              showToolbarItem={activeAttributeMenu === 'Name'}
            >
              {searchInput}
            </ToolbarFilter>
            <ToolbarFilter
              chips={
                releaseSelection !== '' ? [releaseSelection] : ([] as string[])
              }
              deleteChip={() => setReleaseSelection('')}
              deleteChipGroup={() => setReleaseSelection('')}
              categoryName="Release"
              showToolbarItem={activeAttributeMenu === 'Release'}
            >
              {releaseSelect}
            </ToolbarFilter>
            <ToolbarFilter
              chips={dateSelections}
              deleteChip={(category, chip) =>
                onLocationMenuSelect(undefined, chip as string)
              }
              deleteChipGroup={() => setDateSelections([])}
              categoryName="Date"
              showToolbarItem={activeAttributeMenu === 'Date'}
            >
              {locationSelect}
            </ToolbarFilter>
          </ToolbarGroup>
        </ToolbarToggleGroup>
        <ToolbarItem>
          {/* TODO: Create separate component, maybe reuse the togglegroup from released tab */}
          <ToggleGroup>
            <ToggleGroupItem text="Relevant Only" buttonId="toggle1" />
            <ToggleGroupItem text="All" buttonId="toggle2" />
          </ToggleGroup>
        </ToolbarItem>
        <ToolbarItem variant="pagination">{toolbarPagination}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const emptyState = (
    <EmptyState>
      <EmptyStateHeader
        headingLevel="h4"
        titleText="No results found"
        icon={<EmptyStateIcon icon={SearchIcon} />}
      />
      <EmptyStateBody>
        No results match the filter criteria. Clear all filters and try again.
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            variant="link"
            onClick={() => {
              setSearchValue('');
              setReleaseSelection('');
              setDateSelections([]);
            }}
          >
            Clear all filters
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );

  return (
    <React.Fragment>
      {toolbar}
      <Table aria-label="Selectable table">
        <Thead>
          <Tr>
            <Th width={10}>{columnNames.name}</Th>
            <Th width={10}>{columnNames.release}</Th>
            <Th width={10}>{columnNames.date}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredRepos.length > 0 &&
            filteredRepos.map((repo) => (
              <Tr key={`${repo.name}-${repo.release}-${repo.date}`}>
                <Td dataLabel={columnNames.name} modifier="truncate">
                  {repo.name}
                </Td>
                <Td dataLabel={columnNames.release} modifier="truncate">
                  {repo.release}
                </Td>
                <Td dataLabel={columnNames.date} modifier="truncate">
                  {repo.date}
                </Td>
              </Tr>
            ))}
          {filteredRepos.length === 0 && (
            <Tr>
              <Td colSpan={8}>
                <Bullseye>{emptyState}</Bullseye>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
      {/* Bottom Pagination */}
      <Pagination
        variant={PaginationVariant.bottom}
        titles={{ paginationAriaLabel: 'Attribute search pagination' }}
        itemCount={data.length}
        perPage={10}
        page={1}
        widgetId="pagination-options-menu-bottom"
        isCompact
      />
    </React.Fragment>
  );
};

export default UpcomingTable;
