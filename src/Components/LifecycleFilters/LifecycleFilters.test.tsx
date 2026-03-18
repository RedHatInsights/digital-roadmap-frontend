import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LifecycleFilters from './LifecycleFilters';
import userEvent from '@testing-library/user-event';
import { act, within } from '@testing-library/react';
import { RHEL_SYSTEMS_DROPDOWN_VALUE } from '../Lifecycle/filteringUtils';

describe('LifecycleFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const rhelVersionOptions = ['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10'];
  it('renders correctly with no filter set', () => {
    render(
      <LifecycleFilters
        nameFilter=""
        setNameFilter={jest.fn()}
        setError={jest.fn()}
        setIsLoading={jest.fn()}
        lifecycleDropdownValue="Red Hat Enterprise Linux"
        setLifecycleDropdownValue={jest.fn()}
        onLifecycleDropdownSelect={jest.fn()}
        selectedChartSortBy="Retirement date"
        updateChartSortValue={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
        rhelVersionOptions={rhelVersionOptions}
      />
    );
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /Reset/i })).toBeFalsy();
    expect(screen.getByRole('button', { name: /Installed and related/i }));
    expect(screen.getByRole('button', { name: /Installed only/i }));
    expect(screen.getByRole('button', { name: /Red Hat Enterprise Linux/i }));
    expect(screen.getByRole('button', { name: /Retirement date/i }));
  });
  it('renders correctly with a filter set', () => {
    render(
      <LifecycleFilters
        nameFilter="RHEL 3.0"
        setNameFilter={jest.fn()}
        setError={jest.fn()}
        setIsLoading={jest.fn()}
        lifecycleDropdownValue="Red Hat Enterprise Linux"
        setLifecycleDropdownValue={jest.fn()}
        onLifecycleDropdownSelect={jest.fn()}
        selectedChartSortBy="Retirement date"
        updateChartSortValue={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
        rhelVersionOptions={rhelVersionOptions}
      />
    );
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toHaveValue('RHEL 3.0');
    // inline clear icon should be present when input has value
    expect(screen.getByRole('button', { name: /^Reset$/i })).toBeTruthy();
  });
  it('calls setNameFilter appropriately', async () => {
    const spy = jest.fn();
    render(
      <LifecycleFilters
        nameFilter="RHEL 3.0"
        setNameFilter={spy}
        setError={jest.fn()}
        setIsLoading={jest.fn()}
        lifecycleDropdownValue="Red Hat Enterprise Linux"
        setLifecycleDropdownValue={jest.fn()}
        onLifecycleDropdownSelect={jest.fn()}
        selectedChartSortBy="Retirement date"
        updateChartSortValue={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
        rhelVersionOptions={rhelVersionOptions}
      />
    );
    const nameFilter = screen.getByRole('textbox', { name: /Filter by name/i });
    await waitFor(() => userEvent.type(nameFilter, 'RHEL 3.0'));
    expect(spy).toHaveBeenCalledTimes(8);
  });
  it('can clear input correctly', async () => {
    const spy = jest.fn();
    render(
      <LifecycleFilters
        nameFilter="RHEL 3.0"
        setNameFilter={spy}
        setError={jest.fn()}
        setIsLoading={jest.fn()}
        lifecycleDropdownValue="Red Hat Enterprise Linux"
        setLifecycleDropdownValue={jest.fn()}
        onLifecycleDropdownSelect={jest.fn()}
        selectedChartSortBy="Retirement date"
        updateChartSortValue={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
        rhelVersionOptions={rhelVersionOptions}
      />
    );
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    await waitFor(() => userEvent.click(resetBtn));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('');
  });
});

// helper: open a PF Select/Menu by toggle button name or element and return the latest portal menu
const openMenuByButton = async (buttonNameOrElement: RegExp | string | HTMLElement) => {
  await act(async () => {
    if (typeof buttonNameOrElement === 'string' || buttonNameOrElement instanceof RegExp) {
      await userEvent.click(screen.getByRole('button', { name: buttonNameOrElement }));
    } else {
      await userEvent.click(buttonNameOrElement);
    }
  });
  // PF sometimes uses role=listbox, sometimes role=menu; take the last one (newest opened)
  const menus = (await screen.findAllByRole('listbox').catch(() => [])) as HTMLElement[];
  const fallbacks = (await screen.findAllByRole('menu').catch(() => [])) as HTMLElement[];
  const all = [...menus, ...fallbacks];
  if (all.length === 0) throw new Error('Menu/listbox not found after opening');
  return all[all.length - 1];
};

it('shows dynamic RHEL version options when in Systems view and Field=Version', async () => {
  const onRhelVersionsChange = jest.fn();

  render(
    <LifecycleFilters
      nameFilter=""
      setNameFilter={jest.fn()}
      setError={jest.fn()}
      setIsLoading={jest.fn()}
      lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
      setLifecycleDropdownValue={jest.fn()}
      onLifecycleDropdownSelect={jest.fn()}
      selectedChartSortBy="Retirement date"
      updateChartSortValue={jest.fn()}
      downloadCSV={jest.fn()}
      selectedViewFilter="installed-only"
      handleViewFilterChange={jest.fn()}
      noDataAvailable={false}
      rhelVersionOptions={['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10']}
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={jest.fn()}
    />
  );

  // Switch Field -> Version (open field select, click "Version")
  const fieldMenu = await openMenuByButton(/Name/i);
  await act(async () => {
    await userEvent.click(await within(fieldMenu).findByText(/^Version$/i));
  });

  // Open "RHEL versions" multiselect and assert dynamic options
  const versionsMenu = await openMenuByButton(/RHEL versions/i);
  for (const opt of ['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10']) {
    expect(await within(versionsMenu).findByText(opt)).toBeInTheDocument();
  }
});

it('syncs selection with new dynamic options (intersection or fallback to all) and emits change', async () => {
  const onRhelVersionsChange = jest.fn();

  const { rerender } = render(
    <LifecycleFilters
      nameFilter=""
      setNameFilter={jest.fn()}
      setError={jest.fn()}
      setIsLoading={jest.fn()}
      lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
      setLifecycleDropdownValue={jest.fn()}
      onLifecycleDropdownSelect={jest.fn()}
      selectedChartSortBy="Retirement date"
      updateChartSortValue={jest.fn()}
      downloadCSV={jest.fn()}
      selectedViewFilter="installed-only"
      handleViewFilterChange={jest.fn()}
      noDataAvailable={false}
      rhelVersionOptions={['RHEL 8', 'RHEL 9']}
      initialRhelVersions={['RHEL 8']}
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={jest.fn()}
    />
  );

  // Switch Field -> Version to initialize internal version selection
  const fieldMenu = await openMenuByButton(/Name/i);
  await act(async () => {
    await userEvent.click(await within(fieldMenu).findByText(/^Version$/i));
  });

  rerender(
    <LifecycleFilters
      nameFilter=""
      setNameFilter={jest.fn()}
      setError={jest.fn()}
      setIsLoading={jest.fn()}
      lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
      setLifecycleDropdownValue={jest.fn()}
      onLifecycleDropdownSelect={jest.fn()}
      selectedChartSortBy="Retirement date"
      updateChartSortValue={jest.fn()}
      downloadCSV={jest.fn()}
      selectedViewFilter="installed-only"
      handleViewFilterChange={jest.fn()}
      noDataAvailable={false}
      rhelVersionOptions={['RHEL 9', 'RHEL 11']}
      initialRhelVersions={['RHEL 8']}
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={jest.fn()}
    />
  );

  // Open versions menu and verify the new option appears
  const versionsMenu = await openMenuByButton(/RHEL versions/i);
  expect(await within(versionsMenu).findByText('RHEL 11')).toBeInTheDocument();

  await waitFor(() => expect(onRhelVersionsChange).toHaveBeenCalled());
});

it('keeps both Name keyword and Version selection effective when switching Field', async () => {
  const onRhelVersionsChange = jest.fn();
  const onFilterFieldChange = jest.fn();

  render(
    <LifecycleFilters
      nameFilter="RHEL 9"
      setNameFilter={jest.fn()}
      setError={jest.fn()}
      setIsLoading={jest.fn()}
      lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
      setLifecycleDropdownValue={jest.fn()}
      onLifecycleDropdownSelect={jest.fn()}
      selectedChartSortBy="Retirement date"
      updateChartSortValue={jest.fn()}
      downloadCSV={jest.fn()}
      selectedViewFilter="installed-only"
      handleViewFilterChange={jest.fn()}
      noDataAvailable={false}
      rhelVersionOptions={['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10']}
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={onFilterFieldChange}
    />
  );

  // Switch to Version field (disambiguate between MenuToggle "Name" and chip-group close button)
  const nameButtons = screen.getAllByRole('button', { name: /^Name$/i });
  const fieldToggle = nameButtons.find(
    (el) => el.classList.contains('pf-v6-c-menu-toggle') || el.classList.contains('pf-v5-c-menu-toggle')
  );
  if (!fieldToggle) throw new Error('Field toggle button (Name) not found');
  await userEvent.click(fieldToggle);

  // then choose "Version"
  await userEvent.click(await screen.findByRole('option', { name: 'Version' }));

  // Deselect one version to simulate user filter (scope to the portal menu)
  const versionsMenu = await openMenuByButton(/RHEL versions/i);
  const rhel8Option = await within(versionsMenu).findByText(/^RHEL 8$/i);
  await userEvent.click(rhel8Option);
  expect(onRhelVersionsChange).toHaveBeenCalled();

  // Switch back to Name (disambiguate multiple "Version" buttons)
  const versionButtons = screen.getAllByRole('button', { name: /^Version$/i });
  const fieldVersionToggle = versionButtons.find(
    (el) =>
      (el.classList.contains('pf-v6-c-menu-toggle') || el.classList.contains('pf-v5-c-menu-toggle')) &&
      el.textContent?.trim() === 'Version'
  );
  if (!fieldVersionToggle) throw new Error('Field toggle button (Version) not found');
  await userEvent.click(fieldVersionToggle);

  // Then choose "Name" from the field options
  await userEvent.click(await screen.findByRole('option', { name: /^Name$/i }));

  const calls = onRhelVersionsChange.mock.calls.map((args) => args[0]);
  const lastSelection = calls[calls.length - 1] as string[];
  expect(lastSelection).not.toEqual(['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10']);
});

// ============================================================================
// Status Filter Tests
// ============================================================================

describe('Status Filter Functionality', () => {
  const defaultProps = {
    nameFilter: '',
    setNameFilter: jest.fn(),
    setError: jest.fn(),
    setIsLoading: jest.fn(),
    lifecycleDropdownValue: 'RHEL 9 Application Streams',
    setLifecycleDropdownValue: jest.fn(),
    onLifecycleDropdownSelect: jest.fn(),
    selectedChartSortBy: 'Retirement date',
    updateChartSortValue: jest.fn(),
    downloadCSV: jest.fn(),
    selectedViewFilter: 'installed-only',
    handleViewFilterChange: jest.fn(),
    noDataAvailable: false,
    rhelVersionOptions: ['RHEL 8', 'RHEL 9'],
    onFilterFieldChange: jest.fn(),
    onRhelVersionsChange: jest.fn(),
    onStatusesChange: jest.fn(),
  };

  describe('App Streams Status Options', () => {
    it('should show "Support ends within 6 months" for app streams in installed view', async () => {
      render(<LifecycleFilters {...defaultProps} selectedViewFilter="installed-only" />);

      // Switch to Status field
      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      // Open Status multiselect - after switching fields, there are two "Status" buttons
      // We want the status filter toggle (second one)
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      // Should show app stream specific text
      expect(await within(statusMenu).findByText('Support ends within 6 months')).toBeInTheDocument();
      expect(within(statusMenu).queryByText('Support ends within 3 months')).not.toBeInTheDocument();
    });

    it('should include all 5 status options for app streams in installed views', async () => {
      render(<LifecycleFilters {...defaultProps} selectedViewFilter="installed-only" />);

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      // All 5 options should be present
      const expectedOptions = [
        'Supported',
        'Support ends within 6 months',
        'Retired',
        'Upcoming release',
        'Not installed',
      ];
      for (const option of expectedOptions) {
        expect(await within(statusMenu).findByText(option)).toBeInTheDocument();
      }
    });

    it('should exclude "Not installed" in "all" view for app streams', async () => {
      render(<LifecycleFilters {...defaultProps} selectedViewFilter="all" />);

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      // "Not installed" should not be present
      expect(within(statusMenu).queryByText('Not installed')).not.toBeInTheDocument();

      // Other 4 options should be present
      expect(await within(statusMenu).findByText('Supported')).toBeInTheDocument();
      expect(await within(statusMenu).findByText('Support ends within 6 months')).toBeInTheDocument();
      expect(await within(statusMenu).findByText('Retired')).toBeInTheDocument();
      expect(await within(statusMenu).findByText('Upcoming release')).toBeInTheDocument();
    });
  });

  describe('Systems Status Options', () => {
    it('should show "Support ends within 3 months" for RHEL systems', async () => {
      render(<LifecycleFilters {...defaultProps} lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE} />);

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      // Should show systems specific text
      expect(await within(statusMenu).findByText('Support ends within 3 months')).toBeInTheDocument();
      expect(within(statusMenu).queryByText('Support ends within 6 months')).not.toBeInTheDocument();
    });

    it('should include all 5 status options for systems in installed views', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
          selectedViewFilter="installed-only"
        />
      );

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      const expectedOptions = [
        'Supported',
        'Support ends within 3 months',
        'Retired',
        'Upcoming release',
        'Not installed',
      ];
      for (const option of expectedOptions) {
        expect(await within(statusMenu).findByText(option)).toBeInTheDocument();
      }
    });

    it('should exclude "Not installed" in "all" view for systems', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
          selectedViewFilter="all"
        />
      );

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      expect(within(statusMenu).queryByText('Not installed')).not.toBeInTheDocument();
      expect(await within(statusMenu).findByText('Supported')).toBeInTheDocument();
    });
  });

  describe('Status Selection and API Value Mapping', () => {
    it('should call onStatusesChange with "Near retirement" when selecting app stream status', async () => {
      const onStatusesChange = jest.fn();
      render(<LifecycleFilters {...defaultProps} onStatusesChange={onStatusesChange} />);

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);
      await act(async () => {
        // Select "Support ends within 6 months"
        await userEvent.click(await within(statusMenu).findByText('Support ends within 6 months'));
      });

      // Should convert to API value "Near retirement"
      await waitFor(() => {
        expect(onStatusesChange).toHaveBeenCalledWith(expect.arrayContaining(['Near retirement']));
      });
    });

    it('should call onStatusesChange with "Near retirement" when selecting system status', async () => {
      const onStatusesChange = jest.fn();
      render(
        <LifecycleFilters
          {...defaultProps}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
          onStatusesChange={onStatusesChange}
        />
      );

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);
      await act(async () => {
        // Select "Support ends within 3 months"
        await userEvent.click(await within(statusMenu).findByText('Support ends within 3 months'));
      });

      // Should convert to API value "Near retirement"
      await waitFor(() => {
        expect(onStatusesChange).toHaveBeenCalledWith(expect.arrayContaining(['Near retirement']));
      });
    });

    it('should handle multiple status selections correctly', async () => {
      const onStatusesChange = jest.fn();
      render(<LifecycleFilters {...defaultProps} onStatusesChange={onStatusesChange} />);

      const fieldMenu = await openMenuByButton(/Name/i);
      await act(async () => {
        await userEvent.click(await within(fieldMenu).findByText(/^Status$/i));
      });

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /Status/i })).toHaveLength(2);
      });
      const statusButtons = screen.getAllByRole('button', { name: /Status/i });
      const statusMenu = await openMenuByButton(statusButtons[1]);

      // Select multiple statuses
      await act(async () => {
        await userEvent.click(await within(statusMenu).findByText('Supported'));
        await userEvent.click(await within(statusMenu).findByText('Retired'));
      });

      await waitFor(() => {
        expect(onStatusesChange).toHaveBeenCalled();
        const calls = onStatusesChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('Supported');
        expect(lastCall).toContain('Retired');
      });
    });
  });

  describe('Initial Status from URL Parameters', () => {
    it('should initialize app stream status from initialStatuses prop with correct display labels', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          initialStatuses={['Near retirement', 'Supported']}
          lifecycleDropdownValue="RHEL 9 Application Streams"
        />
      );

      // Field should automatically be set to "Status"
      await waitFor(() => {
        const statusButtons = screen.getAllByRole('button', { name: /Status/i });
        // First button should be the field selector showing "Status"
        expect(statusButtons[0]).toHaveTextContent('Status');
      });

      // Should show status chips for selected filters
      expect(screen.getByText('Support ends within 6 months')).toBeInTheDocument();
      expect(screen.getByText('Supported')).toBeInTheDocument();
    });

    it('should initialize system status from initialStatuses prop with correct display labels', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          initialStatuses={['Near retirement', 'Retired']}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
        />
      );

      // Field should automatically be set to "Status"
      await waitFor(() => {
        const statusButtons = screen.getAllByRole('button', { name: /Status/i });
        expect(statusButtons[0]).toHaveTextContent('Status');
      });

      // Should show status chips with correct system labels
      expect(screen.getByText('Support ends within 3 months')).toBeInTheDocument();
      expect(screen.getByText('Retired')).toBeInTheDocument();
    });

    it('should set field to "Version" when initialRhelVersions is provided for systems', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          initialRhelVersions={['RHEL 8', 'RHEL 9']}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
        />
      );

      // Field should automatically be set to "Version"
      await waitFor(() => {
        const versionButton = screen.getByRole('button', { name: /^Version$/i });
        expect(versionButton).toHaveClass('pf-v6-c-menu-toggle');
      });
    });

    it('should prioritize Status field when both initialStatuses and initialRhelVersions are provided', async () => {
      render(
        <LifecycleFilters
          {...defaultProps}
          initialStatuses={['Supported']}
          initialRhelVersions={['RHEL 8']}
          lifecycleDropdownValue={RHEL_SYSTEMS_DROPDOWN_VALUE}
        />
      );

      // Field should be set to "Status" (takes precedence)
      await waitFor(() => {
        const statusButtons = screen.getAllByRole('button', { name: /Status/i });
        expect(statusButtons[0]).toHaveTextContent('Status');
      });
    });
  });

  describe('Status Filter Reset Behavior', () => {
    it('should clear status filters when resetOnAppsSwitchKey changes', () => {
      const onStatusesChange = jest.fn();
      const { rerender } = render(
        <LifecycleFilters
          {...defaultProps}
          onStatusesChange={onStatusesChange}
          resetOnAppsSwitchKey={0}
          initialStatuses={['Supported', 'Retired']}
        />
      );

      // Clear the mock after initial render
      onStatusesChange.mockClear();

      // Change the resetOnAppsSwitchKey to trigger reset
      rerender(
        <LifecycleFilters
          {...defaultProps}
          onStatusesChange={onStatusesChange}
          resetOnAppsSwitchKey={1}
          initialStatuses={['Supported', 'Retired']}
        />
      );

      // Status filters should be cleared
      expect(onStatusesChange).toHaveBeenCalledWith([]);
    });
  });
});
