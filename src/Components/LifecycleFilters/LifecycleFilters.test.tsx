import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LifecycleFilters from './LifecycleFilters';
import userEvent from '@testing-library/user-event';

describe('LifecycleFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
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
        setSelectedChartSortBy={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
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
        setSelectedChartSortBy={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
      />
    );
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Filter by name/i })).toHaveValue('RHEL 3.0');
    expect(screen.getByRole('button', { name: /Reset/i })).toBeTruthy();
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
        setSelectedChartSortBy={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
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
        setSelectedChartSortBy={jest.fn()}
        downloadCSV={jest.fn()}
        selectedViewFilter="all"
        handleViewFilterChange={jest.fn()}
        noDataAvailable={false}
      />
    );
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    await waitFor(() => userEvent.click(resetBtn));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('');
  });
});
