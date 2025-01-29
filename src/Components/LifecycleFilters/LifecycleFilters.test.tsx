import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LifecycleFilters from './LifecycleFilters';
import userEvent from '@testing-library/user-event';

describe('LifecycleFilters', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('renders correctly with no filter set', () => {
    render(<LifecycleFilters nameFilter="" setNameFilter={jest.fn()} setError={jest.fn()} setIsLoading={jest.fn()} />);
    expect(screen.getByRole('textbox', { name: /Find by name/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Find by name/i })).toHaveValue('');
    expect(screen.queryByRole('button', { name: /Reset/i })).toBeFalsy();
  });
  it('renders correctly with a filter set', () => {
    render(
      <LifecycleFilters nameFilter="RHEL 3.0" setNameFilter={jest.fn()} setError={jest.fn()} setIsLoading={jest.fn()} />
    );
    expect(screen.getByRole('textbox', { name: /Find by name/i })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: /Find by name/i })).toHaveValue('RHEL 3.0');
    expect(screen.getByRole('button', { name: /Reset/i })).toBeTruthy();
  });
  it('calls setNameFilter appropriately', async () => {
    const spy = jest.fn();
    render(
      <LifecycleFilters nameFilter="RHEL 3.0" setNameFilter={spy} setError={jest.fn()} setIsLoading={jest.fn()} />
    );
    const nameFilter = screen.getByRole('textbox', { name: /Find by name/i });
    await userEvent.type(nameFilter, 'RHEL 3.0');
    expect(spy).toHaveBeenCalledTimes(8);
  });
  it('can clear input correctly', async () => {
    const spy = jest.fn();
    render(
      <LifecycleFilters nameFilter="RHEL 3.0" setNameFilter={spy} setError={jest.fn()} setIsLoading={jest.fn()} />
    );
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    await userEvent.click(resetBtn);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('');
  });
});
