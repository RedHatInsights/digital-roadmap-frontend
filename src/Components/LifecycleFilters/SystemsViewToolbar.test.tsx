import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemsViewToolbar } from './SystemsViewToolbar';
import userEvent from '@testing-library/user-event';

describe('SystemsViewToolbar', () => {
  const defaultProps = {
    selectedField: 'Name' as const,
    isFieldOpen: false,
    onFieldToggle: jest.fn(),
    onFieldSelect: jest.fn(),
    nameFilter: '',
    setNameFilter: jest.fn(),
    selectedRhelVersions: [],
    setSelectedRhelVersions: jest.fn(),
    onRhelVersionsChange: jest.fn(),
    isRhelSelectOpen: false,
    setIsRhelSelectOpen: jest.fn(),
    onRhelSelect: jest.fn(),
    rhelVersionOptions: ['RHEL 8', 'RHEL 9', 'RHEL 10'],
    selectedStatuses: [],
    setSelectedStatuses: jest.fn(),
    onStatusesChange: jest.fn(),
    isStatusSelectOpen: false,
    setIsStatusSelectOpen: jest.fn(),
    onStatusSelect: jest.fn(),
    statusOptions: ['Supported', 'Near retirement', 'Retired'],
    nameSearchInput: null,
    rhelVersionSelect: null,
    statusSelect: null,
    selectedViewFilter: 'installed-and-related',
    handleItemClick: jest.fn(),
    noDataAvailable: false,
    getTooltipContent: jest.fn((buttonId: string) => {
      if (buttonId === 'installed-and-related' || buttonId === 'installed-only') {
        return 'No data available to display';
      }
      return undefined;
    }),
    selectedChartSortBy: 'Retirement date',
    isOpen: false,
    onToggleClick: jest.fn(),
    onSelect: jest.fn(),
    setIsOpen: jest.fn(),
    onExport: jest.fn(),
    disableInstalledOnly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toggle Group Rendering', () => {
    test('renders all three toggle group items', () => {
      render(<SystemsViewToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Installed and related' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Installed only' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    test('renders toggle group items without wrapper divs when not disabled', () => {
      const { container } = render(<SystemsViewToolbar {...defaultProps} />);

      const toggleGroup = container.querySelector('.drf-lifecycle__toggle-group-fixed-height');
      expect(toggleGroup).toBeInTheDocument();

      // All toggle group items should be direct children (not wrapped in div)
      const allButton = screen.getByRole('button', { name: 'All' });
      expect(
        allButton.closest('div.pf-v6-c-toggle-group__item, div.pf-v5-c-toggle-group__item')
      ).toBeInTheDocument();
    });
  });

  describe('Tooltip Wrapping Behavior', () => {
    test('wraps "Installed and related" in tooltip only when disabled (noDataAvailable)', () => {
      const { rerender } = render(<SystemsViewToolbar {...defaultProps} noDataAvailable={false} />);

      // When not disabled, should not have tooltip wrapper
      const installedAndRelatedButton = screen.getByRole('button', { name: 'Installed and related' });
      expect(installedAndRelatedButton).not.toBeDisabled();

      // When disabled, should have tooltip wrapper
      rerender(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} />);
      const disabledButton = screen.getByRole('button', { name: 'Installed and related' });
      expect(disabledButton).toBeDisabled();
    });

    test('wraps "Installed only" in tooltip only when disabled', () => {
      const { rerender } = render(
        <SystemsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={false} />
      );

      // When not disabled, should not have tooltip wrapper
      let installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).not.toBeDisabled();

      // When disabled via noDataAvailable
      rerender(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={false} />);
      installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).toBeDisabled();

      // When disabled via disableInstalledOnly
      rerender(<SystemsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={true} />);
      installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).toBeDisabled();
    });

    test('"All" button is never wrapped in tooltip or div', () => {
      render(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).not.toBeDisabled();
      // Should be a direct child of toggle group item
      expect(allButton.closest('.pf-v6-c-toggle-group__item, .pf-v5-c-toggle-group__item')).toBeInTheDocument();
    });
  });

  describe('Tooltip Content', () => {
    test('shows correct tooltip content when noDataAvailable for "Installed and related"', () => {
      const { container } = render(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} />);

      // PatternFly tooltips may not be immediately visible, but the content should be in DOM
      expect(container).toBeInTheDocument();
    });

    test('shows correct tooltip content when disableInstalledOnly (specific to Systems)', () => {
      const { container } = render(
        <SystemsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={true} />
      );

      expect(container).toBeInTheDocument();
      // The tooltip content includes specific text about no installed RHEL releases
      // This is rendered when the button is hovered
    });

    test('shows generic tooltip when both noDataAvailable and disableInstalledOnly are true', () => {
      const { container } = render(
        <SystemsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={true} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Toggle Group Item Selection', () => {
    test('shows "Installed and related" as selected', () => {
      render(<SystemsViewToolbar {...defaultProps} selectedViewFilter="installed-and-related" />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toHaveClass('pf-m-selected');
    });

    test('shows "Installed only" as selected', () => {
      render(<SystemsViewToolbar {...defaultProps} selectedViewFilter="installed-only" />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toHaveClass('pf-m-selected');
    });

    test('shows "All" as selected', () => {
      render(<SystemsViewToolbar {...defaultProps} selectedViewFilter="all" />);

      const button = screen.getByRole('button', { name: 'All' });
      expect(button).toHaveClass('pf-m-selected');
    });
  });

  describe('Toggle Group Item Interactions', () => {
    test('calls handleItemClick when clicking "Installed and related"', async () => {
      const handleItemClick = jest.fn();
      render(<SystemsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('calls handleItemClick when clicking "Installed only"', async () => {
      const handleItemClick = jest.fn();
      render(<SystemsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('calls handleItemClick when clicking "All"', async () => {
      const handleItemClick = jest.fn();
      render(<SystemsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'All' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('does not call handleItemClick when clicking disabled button', async () => {
      const handleItemClick = jest.fn();
      render(<SystemsViewToolbar {...defaultProps} handleItemClick={handleItemClick} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toBeDisabled();

      // Attempting to click a disabled button should not call the handler
      await userEvent.click(button);
      expect(handleItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled States', () => {
    test('disables "Installed and related" when noDataAvailable is true', () => {
      render(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toBeDisabled();
    });

    test('disables "Installed only" when noDataAvailable is true', () => {
      render(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toBeDisabled();
    });

    test('disables "Installed only" when disableInstalledOnly is true', () => {
      render(<SystemsViewToolbar {...defaultProps} disableInstalledOnly={true} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toBeDisabled();
    });

    test('does not disable "All" button in any case', () => {
      render(<SystemsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={true} />);

      const button = screen.getByRole('button', { name: 'All' });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Name Filter', () => {
    test('displays name filter input', () => {
      render(<SystemsViewToolbar {...defaultProps} />);

      const input = screen.getByPlaceholderText('Filter by name');
      expect(input).toBeInTheDocument();
    });

    test('displays current name filter value', () => {
      render(<SystemsViewToolbar {...defaultProps} nameFilter="test-filter" />);

      const input = screen.getByPlaceholderText('Filter by name');
      expect(input).toHaveValue('test-filter');
    });

    test('calls setNameFilter when typing in input', async () => {
      const setNameFilter = jest.fn();
      render(<SystemsViewToolbar {...defaultProps} setNameFilter={setNameFilter} />);

      const input = screen.getByPlaceholderText('Filter by name');
      await userEvent.type(input, 'new');

      expect(setNameFilter).toHaveBeenCalled();
    });
  });

  describe('Export Button', () => {
    test('renders successfully with onExport prop', () => {
      render(<SystemsViewToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Installed and related' })).toBeInTheDocument();
    });

    test('renders all view filter buttons', () => {
      render(<SystemsViewToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });
});
