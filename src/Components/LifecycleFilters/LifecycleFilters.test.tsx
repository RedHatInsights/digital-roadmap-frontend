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

// helper: open a PF Select/Menu by toggle button name and return the latest portal menu
const openMenuByButton = async (buttonName: RegExp | string) => {
  await act(async () => {
    await userEvent.click(screen.getByRole('button', { name: buttonName }));
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
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={jest.fn()}
    />
  );

  // Switch Field -> Version to initialize internal version selection
  const fieldMenu = await openMenuByButton(/Name/i);
  await act(async () => {
    await userEvent.click(await within(fieldMenu).findByText(/^Version$/i));
  });

  // Rerender with new dynamic option "RHEL 11"
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
      rhelVersionOptions={['RHEL 8', 'RHEL 9', 'RHEL 11']}
      onRhelVersionsChange={onRhelVersionsChange}
      onFilterFieldChange={jest.fn()}
    />
  );

  // Open versions menu and verify the new option appears
  const versionsMenu = await openMenuByButton(/RHEL versions/i);
  expect(await within(versionsMenu).findByText('RHEL 11')).toBeInTheDocument();
  expect(onRhelVersionsChange).toHaveBeenCalled();
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
  const fieldToggle = nameButtons.find((el) => el.classList.contains('pf-v5-c-menu-toggle'));
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
    (el) => el.classList.contains('pf-v5-c-menu-toggle') && el.textContent?.trim() === 'Version'
  );
  if (!fieldVersionToggle) throw new Error('Field toggle button (Version) not found');
  await userEvent.click(fieldVersionToggle);

  // Then choose "Name" from the field options
  await userEvent.click(await screen.findByRole('option', { name: /^Name$/i }));

  const calls = onRhelVersionsChange.mock.calls.map((args) => args[0]);
  const lastSelection = calls[calls.length - 1] as string[];
  expect(lastSelection).not.toEqual(['RHEL 7', 'RHEL 8', 'RHEL 9', 'RHEL 10']);
});
