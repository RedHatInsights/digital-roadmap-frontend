import React from 'react';
import {
  Alert,
  Badge,
  Form,
  FormGroup,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ErrorObject } from '../../types/ErrorObject';
import LifecycleDropdown from '../FilterComponents/LifecycleDropdown';
import {
  DEFAULT_DROPDOWN_VALUE,
  RHEL_10_STREAMS_DROPDOWN_VALUE,
  RHEL_8_STREAMS_DROPDOWN_VALUE,
  RHEL_SYSTEMS_DROPDOWN_VALUE,
} from '../Lifecycle/filteringUtils';
import SystemsViewToolbar from './SystemsViewToolbar';
import AppStreamsViewToolbar from './AppStreamsViewToolbar';

interface LifecycleFiltersProps {
  nameFilter: string;
  setNameFilter: (name: string) => void;
  setError: (error: ErrorObject) => void;
  setIsLoading: (isLoading: boolean) => void;
  lifecycleDropdownValue: string;
  setLifecycleDropdownValue: (value: string) => void;
  onLifecycleDropdownSelect: (value: string) => void;
  selectedChartSortBy: string;
  updateChartSortValue: (name: string, order: string) => void;
  downloadCSV: () => void;
  selectedViewFilter: string;
  handleViewFilterChange: (filter: string) => void;
  noDataAvailable: boolean;
  onFilterFieldChange?: (field: 'Name' | 'Version') => void;
  onRhelVersionsChange?: (versions: string[]) => void;
  onStatusesChange?: (statuses: string[]) => void;
  rhelVersionOptions: string[];
  initialRhelVersions?: string[];
  initialStatuses?: string[];
  resetOnAppsSwitchKey?: number;
  disableInstalledOnly?: boolean;
}

const SYSTEM_FIELD_OPTIONS = ['Name', 'Version', 'Status'] as const;
const APP_FIELD_OPTIONS = ['Name', 'Status'] as const;

// App streams status display labels (shown in UI)
const ALL_APP_STATUS_OPTIONS = ['Supported', 'Support ends within 6 months', 'Retired', 'Upcoming release', 'Not installed'] as const;

// Systems status display labels (shown in UI)
const ALL_SYSTEM_STATUS_OPTIONS = ['Supported', 'Support ends within 3 months', 'Retired', 'Upcoming release', 'Not installed'] as const;

// Mapping from display labels to API data values
const STATUS_DISPLAY_TO_VALUE: Record<string, string> = {
  'Supported': 'Supported',
  'Support ends within 6 months': 'Near retirement',
  'Support ends within 3 months': 'Near retirement',
  'Retired': 'Retired',
  'Upcoming release': 'Upcoming release',
  'Not installed': 'Not installed',
};

// Mapping from API data values to display labels (for app streams)
const STATUS_VALUE_TO_APP_DISPLAY: Record<string, string> = {
  'Supported': 'Supported',
  'Near retirement': 'Support ends within 6 months',
  'Retired': 'Retired',
  'Upcoming release': 'Upcoming release',
  'Not installed': 'Not installed',
};

// Mapping from API data values to display labels (for systems)
const STATUS_VALUE_TO_SYSTEM_DISPLAY: Record<string, string> = {
  'Supported': 'Supported',
  'Near retirement': 'Support ends within 3 months',
  'Retired': 'Retired',
  'Upcoming release': 'Upcoming release',
  'Not installed': 'Not installed',
};

export const LifecycleFilters: React.FunctionComponent<LifecycleFiltersProps> = ({
  nameFilter,
  setNameFilter,
  lifecycleDropdownValue,
  setLifecycleDropdownValue,
  onLifecycleDropdownSelect,
  selectedChartSortBy,
  updateChartSortValue,
  downloadCSV,
  selectedViewFilter,
  handleViewFilterChange,
  noDataAvailable,
  onFilterFieldChange,
  onRhelVersionsChange,
  onStatusesChange,
  rhelVersionOptions,
  initialRhelVersions,
  initialStatuses,
  resetOnAppsSwitchKey,
  disableInstalledOnly,
}: LifecycleFiltersProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const [selectedField, setSelectedField] = React.useState<(typeof SYSTEM_FIELD_OPTIONS)[number]>('Name');
  const [isFieldOpen, setIsFieldOpen] = React.useState(false);

  const [isRhelSelectOpen, setIsRhelSelectOpen] = React.useState(false);

  const [selectedRhelVersions, setSelectedRhelVersions] = React.useState<string[]>([]);
  const hasInitializedFromParent = React.useRef(false);

  // App streams filter states
  const [selectedAppField, setSelectedAppField] = React.useState<(typeof APP_FIELD_OPTIONS)[number]>('Name');
  const [isAppFieldOpen, setIsAppFieldOpen] = React.useState(false);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
  const [isStatusSelectOpen, setIsStatusSelectOpen] = React.useState(false);

  // Compute available status options based on view filter and lifecycle type
  const statusOptions = React.useMemo(() => {
    const isSystemsView = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;
    const baseOptions = isSystemsView ? ALL_SYSTEM_STATUS_OPTIONS : ALL_APP_STATUS_OPTIONS;

    // "Not installed" should not be available in "all" view
    if (selectedViewFilter === 'all') {
      return baseOptions.filter((status) => status !== 'Not installed');
    }
    return Array.from(baseOptions);
  }, [selectedViewFilter, lifecycleDropdownValue]);

  // Handle switching to "all" view when sort is set to "Systems"
  React.useEffect(() => {
    if (selectedViewFilter === 'all' && selectedChartSortBy === 'Systems') {
      // Default to the first available option when "Systems" becomes disabled
      updateChartSortValue('Retirement date', 'asc');
    }
  }, [selectedViewFilter, selectedChartSortBy, updateChartSortValue]);

  // Clear "Not installed" status when switching to "all" view
  const prevViewFilter = React.useRef(selectedViewFilter);
  React.useEffect(() => {
    if (prevViewFilter.current !== 'all' && selectedViewFilter === 'all' && selectedStatuses.includes('Not installed')) {
      const filtered = selectedStatuses.filter((s) => s !== 'Not installed');
      setSelectedStatuses(filtered);
      // Convert display labels to API values before passing to parent
      const apiValues = filtered.map((displayLabel) => STATUS_DISPLAY_TO_VALUE[displayLabel] || displayLabel);
      onStatusesChange?.(apiValues);
    }
    prevViewFilter.current = selectedViewFilter;
  }, [selectedViewFilter]);

  // When filter select options changes
  React.useEffect(() => {
    setSelectedRhelVersions((prev) => {
      const intersection = prev.filter((v) => rhelVersionOptions.includes(v));
      const next = intersection.length > 0 ? intersection : [];
      if (hasInitializedFromParent.current && JSON.stringify(prev) !== JSON.stringify(next)) {
        onRhelVersionsChange?.(next);
      }
      return next;
    });
  }, [rhelVersionOptions]);

  React.useEffect(() => {
    if (!initialRhelVersions) return;
    const valid = initialRhelVersions.filter((v) => rhelVersionOptions.includes(v));
    setSelectedRhelVersions(valid);
    hasInitializedFromParent.current = true;
  }, [initialRhelVersions, rhelVersionOptions]);

  React.useEffect(() => {
    if (!initialStatuses) return;
    // Convert API values to display labels based on lifecycle type
    const isSystemsView = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;
    const mapping = isSystemsView ? STATUS_VALUE_TO_SYSTEM_DISPLAY : STATUS_VALUE_TO_APP_DISPLAY;
    const displayLabels = initialStatuses.map((apiValue) => mapping[apiValue] || apiValue);
    setSelectedStatuses(displayLabels);
  }, [initialStatuses, lifecycleDropdownValue]);

  React.useEffect(() => {
    if (resetOnAppsSwitchKey === undefined) return;
    setNameFilter('');
    setSelectedRhelVersions([]);
    onRhelVersionsChange?.([]);
    setSelectedField('Name');
    setSelectedAppField('Name');
    setSelectedStatuses([]);
    onFilterFieldChange?.('Name');
  }, [resetOnAppsSwitchKey]);

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
      const defaultOrder =
        value === 'Retirement date'
          ? 'asc'
          : value === 'Systems'
          ? 'desc'
          : value === 'Name'
          ? 'asc'
          : value === 'Release version'
          ? 'desc'
          : 'desc';
      updateChartSortValue(value, defaultOrder);
    }
  };

  // Helper function to determine tooltip content based on lifecycleDropdownValue
  const getTooltipContent = (buttonId: string) => {
    const isRHEL = lifecycleDropdownValue === 'Red Hat Enterprise Linux';
    const isRHEL9AppStream = lifecycleDropdownValue === 'RHEL 9 Application Streams';
    const isRHEL8AppStream = lifecycleDropdownValue === 'RHEL 8 Application Streams';
    const isRHEL10AppStream = lifecycleDropdownValue === 'RHEL 10 Application Streams';

    if (buttonId === 'installed-and-related') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on or related to those systems.';
      } else if (isRHEL9AppStream) {
        return (
          'Add systems to Inventory to view only RHEL\u00A09 application streams ' +
          'installed on or related to those systems.'
        );
      } else if (isRHEL8AppStream) {
        return (
          'Add systems to Inventory to view only RHEL\u00A08 application streams ' +
          'installed on or related to those systems.'
        );
      } else if (isRHEL10AppStream) {
        return (
          'Add systems to Inventory to view only RHEL\u00A010 application streams ' +
          'installed on or related to those systems.'
        );
      }
    } else if (buttonId === 'installed-only') {
      if (isRHEL) {
        return 'Add systems to Inventory to view only RHEL releases installed on those systems.';
      } else if (isRHEL9AppStream) {
        return 'Add systems to Inventory to view only RHEL\u00A09 application streams installed on those systems.';
      } else if (isRHEL8AppStream) {
        return 'Add systems to Inventory to view only RHEL\u00A08 application streams installed on those systems.';
      } else if (isRHEL10AppStream) {
        return 'Add systems to Inventory to view only RHEL\u00A010 application streams installed on those systems.';
      }
    }
  };

  const onFieldToggle = () => setIsFieldOpen((prev) => !prev);
  const onFieldSelect = (_event?: React.MouseEvent, value?: string | number) => {
    if (typeof value === 'string') {
      setSelectedField(value as (typeof SYSTEM_FIELD_OPTIONS)[number]);
      onFilterFieldChange?.(value === 'Name' ? 'Name' : 'Version');
    }
    setIsFieldOpen(false);
  };

  // RHEL versions multi-select handlers (checkbox select)
  const onRhelSelect = (event?: React.MouseEvent, value?: string | number) => {
    if (value == null) return;
    const v = String(value);
    const checked = (event?.target as HTMLInputElement | undefined)?.checked ?? false;

    setSelectedRhelVersions((prev) => {
      const next = checked ? (prev.includes(v) ? prev : [...prev, v]) : prev.filter((x) => x !== v);
      onRhelVersionsChange?.(next);
      return next;
    });
  };

  // App streams field toggle handlers
  const onAppFieldToggle = () => setIsAppFieldOpen((prev) => !prev);
  const onAppFieldSelect = (_event?: React.MouseEvent, value?: string | number) => {
    if (typeof value === 'string') {
      setSelectedAppField(value as (typeof APP_FIELD_OPTIONS)[number]);
    }
    setIsAppFieldOpen(false);
  };

  // Status multi-select handlers (checkbox select)
  const onStatusSelect = (event?: React.MouseEvent, value?: string | number) => {
    if (value == null) return;
    const v = String(value);
    const checked = (event?.target as HTMLInputElement | undefined)?.checked ?? false;

    setSelectedStatuses((prev) => {
      const next = checked ? (prev.includes(v) ? prev : [...prev, v]) : prev.filter((x) => x !== v);
      // Convert display labels to API values before passing to parent
      const apiValues = next.map((displayLabel) => STATUS_DISPLAY_TO_VALUE[displayLabel] || displayLabel);
      onStatusesChange?.(apiValues);
      return next;
    });
  };

  const handleClearAllFilters = () => {
    setNameFilter('');
    const none: string[] = [];
    setSelectedRhelVersions(none);
    setSelectedStatuses(none);
    onRhelVersionsChange?.(none);
    onStatusesChange?.(none);
    onFilterFieldChange?.('Name');
  };

  const isSystemsView = lifecycleDropdownValue === RHEL_SYSTEMS_DROPDOWN_VALUE;

  // Define filter controls as variables to ensure they're always valid React elements
  const nameSearchInput = (
    <SearchInput
      placeholder="Filter by name"
      value={nameFilter}
      onChange={(_event, value) => setNameFilter(value)}
      onClear={() => setNameFilter('')}
      aria-label="Filter by name"
    />
  );

  const rhelVersionSelect = (
    <Select
      aria-label="RHEL version"
      isOpen={isRhelSelectOpen}
      onOpenChange={(open) => setIsRhelSelectOpen(open)}
      onSelect={onRhelSelect}
      selected={selectedRhelVersions}
      toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setIsRhelSelectOpen((p) => !p)} isExpanded={isRhelSelectOpen}>
          RHEL versions
          {selectedRhelVersions.length > 0 && <Badge isRead>{selectedRhelVersions.length}</Badge>}
        </MenuToggle>
      )}
      role="menu"
    >
      <SelectList>
        {rhelVersionOptions.map((opt) => (
          <SelectOption key={opt} value={opt} hasCheckbox isSelected={selectedRhelVersions.includes(opt)}>
            {opt}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );

  const statusSelect = (
    <Select
      aria-label="Status"
      isOpen={isStatusSelectOpen}
      onOpenChange={(open) => setIsStatusSelectOpen(open)}
      onSelect={onStatusSelect}
      selected={selectedStatuses}
      toggle={(toggleRef: React.Ref<HTMLDivElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setIsStatusSelectOpen((p) => !p)} isExpanded={isStatusSelectOpen}>
          Status
          {selectedStatuses.length > 0 && <Badge isRead>{selectedStatuses.length}</Badge>}
        </MenuToggle>
      )}
      role="menu"
    >
      <SelectList>
        {statusOptions.map((opt) => (
          <SelectOption key={opt} value={opt} hasCheckbox isSelected={selectedStatuses.includes(opt)}>
            {opt}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );

  return (
    <div className="drf-lifecycle__filters">
      <Toolbar className="drf-lifecycle__filters-toolbar" clearAllFilters={handleClearAllFilters}>
        <ToolbarGroup>
          <ToolbarItem>
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
          lifecycleDropdownValue === RHEL_8_STREAMS_DROPDOWN_VALUE ||
          lifecycleDropdownValue === RHEL_10_STREAMS_DROPDOWN_VALUE) && (
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

        {isSystemsView ? (
          <SystemsViewToolbar
            key={lifecycleDropdownValue}
            selectedField={selectedField}
            isFieldOpen={isFieldOpen}
            onFieldToggle={onFieldToggle}
            onFieldSelect={onFieldSelect}
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            selectedRhelVersions={selectedRhelVersions}
            setSelectedRhelVersions={setSelectedRhelVersions}
            onRhelVersionsChange={onRhelVersionsChange}
            isRhelSelectOpen={isRhelSelectOpen}
            setIsRhelSelectOpen={setIsRhelSelectOpen}
            onRhelSelect={onRhelSelect}
            rhelVersionOptions={rhelVersionOptions}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            onStatusesChange={(statuses) => {
              setSelectedStatuses(statuses);
              // Convert display labels to API values before passing to parent
              const apiValues = statuses.map((displayLabel) => STATUS_DISPLAY_TO_VALUE[displayLabel] || displayLabel);
              onStatusesChange?.(apiValues);
            }}
            isStatusSelectOpen={isStatusSelectOpen}
            setIsStatusSelectOpen={setIsStatusSelectOpen}
            onStatusSelect={onStatusSelect}
            statusOptions={statusOptions}
            nameSearchInput={nameSearchInput}
            rhelVersionSelect={rhelVersionSelect}
            statusSelect={statusSelect}
            selectedViewFilter={selectedViewFilter}
            handleItemClick={handleItemClick}
            noDataAvailable={noDataAvailable}
            getTooltipContent={getTooltipContent}
            selectedChartSortBy={selectedChartSortBy}
            isOpen={isOpen}
            onToggleClick={onToggleClick}
            onSelect={onSelect}
            setIsOpen={setIsOpen}
            downloadCSV={downloadCSV}
            disableInstalledOnly={disableInstalledOnly ?? false}
          />
        ) : (
          <AppStreamsViewToolbar
            key={lifecycleDropdownValue}
            selectedField={selectedAppField}
            isFieldOpen={isAppFieldOpen}
            onFieldToggle={onAppFieldToggle}
            onFieldSelect={onAppFieldSelect}
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            onStatusesChange={(statuses) => {
              setSelectedStatuses(statuses);
              // Convert display labels to API values before passing to parent
              const apiValues = statuses.map((displayLabel) => STATUS_DISPLAY_TO_VALUE[displayLabel] || displayLabel);
              onStatusesChange?.(apiValues);
            }}
            isStatusSelectOpen={isStatusSelectOpen}
            setIsStatusSelectOpen={setIsStatusSelectOpen}
            onStatusSelect={onStatusSelect}
            statusOptions={statusOptions}
            nameSearchInput={nameSearchInput}
            statusSelect={statusSelect}
            selectedViewFilter={selectedViewFilter}
            handleItemClick={handleItemClick}
            noDataAvailable={noDataAvailable}
            getTooltipContent={getTooltipContent}
            selectedChartSortBy={selectedChartSortBy}
            isOpen={isOpen}
            onToggleClick={onToggleClick}
            onSelect={onSelect}
            setIsOpen={setIsOpen}
            downloadCSV={downloadCSV}
            disableInstalledOnly={disableInstalledOnly ?? false}
          />
        )}
      </Toolbar>
      {selectedViewFilter === 'all' && !noDataAvailable && (
        <Alert
          variant="info"
          isInline
          isPlain
          title="Connected systems are not considered in this view"
          style={{ marginBottom: '32px' }}
        >
          <p>
            This chart differs from the other views, as the color-coding below applies to all releases and not just
            those installed on the systems in your inventory.
          </p>
        </Alert>
      )}
    </div>
  );
};

export default LifecycleFilters;
