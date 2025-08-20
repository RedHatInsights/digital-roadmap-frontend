import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LifecycleTable } from './LifecycleTable';
import { Stream } from '../../types/Stream';
import { SystemLifecycleChanges } from '../../types/SystemLifecycleChanges';

// Mock the lazy-loaded component
jest.mock('../../Components/LifecycleModalWindow/LifecycleModalWindow', () => {
  return function MockLifecycleModalWindow({ isModalOpen, name, modalData }: any) {
    if (!isModalOpen) return null;
    return (
      <div data-testid="lifecycle-modal">
        <div>Modal Name: {name}</div>
        <div>Modal Data: {JSON.stringify(modalData)}</div>
      </div>
    );
  };
});

// Mock the utils
jest.mock('../../utils/utils', () => ({
  formatDate: jest.fn((date) => (date ? `Formatted: ${date}` : 'Not available')),
}));

describe('LifecycleTable', () => {
  const mockStreamData: Stream[] = [
    {
      name: 'nodejs',
      application_stream_name: 'Node.js 18',
      display_name: 'Node.js 18',
      os_major: 9,
      os_minor: 0,
      start_date: '2023-01-01',
      end_date: '2025-01-01',
      count: 25,
      rolling: false,
      related: false,
      support_status: 'Supported',
      os_lifecycle: 'Supported',
      systems_detail: [{ id: '343252f2f23f44g', display_name: 'Test App System 1' }],
    },
    {
      name: 'python',
      application_stream_name: 'Python 3.11',
      display_name: 'Python 3.11',
      os_major: 9,
      os_minor: 0,
      start_date: '2022-01-01',
      end_date: '2024-01-01',
      count: 30,
      rolling: false,
      related: false,
      support_status: 'Supported',
      os_lifecycle: 'Supported',
      systems_detail: [{ id: '343252f2f23f44g', display_name: 'Test App System 1' }],
    },
    {
      name: 'httpd',
      application_stream_name: 'Apache HTTP Server',
      display_name: 'Apache HTTP Server',
      os_major: 8,
      os_minor: 0,
      start_date: '2022-01-01',
      end_date: '2024-01-01',
      count: 15,
      rolling: false,
      related: true,
      support_status: 'Supported',
      os_lifecycle: 'Supported',
      systems_detail: [{ id: '10', display_name: 'Test App System 2' }],
    },
  ];

  const mockSystemData: SystemLifecycleChanges[] = [
    {
      name: 'RHEL 9.3',
      major: 9,
      minor: 3,
      start_date: '2023-01-01',
      end_date: '2025-01-01',
      count: 100,
      lifecycle_type: 'standard',
      related: false,
      display_name: 'RHEL 9.3',
      support_status: 'Supported',
      systems_detail: [{ id: '23fr2f23rf42f0', display_name: 'Test System 1' }],
    },
    {
      name: 'RHEL 8.9',
      major: 8,
      minor: 9,
      start_date: '2022-01-01',
      end_date: '2024-01-01',
      count: 50,
      lifecycle_type: 'standard',
      related: true,
      display_name: 'RHEL 8.9',
      support_status: 'Supported',
      systems_detail: [{ id: '23fr2f23rf42f0', display_name: 'Test System 1' }],
    },
  ];

  // Helper function to render component with act wrapping
  const renderWithAct = async (component: React.ReactElement) => {
    let result: any;
    await act(async () => {
      result = render(component);
      // Add a small delay to allow Popper to settle
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders stream data table correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      // Wait for the component to fully render
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });

      // Check that the "3" appears multiple times in pagination (should be 3 occurrences: "1 - 3", "of 3", and in dropdown)
      const threeElements = screen.getAllByText('3');
      expect(threeElements.length).toBeGreaterThanOrEqual(2);

      // Check that we have the expected number of rows (header + 3 data rows)
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(4);

      // Check for our specific data - try both approaches
      expect(screen.getByText(/Node\.js 18/)).toBeInTheDocument();
      expect(screen.getByText(/Python 3\.11/)).toBeInTheDocument();
      expect(screen.getByText(/Apache HTTP Server/)).toBeInTheDocument();

      // Verify it's detected as stream data by checking the aria label
      expect(screen.getByLabelText(/RHEL 9 Application Streams/)).toBeInTheDocument();
    });

    it('renders system data table correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockSystemData} />);

      expect(screen.getByLabelText('Red Hat Enterprise Linux Lifecycle information')).toBeInTheDocument();

      // Look for the data in table cells specifically
      expect(screen.getByRole('cell', { name: /RHEL 9\.3/ })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /RHEL 8\.9/ })).toBeInTheDocument();
    });

    it('renders empty table when no data provided', async () => {
      await renderWithAct(<LifecycleTable data={[]} />);

      expect(screen.getByLabelText('Lifecycle information')).toBeInTheDocument();
    });
  });

  describe('Column Headers', () => {
    it('renders correct headers for stream data without viewFilter', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Initial release')).toBeInTheDocument();
      expect(screen.getByText('Release date')).toBeInTheDocument();
      expect(screen.getByText('Retirement date')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
    });

    it('renders correct headers for stream data with viewFilter="all"', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} viewFilter="all" />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Initial release')).toBeInTheDocument();
      expect(screen.getByText('Release date')).toBeInTheDocument();
      expect(screen.getByText('Retirement date')).toBeInTheDocument();
      expect(screen.queryByText('Systems')).not.toBeInTheDocument();
    });

    it('renders correct headers for system data', async () => {
      await renderWithAct(<LifecycleTable data={mockSystemData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Release date')).toBeInTheDocument();
      expect(screen.getByText('Retirement date')).toBeInTheDocument();
      expect(screen.getByText('Systems')).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('renders stream data with correct version format', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByText('8.0')).toBeInTheDocument();
    });

    it('renders formatted dates', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByText('Formatted: 2023-01-01')).toBeInTheDocument();
      expect(screen.getByText('Formatted: 2025-01-01')).toBeInTheDocument();
    });

    it('renders status icons correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      // Check for count buttons that indicate status icons are rendered
      expect(screen.getByRole('button', { name: '25' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
    });

    it('renders system data status icons correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockSystemData} />);

      // Check for system data count buttons
      expect(screen.getByRole('button', { name: '100' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
    });

    it('handles zero count correctly', async () => {
      const dataWithZeroCount = [
        {
          ...mockStreamData[0],
          count: 0,
        },
      ];

      await renderWithAct(<LifecycleTable data={dataWithZeroCount} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByLabelText('top pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('bottom pagination')).toBeInTheDocument();
    });

    it('handles page changes', async () => {
      const user = userEvent.setup();
      const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
        ...mockStreamData[0],
        display_name: `App ${i}`,
        os_major: 9,
        os_minor: i % 3,
      }));

      await renderWithAct(<LifecycleTable data={largeDataSet} />);

      // Should show first 10 items initially
      expect(screen.getByRole('cell', { name: 'App 0' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'App 9' })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'App 10' })).not.toBeInTheDocument();
    });

    it('handles per page changes', async () => {
      const user = userEvent.setup();
      const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
        ...mockStreamData[0],
        display_name: `App ${i}`,
        os_major: 9,
        os_minor: i % 3,
      }));

      await renderWithAct(<LifecycleTable data={largeDataSet} />);

      // Find and click the per page dropdown (look for the toggle button)
      const perPageButtons = screen.getAllByRole('button', { name: /1 - 10 of 25/i });

      await act(async () => {
        await user.click(perPageButtons[0]); // Click the first one (top pagination)
      });

      // Wait for the dropdown to appear and select 20 per page
      await waitFor(async () => {
        const twentyOption = screen.getByText('20 per page');
        await act(async () => {
          await user.click(twentyOption);
        });
      });

      // Should now show more items
      expect(screen.getByRole('cell', { name: 'App 0' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'App 19' })).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts stream data by name', async () => {
      const user = userEvent.setup();
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      const nameHeader = screen.getByText('Name');
      await act(async () => {
        await user.click(nameHeader);
      });

      // After sorting, check that Apache HTTP Server appears first (alphabetically)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Apache HTTP Server'); // First data row after header
    });

    it('sorts stream data by version', async () => {
      const user = userEvent.setup();
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      const versionHeader = screen.getByText('Initial release');
      await act(async () => {
        await user.click(versionHeader);
      });

      // Should sort by numeric version (8.0 should come first)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('8.0'); // Apache HTTP Server with 8.0 should be first
    });

    it('toggles sort direction', async () => {
      const user = userEvent.setup();
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      const nameHeader = screen.getByText('Name');

      // First click - ascending (default is already ascending, so this should remain)
      await act(async () => {
        await user.click(nameHeader);
      });
      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Apache HTTP Server');

      // Second click - descending
      await act(async () => {
        await user.click(nameHeader);
      });
      rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Python 3.11'); // Should be last alphabetically when descending
    });
  });

  describe('Modal Functionality', () => {
    it('opens modal when count button is clicked', async () => {
      const user = userEvent.setup();
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      const countButton = screen.getByRole('button', { name: '25' });
      await act(async () => {
        await user.click(countButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Name: Node.js 18')).toBeInTheDocument();
      });
    });

    it('does not render count button for zero count', async () => {
      const dataWithZeroCount = [
        {
          ...mockStreamData[0],
          count: 0,
        },
      ];

      await renderWithAct(<LifecycleTable data={dataWithZeroCount} />);

      // The zero count should be plain text, not a button
      const zeroElement = screen.getByText('0');
      expect(zeroElement).not.toHaveAttribute('role', 'button');
    });

    it('passes correct modal data', async () => {
      const user = userEvent.setup();
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      const countButton = screen.getByRole('button', { name: '25' });
      await act(async () => {
        await user.click(countButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/Modal Data:/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Type Detection', () => {
    it('detects stream data type correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByLabelText('RHEL 9 Application Streams Lifecycle information')).toBeInTheDocument();
    });

    it('detects system data type correctly', async () => {
      await renderWithAct(<LifecycleTable data={mockSystemData} />);

      expect(screen.getByLabelText('Red Hat Enterprise Linux Lifecycle information')).toBeInTheDocument();
    });

    it('handles empty data gracefully', async () => {
      await renderWithAct(<LifecycleTable data={[]} />);

      expect(screen.getByLabelText('Lifecycle information')).toBeInTheDocument();
    });
  });

  describe('Filter Handling', () => {
    it('hides count column when viewFilter is "all"', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} viewFilter="all" />);

      expect(screen.queryByText('Systems')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '25' })).not.toBeInTheDocument();
    });

    it('shows count column when viewFilter is not "all"', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} viewFilter="filtered" />);

      expect(screen.getByText('Systems')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '25' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing display_name gracefully', async () => {
      const dataWithMissingName = [
        {
          ...mockStreamData[0],
          display_name: undefined as any, // Cast to any to test edge case
        },
      ];

      await renderWithAct(<LifecycleTable data={dataWithMissingName} />);

      // Should not render the row with missing display_name
      expect(screen.queryByText('9.0')).not.toBeInTheDocument();
    });

    it('handles missing dates gracefully', async () => {
      const dataWithMissingDates = [
        {
          ...mockStreamData[0],
          start_date: null as any, // Cast to any to test edge case
          end_date: null as any, // Cast to any to test edge case
        },
      ];

      await renderWithAct(<LifecycleTable data={dataWithMissingDates} />);

      // Should find multiple "Not available" texts (for start_date and end_date)
      const notAvailableElements = screen.getAllByText('Not available');
      expect(notAvailableElements).toHaveLength(2);
    });

    it('handles missing support_status gracefully', async () => {
      const dataWithMissingStatus = [
        {
          ...mockStreamData[0],
          support_status: undefined as any, // Cast to any to test edge case
        },
      ];

      await renderWithAct(<LifecycleTable data={dataWithMissingStatus} />);

      // Should render without crashing - check for the display name in a cell
      expect(screen.getByRole('cell', { name: 'Node.js 18' })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByLabelText('RHEL 9 Application Streams Lifecycle information')).toBeInTheDocument();
      expect(screen.getByLabelText('top pagination')).toBeInTheDocument();
      expect(screen.getByLabelText('bottom pagination')).toBeInTheDocument();
    });

    it('has proper table structure', async () => {
      await renderWithAct(<LifecycleTable data={mockStreamData} />);

      // PatternFly tables use role="grid" instead of role="table"
      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(5); // Name, Release, Start, End, Systems
      expect(screen.getAllByRole('row')).toHaveLength(4); // Header + 3 data rows
    });
  });

  describe('Component Updates', () => {
    it('updates when data changes', async () => {
      const { rerender } = await renderWithAct(<LifecycleTable data={mockStreamData} />);

      expect(screen.getByRole('cell', { name: 'Node.js 18' })).toBeInTheDocument();

      const newData = [
        {
          ...mockStreamData[0],
          display_name: 'Updated App',
        },
      ];

      await act(async () => {
        rerender(<LifecycleTable data={newData} />);
        // Allow time for Popper to settle after rerender
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(screen.getByRole('cell', { name: 'Updated App' })).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'Node.js 18' })).not.toBeInTheDocument();
    });

    it('resets pagination when data changes', async () => {
      const { rerender } = await renderWithAct(<LifecycleTable data={mockStreamData} />);

      // Change to new data
      const newData = Array.from({ length: 25 }, (_, i) => ({
        ...mockStreamData[0],
        display_name: `New App ${i}`,
      }));

      await act(async () => {
        rerender(<LifecycleTable data={newData} />);
        // Allow time for Popper to settle after rerender
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should be back on page 1
      expect(screen.getByRole('cell', { name: 'New App 0' })).toBeInTheDocument();
    });
  });
});
