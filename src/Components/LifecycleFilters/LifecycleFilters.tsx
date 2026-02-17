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
  rhelVersionOptions: string[];
  initialRhelVersions?: string[];
  resetOnAppsSwitchKey?: number;
  disableInstalledOnly?: boolean;
}

const FIELD_OPTIONS = ['Name', 'Version'] as const;

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
  rhelVersionOptions,
  initialRhelVersions,
  resetOnAppsSwitchKey,
  disableInstalledOnly,
}: LifecycleFiltersProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const [selectedField, setSelectedField] = React.useState<(typeof FIELD_OPTIONS)[number]>('Name');
  const [isFieldOpen, setIsFieldOpen] = React.useState(false);

  const [isRhelSelectOpen, setIsRhelSelectOpen] = React.useState(false);

  const [selectedRhelVersions, setSelectedRhelVersions] = React.useState<string[]>([]);
  const hasInitializedFromParent = React.useRef(false);
  // Handle switching to "all" view when sort is set to "Systems"
  React.useEffect(() => {
    if (selectedViewFilter === 'all' && selectedChartSortBy === 'Systems') {
      // Default to the first available option when "Systems" becomes disabled
      updateChartSortValue('Retirement date', 'asc');
    }
  }, [selectedViewFilter, selectedChartSortBy, updateChartSortValue]);

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
    if (resetOnAppsSwitchKey === undefined) return;
    setNameFilter('');
    setSelectedRhelVersions([]);
    onRhelVersionsChange?.([]);
    setSelectedField('Name');
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
      setSelectedField(value as (typeof FIELD_OPTIONS)[number]);
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

  const handleClearAllFilters = () => {
    setNameFilter('');
    const none: string[] = [];
    setSelectedRhelVersions(none);
    onRhelVersionsChange?.(none);
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
            nameSearchInput={nameSearchInput}
            rhelVersionSelect={rhelVersionSelect}
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
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
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
