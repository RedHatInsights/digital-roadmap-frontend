import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LifecycleModalWindow } from './LifecycleModalWindow';
import { SystemsDetail } from '../../types/SystemsDetail';

// 11 systems, so that the default page size of 10 splits them over two pages
const systems: SystemsDetail[] = Array.from({ length: 11 }, (_, index) => ({
  id: `id-${index + 1}`,
  display_name: `iqe-modal-roadmap-${String(index + 1).padStart(2, '0')}`,
}));

// The systems are handed over in an order that puts none of the extremes on the first page
const unorderedSystems = [...systems.slice(1), systems[0]];

const renderModalWindow = (modalData: SystemsDetail[] | undefined = unorderedSystems) =>
  render(
    <LifecycleModalWindow
      name="test-package"
      modalData={modalData}
      isModalOpen={true}
      handleModalToggle={jest.fn()}
    />
  );

const getRenderedNames = () =>
  within(screen.getByRole('grid'))
    .getAllByRole('row')
    // Drop the header row
    .slice(1)
    .map((row) => row.textContent);

const sortByName = () => fireEvent.click(screen.getByRole('button', { name: 'Name' }));

describe('LifecycleModalWindow sorting', () => {
  test('sorts all systems ascending, not just the current page', () => {
    renderModalWindow();

    sortByName();

    const names = getRenderedNames();
    expect(names).toHaveLength(10);
    // The system on the second page before sorting now leads the first page
    expect(names[0]).toBe('iqe-modal-roadmap-01');
    expect(names[9]).toBe('iqe-modal-roadmap-10');
  });

  test('sorts all systems descending, not just the current page', () => {
    renderModalWindow();

    sortByName();
    sortByName();

    const names = getRenderedNames();
    expect(names[0]).toBe('iqe-modal-roadmap-11');
    expect(names[9]).toBe('iqe-modal-roadmap-02');
  });

  test('keeps the remainder of the sorted systems on the second page', () => {
    renderModalWindow();

    sortByName();
    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);

    expect(getRenderedNames()).toEqual(['iqe-modal-roadmap-11']);
  });

  test('returns to the first page when sorting', () => {
    renderModalWindow();

    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);
    sortByName();

    expect(getRenderedNames()[0]).toBe('iqe-modal-roadmap-01');
  });

  test('sorts the filtered systems across pages', () => {
    renderModalWindow();

    fireEvent.change(screen.getByRole('textbox', { name: 'Filter systems by name' }), {
      target: { value: 'ROADMAP-' },
    });
    sortByName();

    expect(getRenderedNames()[0]).toBe('iqe-modal-roadmap-01');

    fireEvent.click(screen.getAllByRole('button', { name: 'Go to next page' })[0]);

    expect(getRenderedNames()).toEqual(['iqe-modal-roadmap-11']);
  });

  test('does not reorder the data owned by the parent component', () => {
    const modalData = [...unorderedSystems];
    renderModalWindow(modalData);

    sortByName();

    expect(modalData).toEqual(unorderedSystems);
  });
});
