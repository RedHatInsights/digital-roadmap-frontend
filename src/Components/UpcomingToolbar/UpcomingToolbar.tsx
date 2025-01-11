// import "@patternfly/react-core/dist/styles/base.css";
// import { Record, columnNames } from '../Upcoming/mock_data';


// import React, { useState } from "react";
// import {
//   Badge,
//   Button,
//   EmptyState,
//   EmptyStateActions,
//   EmptyStateBody,
//   EmptyStateFooter,
//   EmptyStateHeader,
//   EmptyStateIcon,
//   Menu,
//   MenuContent,
//   MenuItem,
//   MenuList,
//   MenuToggle,
//   Pagination,
//   Popper,
//   SearchInput,
//   ToggleGroup,
//   ToggleGroupItem,
//   Toolbar,
//   ToolbarContent,
//   ToolbarFilter,
//   ToolbarGroup,
//   ToolbarItem,
//   ToolbarToggleGroup,
// } from "@patternfly/react-core";


// interface UpcomingToolbarProps {
//     data: Record[];
//     columnNames: {
//       name: string;
//       type: string;
//       release: string;
//       date: string;
//     };
//     details?: {
//       summary: string;
//       potentiallyAffectedSystems: number;
//       trainingTicket: string;
//       dateAdded: string;
//       lastModified: string;
//       detailFormat: 0 | 1 | 2 | 3;
//     };
//   }

// export const UpcomingToolbar: React.FunctionComponent<UpcomingToolbarProps> = (
// props
// ) => {

//       // Set up repo filtering
//   const { data, columnNames } = props;
//   const [searchValue, setSearchValue] = useState('');
//   const [typeSelections, setTypeSelections] = useState<string[]>([]);
//   const [dateSelection, setDateSelection] = useState('');
//   const [releaseSelections, setReleaseSelections] = useState<string[]>([]);


//   const onSearchChange = (value: string) => {
//     setSearchValue(value);
//   };

//   const onFilter = (repo: Record) => {
//     // Search name with search value
//     let searchValueInput: RegExp;
//     try {
//       searchValueInput = new RegExp(searchValue, 'i');
//     } catch (err) {
//       searchValueInput = new RegExp(
//         searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
//         'i'
//       );
//     }
//     const matchesNameValue = repo.name.search(searchValueInput) >= 0;

//     // Search release with release selections
//     const matchesReleaseValue = releaseSelections.includes(repo.release);

//     // Search type with type selections
//     const matchesTypeValue = typeSelections.includes(repo.type);

//     // Search date with date selection
//     const matchesDateValue = 
//       repo.date.toLowerCase() === dateSelection.toLowerCase();

//     return (
//       (searchValue === '' || matchesNameValue) &&
//       (releaseSelections.length === 0 || matchesReleaseValue) &&
//       (typeSelections.length === 0 || matchesTypeValue) &&
//       (dateSelection === '' || matchesDateValue) 
//     );
//   };
//   const filteredRepos = data.filter(onFilter);

//   // Set up name search input
//   const searchInput = (
//     <SearchInput
//       placeholder="Filter by name"
//       value={searchValue}
//       onChange={(_event, value) => onSearchChange(value)}
//       onClear={() => onSearchChange('')}
//     />
//   );

//   // Set up release checkbox select
//   const [isReleaseMenuOpen, setIsReleaseMenuOpen] =
//     useState<boolean>(false);
//   const releaseToggleRef = React.useRef<HTMLButtonElement>(null);
//   const releaseMenuRef = React.useRef<HTMLDivElement>(null);
//   const releaseContainerRef = React.useRef<HTMLDivElement>(null);

//   const handleReleaseMenuKeys = (event: KeyboardEvent) => {
//     if (
//       isReleaseMenuOpen &&
//       releaseMenuRef.current?.contains(event.target as Node)
//     ) {
//       if (event.key === 'Escape' || event.key === 'Tab') {
//         setIsReleaseMenuOpen(!isReleaseMenuOpen);
//         releaseToggleRef.current?.focus();
//       }
//     }
//   };
  
//   const handleReleaseClickOutside = (event: MouseEvent) => {
//     if (
//       isReleaseMenuOpen &&
//       !releaseMenuRef.current?.contains(event.target as Node)
//     ) {
//       setIsReleaseMenuOpen(false);
//     }
//   };

//   useEffect(() => {
//     window.addEventListener('keydown', handleReleaseMenuKeys);
//     window.addEventListener('click', handleReleaseClickOutside);
//     return () => {
//       window.removeEventListener('keydown', handleReleaseMenuKeys);
//       window.removeEventListener('click', handleReleaseClickOutside);
//     };
//   }, [isReleaseMenuOpen, releaseMenuRef]);

//   const onReleaseToggleClick = (ev: React.MouseEvent) => {
//     ev.stopPropagation(); // Stop handleClickOutside from handling
//     setTimeout(() => {
//       if (releaseMenuRef.current) {
//         const firstElement = releaseMenuRef.current.querySelector(
//           'li > button:not(:disabled)'
//         );
//         firstElement && (firstElement as HTMLElement).focus();
//       }
//     }, 0);
//     setIsReleaseMenuOpen(!isReleaseMenuOpen);
//   };

//   function onReleaseSelect(
//     event: React.MouseEvent | undefined,
//     releaseId: string | number | undefined
//   ) {
//     if (typeof releaseId === 'undefined') {
//       return;
//     }
    
//     const releaseStr = releaseId.toString();

//     setReleaseSelections(
//       releaseSelections.includes(releaseStr)
//         ? releaseSelections.filter((selection) => selection !== releaseStr)
//         : [releaseStr, ...releaseSelections]
//     );
 
//   }

//   const releaseToggle = (
//     <MenuToggle
//       ref={releaseToggleRef}
//       onClick={onReleaseToggleClick}
//       isExpanded={isReleaseMenuOpen}
//       {...(releaseSelections.length > 0 && {
//         badge: <Badge isRead>{releaseSelections.length}</Badge>,
//       })}
//       style={
//         {
//           width: '200px',
//         } as React.CSSProperties
//       }
//     >
//       Filter by release
//     </MenuToggle>
//   );

//   const releaseUniqueOptions = Array.from(
//     new Set(data.map((repo) => repo.release))
//   ).map((release) => ({
//     release: release,
//   }));

//   const releaseMenu = (
//     <Menu
//       ref={releaseMenuRef}
//       id="attribute-search-status-menu"
//       onSelect={onReleaseSelect}
//       selected={releaseSelections}
//     >
//       <MenuContent>
//         <MenuList>
//           {releaseUniqueOptions.map((option) => (
//             <MenuItem
//               hasCheckbox
//               key={option.release}
//               isSelected={releaseSelections.includes(option.release)}
//               itemId={option.release}
//             >
//               {option.release}
//             </MenuItem>
//           ))}
//         </MenuList>
//       </MenuContent>
//     </Menu>
//   );

//   const releaseSelect = (
//     <div ref={releaseContainerRef}>
//       <Popper
//         trigger={releaseToggle}
//         triggerRef={releaseToggleRef}
//         popper={releaseMenu}
//         popperRef={releaseMenuRef}
//         appendTo={releaseContainerRef.current || undefined}
//         isVisible={isReleaseMenuOpen}
//       />
//     </div>
//   );

//   // Set up date single select
//   const [isDateMenuOpen, setIsDateMenuOpen] =
//     useState<boolean>(false);
//   const dateToggleRef = React.useRef<HTMLButtonElement>(null);
//   const dateMenuRef = React.useRef<HTMLDivElement>(null);
//   const dateContainerRef = React.useRef<HTMLDivElement>(null);

//   const handleDateMenuKeys = (event: KeyboardEvent) => {
//   if (
//     isDateMenuOpen &&
//     dateMenuRef.current?.contains(event.target as Node)
//   ) {
//     if (event.key === 'Escape' || event.key === 'Tab') {
//       setIsDateMenuOpen(!isDateMenuOpen);
//       dateToggleRef.current?.focus();
//     }
//   }
//   };

//   const handleDateClickOutside = (event: MouseEvent) => {
//   if (
//     isDateMenuOpen &&
//     !dateMenuRef.current?.contains(event.target as Node)
//   ) {
//     setIsDateMenuOpen(false);
//   }
//   };

//   useEffect(() => {
//     window.addEventListener('keydown', handleDateMenuKeys);
//     window.addEventListener('click', handleDateClickOutside);
//     return () => {
//       window.removeEventListener('keydown', handleDateMenuKeys);
//       window.removeEventListener('click', handleDateClickOutside);
//     };
//   }, [isDateMenuOpen, dateMenuRef]);

//   const onDateToggleClick = (ev: React.MouseEvent) => {
//     ev.stopPropagation(); // Stop handleClickOutside from handling
//     setTimeout(() => {
//       if (dateMenuRef.current) {
//         const firstElement = dateMenuRef.current.querySelector(
//           'li > button:not(:disabled)'
//         );
//         firstElement && (firstElement as HTMLElement).focus();
//       }
//     }, 0);
//     setIsDateMenuOpen(!isDateMenuOpen);
//   };

//   function onDateSelect(
//     event: React.MouseEvent | undefined,
//     itemId: string | number | undefined
//   ) {
//     if (typeof itemId === 'undefined') {
//       return;
//     }

//     setDateSelection(itemId.toString());
//     setIsDateMenuOpen(!isDateMenuOpen);
//   }

//   const dateToggle = (
//     <MenuToggle
//       ref={dateToggleRef}
//       onClick={onDateToggleClick}
//       isExpanded={isDateMenuOpen}
//       style={
//         {
//           width: '200px',
//         } as React.CSSProperties
//       }
//     >
//       Filter by date
//     </MenuToggle>
//   );

//   const dateUniqueOptions = Array.from(
//     new Set(data.map((repo) => repo.date))
//   ).map((date) => ({
//     date: date,
//   }));

//   const dateMenu = (
//     <Menu
//       ref={dateMenuRef}
//       id="attribute-search-status-menu"
//       onSelect={onDateSelect}
//       selected={dateSelection}
//     >
//       <MenuContent>
//         <MenuList>
//           {dateUniqueOptions.map((option) => (
//             <MenuItem
//               key={option.date}
//               isSelected={dateSelection === option.date}
//               itemId={option.date}
//             >
//               {option.date}
//             </MenuItem>
//           ))}
//         </MenuList>
//       </MenuContent>
//     </Menu>
//   );

//   const dateSelect = (
//     <div ref={dateContainerRef}>
//       <Popper
//         trigger={dateToggle}
//         triggerRef={dateToggleRef}
//         popper={dateMenu}
//         popperRef={dateMenuRef}
//         appendTo={dateContainerRef.current || undefined}
//         isVisible={isDateMenuOpen}
//       />
//     </div>
//   );


//   // Set up type checkbox select

//   const [isTypeMenuOpen, setIsTypeMenuOpen] =
//     useState<boolean>(false);
//   const typeToggleRef = React.useRef<HTMLButtonElement>(null);
//   const typeMenuRef = React.useRef<HTMLDivElement>(null);
//   const typeContainerRef = React.useRef<HTMLDivElement>(null);

//   const handleTypeMenuKeys = (event: KeyboardEvent) => {
//     if (
//       isTypeMenuOpen &&
//       typeMenuRef.current?.contains(event.target as Node)
//     ) {
//       if (event.key === 'Escape' || event.key === 'Tab') {
//         setIsTypeMenuOpen(!isTypeMenuOpen);
//         typeToggleRef.current?.focus();
//       }
//     }
//   };

//   const handleTypeClickOutside = (event: MouseEvent) => {
//     if (
//       isTypeMenuOpen &&
//       !typeMenuRef.current?.contains(event.target as Node)
//     ) {
//       setIsTypeMenuOpen(false);
//     }
//   };

//   useEffect(() => {
//     window.addEventListener('keydown', handleTypeMenuKeys);
//     window.addEventListener('click', handleTypeClickOutside);
//     return () => {
//       window.removeEventListener('keydown', handleTypeMenuKeys);
//       window.removeEventListener('click', handleTypeClickOutside);
//     };
//   }, [isTypeMenuOpen, typeMenuRef]);

//   const onTypeMenuToggleClick = (ev: React.MouseEvent) => {
//     ev.stopPropagation(); // Stop handleClickOutside from handling
//     setTimeout(() => {
//       if (typeMenuRef.current) {
//         const firstElement = typeMenuRef.current.querySelector(
//           'li > button:not(:disabled)'
//         );
//         firstElement && (firstElement as HTMLElement).focus();
//       }
//     }, 0);
//     setIsTypeMenuOpen(!isTypeMenuOpen);
//   };

//   function onTypeMenuSelect(
//     event: React.MouseEvent | undefined,
//     typeId: string | number | undefined
//   ) {
//     if (typeof typeId === 'undefined') {
//       return;
//     }

//     const typeStr = typeId.toString();

//     setTypeSelections(
//       typeSelections.includes(typeStr)
//         ? typeSelections.filter((selection) => selection !== typeStr)
//         : [typeStr, ...typeSelections]
//     );
//   }

//   const typeToggle = (
//     <MenuToggle
//       ref={typeToggleRef}
//       onClick={onTypeMenuToggleClick}
//       isExpanded={isTypeMenuOpen}
//       {...(typeSelections.length > 0 && {
//         badge: <Badge isRead>{typeSelections.length}</Badge>,
//       })}
//       style={
//         {
//           width: '200px',
//         } as React.CSSProperties
//       }
//     >
//       Filter by type
//     </MenuToggle>
//   );

//   const typeUniqueOptions = Array.from(
//     new Set(data.map((repo) => repo.type))
//   ).map((type) => ({
//     type: type,
//   }));

//   const typeMenu = (
//     <Menu
//       ref={typeMenuRef}
//       id="attribute-search-type-menu"
//       onSelect={onTypeMenuSelect}
//       selected={typeSelections}
//     >
//       <MenuContent>
//         <MenuList>
//           {typeUniqueOptions.map((option) => (
//             <MenuItem
//               hasCheckbox
//               key={option.type}
//               isSelected={typeSelections.includes(option.type)}
//               itemId={option.type}
//             >
//               {option.type}
//             </MenuItem>
//           ))}
//         </MenuList>
//       </MenuContent>
//     </Menu>
//   );

//   const typeSelect = (
//     <div ref={typeContainerRef}>
//       <Popper
//         trigger={typeToggle}
//         triggerRef={typeToggleRef}
//         popper={typeMenu}
//         popperRef={typeMenuRef}
//         appendTo={typeContainerRef.current || undefined}
//         isVisible={isTypeMenuOpen}
//       />
//     </div>
//   );


//   // Set up attribute selector
//   const [activeAttributeMenu, setActiveAttributeMenu] = useState<
//     'Name' | 'Type' | 'Release' | 'Date'
//   >('Name');
//   const [isAttributeMenuOpen, setIsAttributeMenuOpen] = useState(false);
//   const attributeToggleRef = React.useRef<HTMLButtonElement>(null);
//   const attributeMenuRef = React.useRef<HTMLDivElement>(null);
//   const attributeContainerRef = React.useRef<HTMLDivElement>(null);

//   const handleAttribueMenuKeys = (event: KeyboardEvent) => {
//     if (!isAttributeMenuOpen) {
//       return;
//     }
//     if (
//       attributeMenuRef.current?.contains(event.target as Node) ||
//       attributeToggleRef.current?.contains(event.target as Node)
//     ) {
//       if (event.key === 'Escape' || event.key === 'Tab') {
//         setIsAttributeMenuOpen(!isAttributeMenuOpen);
//         attributeToggleRef.current?.focus();
//       }
//     }
//   };

//   const handleAttributeClickOutside = (event: MouseEvent) => {
//     if (
//       isAttributeMenuOpen &&
//       !attributeMenuRef.current?.contains(event.target as Node)
//     ) {
//       setIsAttributeMenuOpen(false);
//     }
//   };

//   useEffect(() => {
//     window.addEventListener('keydown', handleAttribueMenuKeys);
//     window.addEventListener('click', handleAttributeClickOutside);
//     return () => {
//       window.removeEventListener('keydown', handleAttribueMenuKeys);
//       window.removeEventListener('click', handleAttributeClickOutside);
//     };
//   }, [isAttributeMenuOpen, attributeMenuRef]);

//   const onAttributeToggleClick = (ev: React.MouseEvent) => {
//     ev.stopPropagation(); // Stop handleClickOutside from handling
//     setTimeout(() => {
//       if (attributeMenuRef.current) {
//         const firstElement = attributeMenuRef.current.querySelector(
//           'li > button:not(:disabled)'
//         );
//         firstElement && (firstElement as HTMLElement).focus();
//       }
//     }, 0);
//     setIsAttributeMenuOpen(!isAttributeMenuOpen);
//   };

//   const attributeToggle = (
//     <MenuToggle
//       ref={attributeToggleRef}
//       onClick={onAttributeToggleClick}
//       isExpanded={isAttributeMenuOpen}
//       icon={<FilterIcon />}
//     >
//       {activeAttributeMenu}
//     </MenuToggle>
//   );
//   const attributeMenu = (
//     <Menu
//       ref={attributeMenuRef}
//       onSelect={(_ev, itemId) => {
//         setActiveAttributeMenu(
//           itemId?.toString() as 'Name' | 'Type' | 'Release' | 'Date'
//         );
//         setIsAttributeMenuOpen(!isAttributeMenuOpen);
//       }}
//     >
//       <MenuContent>
//         <MenuList>
//           <MenuItem itemId="Name">Name</MenuItem>
//           <MenuItem itemId="Type">Type</MenuItem>
//           <MenuItem itemId="Release">Release</MenuItem>
//           <MenuItem itemId="Date">Date</MenuItem>
//         </MenuList>
//       </MenuContent>
//     </Menu>
//   );

//   const attributeDropdown = (
//     <div ref={attributeContainerRef}>
//       <Popper
//         trigger={attributeToggle}
//         triggerRef={attributeToggleRef}
//         popper={attributeMenu}
//         popperRef={attributeMenuRef}
//         appendTo={attributeContainerRef.current || undefined}
//         isVisible={isAttributeMenuOpen}
//       />
//     </div>
//   );

//   // Set up pagination and toolbar
//   const toolbarPagination = (
//     <Pagination
//       titles={{ paginationAriaLabel: 'Attribute search pagination' }}
//       itemCount={data.length}
//       perPage={10}
//       page={1}
//       widgetId="attribute-search-mock-pagination"
//       isCompact
//     />
//   );

//   const toolbar = (
//     <Toolbar
//       id="attribute-search-filter-toolbar"
//       clearAllFilters={() => {
//         setSearchValue('');
//         setReleaseSelections([]);
//         setTypeSelections([]);
//         setDateSelection('');
//       }}
//     >
//       <ToolbarContent>
//         <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
//           <ToolbarGroup variant="filter-group">
//             <ToolbarItem>{attributeDropdown}</ToolbarItem>
//             <ToolbarFilter
//               chips={searchValue !== '' ? [searchValue] : ([] as string[])}
//               deleteChip={() => setSearchValue('')}
//               deleteChipGroup={() => setSearchValue('')}
//               categoryName="Name"
//               showToolbarItem={activeAttributeMenu === 'Name'}
//             >
//               {searchInput}
//             </ToolbarFilter>
//             <ToolbarFilter
//               chips={typeSelections}
//               deleteChip={(category, chip) =>
//                 onTypeMenuSelect(undefined, chip as string)
//               }
//               deleteChipGroup={() => setTypeSelections([])}
//               categoryName="Type"
//               showToolbarItem={activeAttributeMenu === 'Type'}
//             >
//               {typeSelect}
//             </ToolbarFilter>
//             <ToolbarFilter  
//               chips={releaseSelections}
//               deleteChip={(category, chip) =>
//                 onReleaseSelect(undefined, chip as string)
//               }
//               deleteChipGroup={() => setReleaseSelections([])}
//               categoryName="Release"
//               showToolbarItem={activeAttributeMenu === 'Release'}
//             >
//               {releaseSelect}
//             </ToolbarFilter>
//             <ToolbarFilter
//               chips={
//                 dateSelection !== '' ? [dateSelection] : ([] as string[])
//               }
//               deleteChip={() => setDateSelection('')}
//               deleteChipGroup={() => setDateSelection('')}
//               categoryName="Date"
//               showToolbarItem={activeAttributeMenu === 'Date'}  
//             >
//               {dateSelect}
//             </ToolbarFilter>
//           </ToolbarGroup>
//         </ToolbarToggleGroup>
//         <ToolbarItem>
//           {/* TODO: Create separate component, maybe reuse the togglegroup from released tab */}
//           <ToggleGroup>
//             <ToggleGroupItem text="Relevant Only" buttonId="toggle1" />
//             <ToggleGroupItem text="All" buttonId="toggle2" />
//           </ToggleGroup>
//         </ToolbarItem>
//         <ToolbarItem variant="pagination">{toolbarPagination}</ToolbarItem>
//       </ToolbarContent>
//     </Toolbar>
//   );

//   const emptyState = (
//     <EmptyState>
//       <EmptyStateHeader
//         headingLevel="h4"
//         titleText="No results found"
//         icon={<EmptyStateIcon icon={SearchIcon} />}
//       />
//       <EmptyStateBody>
//         No results match the filter criteria. Clear all filters and try again.
//       </EmptyStateBody>
//       <EmptyStateFooter>
//         <EmptyStateActions>
//           <Button
//             variant="link"
//             onClick={() => {
//               setSearchValue('');
//               setTypeSelections([]);
//               setReleaseSelections([]);
//               setDateSelection('');
//             }}
//           >
//             Clear all filters
//           </Button>
//         </EmptyStateActions>
//       </EmptyStateFooter>
//     </EmptyState>
//   );  
// }