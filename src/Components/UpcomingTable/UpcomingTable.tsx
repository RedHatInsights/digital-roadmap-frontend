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

interface Repository {
  name: string;
  threads: string;
  apps: string;
  workspaces: string;
  status: string;
  location: string;
}

// In real usage, this data would come from some external source like an API via props.
const repositories: Repository[] = [
  {
    name: 'US-Node 1',
    threads: '5',
    apps: '25',
    workspaces: '5',
    status: 'Stopped',
    location: 'Raleigh',
  },
  {
    name: 'US-Node 2',
    threads: '5',
    apps: '30',
    workspaces: '2',
    status: 'Down',
    location: 'Westford',
  },
  {
    name: 'US-Node 3',
    threads: '13',
    apps: '35',
    workspaces: '12',
    status: 'Degraded',
    location: 'Boston',
  },
  {
    name: 'US-Node 4',
    threads: '2',
    apps: '5',
    workspaces: '18',
    status: 'Needs Maintenance',
    location: 'Raleigh',
  },
  {
    name: 'US-Node 5',
    threads: '7',
    apps: '30',
    workspaces: '5',
    status: 'Running',
    location: 'Boston',
  },
  {
    name: 'US-Node 6',
    threads: '5',
    apps: '20',
    workspaces: '15',
    status: 'Stopped',
    location: 'Raleigh',
  },
  {
    name: 'CZ-Node 1',
    threads: '12',
    apps: '48',
    workspaces: '13',
    status: 'Down',
    location: 'Brno',
  },
  {
    name: 'CZ-Node 2',
    threads: '3',
    apps: '8',
    workspaces: '20',
    status: 'Running',
    location: 'Brno',
  },
  {
    name: 'CZ-Remote-Node 1',
    threads: '1',
    apps: '15',
    workspaces: '20',
    status: 'Down',
    location: 'Brno',
  },
  {
    name: 'Bangalore-Node 1',
    threads: '1',
    apps: '20',
    workspaces: '20',
    status: 'Running',
    location: 'Bangalore',
  },
];

const columnNames = {
  name: 'Servers',
  threads: 'Threads',
  apps: 'Applications',
  workspaces: 'Workspaces',
  status: 'Status',
  location: 'Location',
};

export const UpcomingTable: React.FunctionComponent = () => {
  // Set up repo filtering
  const [searchValue, setSearchValue] = React.useState('');
  const [locationSelections, setLocationSelections] = React.useState<string[]>(
    []
  );
  const [statusSelection, setStatusSelection] = React.useState('');

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilter = (repo: Repository) => {
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
    const matchesSearchValue = repo.name.search(searchValueInput) >= 0;

    // Search status with status selection
    const matchesStatusValue =
      repo.status.toLowerCase() === statusSelection.toLowerCase();

    // Search location with location selections
    const matchesLocationValue = locationSelections.includes(repo.location);

    return (
      (searchValue === '' || matchesSearchValue) &&
      (statusSelection === '' || matchesStatusValue) &&
      (locationSelections.length === 0 || matchesLocationValue)
    );
  };
  const filteredRepos = repositories.filter(onFilter);

  // Set up name search input
  const searchInput = (
    <SearchInput
      placeholder="Filter by server name"
      value={searchValue}
      onChange={(_event, value) => onSearchChange(value)}
      onClear={() => onSearchChange('')}
    />
  );

  // Set up status single select
  const [isStatusMenuOpen, setIsStatusMenuOpen] =
    React.useState<boolean>(false);
  const statusToggleRef = React.useRef<HTMLButtonElement>(null);
  const statusMenuRef = React.useRef<HTMLDivElement>(null);
  const statusContainerRef = React.useRef<HTMLDivElement>(null);

  const handleStatusMenuKeys = (event: KeyboardEvent) => {
    if (
      isStatusMenuOpen &&
      statusMenuRef.current?.contains(event.target as Node)
    ) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsStatusMenuOpen(!isStatusMenuOpen);
        statusToggleRef.current?.focus();
      }
    }
  };

  const handleStatusClickOutside = (event: MouseEvent) => {
    if (
      isStatusMenuOpen &&
      !statusMenuRef.current?.contains(event.target as Node)
    ) {
      setIsStatusMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleStatusMenuKeys);
    window.addEventListener('click', handleStatusClickOutside);
    return () => {
      window.removeEventListener('keydown', handleStatusMenuKeys);
      window.removeEventListener('click', handleStatusClickOutside);
    };
  }, [isStatusMenuOpen, statusMenuRef]);

  const onStatusToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (statusMenuRef.current) {
        const firstElement = statusMenuRef.current.querySelector(
          'li > button:not(:disabled)'
        );
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsStatusMenuOpen(!isStatusMenuOpen);
  };

  function onStatusSelect(
    event: React.MouseEvent | undefined,
    itemId: string | number | undefined
  ) {
    if (typeof itemId === 'undefined') {
      return;
    }

    setStatusSelection(itemId.toString());
    setIsStatusMenuOpen(!isStatusMenuOpen);
  }

  const statusToggle = (
    <MenuToggle
      ref={statusToggleRef}
      onClick={onStatusToggleClick}
      isExpanded={isStatusMenuOpen}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by status
    </MenuToggle>
  );

  const statusMenu = (
    <Menu
      ref={statusMenuRef}
      id="attribute-search-status-menu"
      onSelect={onStatusSelect}
      selected={statusSelection}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Degraded">Degraded</MenuItem>
          <MenuItem itemId="Down">Down</MenuItem>
          <MenuItem itemId="Needs maintenance">Needs maintenance</MenuItem>
          <MenuItem itemId="Running">Running</MenuItem>
          <MenuItem itemId="Stopped">Stopped</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const statusSelect = (
    <div ref={statusContainerRef}>
      <Popper
        trigger={statusToggle}
        triggerRef={statusToggleRef}
        popper={statusMenu}
        popperRef={statusMenuRef}
        appendTo={statusContainerRef.current || undefined}
        isVisible={isStatusMenuOpen}
      />
    </div>
  );

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

    setLocationSelections(
      locationSelections.includes(itemStr)
        ? locationSelections.filter((selection) => selection !== itemStr)
        : [itemStr, ...locationSelections]
    );
  }

  const locationToggle = (
    <MenuToggle
      ref={locationToggleRef}
      onClick={onLocationMenuToggleClick}
      isExpanded={isLocationMenuOpen}
      {...(locationSelections.length > 0 && {
        badge: <Badge isRead>{locationSelections.length}</Badge>,
      })}
      style={
        {
          width: '200px',
        } as React.CSSProperties
      }
    >
      Filter by location
    </MenuToggle>
  );

  const locationMenu = (
    <Menu
      ref={locationMenuRef}
      id="attribute-search-location-menu"
      onSelect={onLocationMenuSelect}
      selected={locationSelections}
    >
      <MenuContent>
        <MenuList>
          <MenuItem
            hasCheckbox
            isSelected={locationSelections.includes('Bangalore')}
            itemId="Bangalore"
          >
            Bangalore
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={locationSelections.includes('Boston')}
            itemId="Boston"
          >
            Boston
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={locationSelections.includes('Brno')}
            itemId="Brno"
          >
            Brno
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={locationSelections.includes('Raleigh')}
            itemId="Raleigh"
          >
            Raleigh
          </MenuItem>
          <MenuItem
            hasCheckbox
            isSelected={locationSelections.includes('Westford')}
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
    'Servers' | 'Status' | 'Location'
  >('Servers');
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
          itemId?.toString() as 'Servers' | 'Status' | 'Location'
        );
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Servers">Servers</MenuItem>
          <MenuItem itemId="Status">Status</MenuItem>
          <MenuItem itemId="Location">Location</MenuItem>
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
      itemCount={repositories.length}
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
        setStatusSelection('');
        setLocationSelections([]);
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
              showToolbarItem={activeAttributeMenu === 'Servers'}
            >
              {searchInput}
            </ToolbarFilter>
            <ToolbarFilter
              chips={
                statusSelection !== '' ? [statusSelection] : ([] as string[])
              }
              deleteChip={() => setStatusSelection('')}
              deleteChipGroup={() => setStatusSelection('')}
              categoryName="Status"
              showToolbarItem={activeAttributeMenu === 'Status'}
            >
              {statusSelect}
            </ToolbarFilter>
            <ToolbarFilter
              chips={locationSelections}
              deleteChip={(category, chip) =>
                onLocationMenuSelect(undefined, chip as string)
              }
              deleteChipGroup={() => setLocationSelections([])}
              categoryName="Location"
              showToolbarItem={activeAttributeMenu === 'Location'}
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
              setStatusSelection('');
              setLocationSelections([]);
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
            <Th width={20}>{columnNames.name}</Th>
            <Th width={10}>{columnNames.threads}</Th>
            <Th width={10}>{columnNames.apps}</Th>
            <Th width={10}>{columnNames.workspaces}</Th>
            <Th width={20}>{columnNames.status}</Th>
            <Th width={20}>{columnNames.location}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredRepos.length > 0 &&
            filteredRepos.map((repo) => (
              <Tr key={repo.name}>
                <Td dataLabel={columnNames.name} modifier="truncate">
                  {repo.name}
                </Td>
                <Td dataLabel={columnNames.threads} modifier="truncate">
                  {repo.threads}
                </Td>
                <Td dataLabel={columnNames.apps} modifier="truncate">
                  {repo.apps}
                </Td>
                <Td dataLabel={columnNames.workspaces} modifier="truncate">
                  {repo.workspaces}
                </Td>
                <Td dataLabel={columnNames.status} modifier="truncate">
                  {repo.status}
                </Td>
                <Td dataLabel={columnNames.location} modifier="truncate">
                  {repo.location}
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
        itemCount={repositories.length}
        perPage={10}
        page={1}
        widgetId="pagination-options-menu-bottom"
        isCompact
      />
    </React.Fragment>
  );
};

export default UpcomingTable;
