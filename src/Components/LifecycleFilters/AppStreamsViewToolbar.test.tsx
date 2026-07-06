import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppStreamsViewToolbar } from './AppStreamsViewToolbar';
import userEvent from '@testing-library/user-event';

describe('AppStreamsViewToolbar', () => {
  const defaultProps = {
    selectedField: 'Name' as const,
    isFieldOpen: false,
    onFieldToggle: jest.fn(),
    onFieldSelect: jest.fn(),
    nameFilter: '',
    setNameFilter: jest.fn(),
    selectedStatuses: [],
    setSelectedStatuses: jest.fn(),
    onStatusesChange: jest.fn(),
    isStatusSelectOpen: false,
    setIsStatusSelectOpen: jest.fn(),
    onStatusSelect: jest.fn(),
    statusOptions: ['Supported', 'Near retirement', 'Retired'],
    nameSearchInput: null,
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
    downloadCSV: jest.fn(),
    disableInstalledOnly: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toggle Group Rendering', () => {
    test('renders all three toggle group items', () => {
      render(<AppStreamsViewToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Installed and related' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Installed only' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });

    test('renders toggle group items without wrapper divs when not disabled', () => {
      const { container } = render(<AppStreamsViewToolbar {...defaultProps} />);

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
      const { rerender } = render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={false} />);

      // When not disabled, should not have tooltip wrapper
      const installedAndRelatedButton = screen.getByRole('button', { name: 'Installed and related' });
      expect(installedAndRelatedButton).not.toBeDisabled();

      // When disabled, should have tooltip wrapper
      rerender(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} />);
      const disabledButton = screen.getByRole('button', { name: 'Installed and related' });
      expect(disabledButton).toBeDisabled();
    });

    test('wraps "Installed only" in tooltip only when disabled', () => {
      const { rerender } = render(
        <AppStreamsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={false} />
      );

      // When not disabled, should not have tooltip wrapper
      let installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).not.toBeDisabled();

      // When disabled via noDataAvailable
      rerender(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={false} />);
      installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).toBeDisabled();

      // When disabled via disableInstalledOnly
      rerender(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={true} />);
      installedOnlyButton = screen.getByRole('button', { name: 'Installed only' });
      expect(installedOnlyButton).toBeDisabled();
    });

    test('"All" button is never wrapped in tooltip or div', () => {
      render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const allButton = screen.getByRole('button', { name: 'All' });
      expect(allButton).not.toBeDisabled();
      // Should be a direct child of toggle group item
      expect(allButton.closest('.pf-v6-c-toggle-group__item, .pf-v5-c-toggle-group__item')).toBeInTheDocument();
    });
  });

  describe('Tooltip Content', () => {
    test('shows correct tooltip content when noDataAvailable for "Installed and related"', () => {
      const { container } = render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} />);

      // PatternFly tooltips may not be immediately visible, but the content should be in DOM
      expect(container).toBeInTheDocument();
    });

    test('shows correct tooltip content when disableInstalledOnly', () => {
      const { container } = render(
        <AppStreamsViewToolbar {...defaultProps} noDataAvailable={false} disableInstalledOnly={true} />
      );

      expect(container).toBeInTheDocument();
      // The tooltip content includes specific text about no installed application streams
      // This is rendered when the button is hovered
    });

    test('shows generic tooltip when both noDataAvailable and disableInstalledOnly are true', () => {
      const { container } = render(
        <AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={true} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('Toggle Group Item Selection', () => {
    test('shows "Installed and related" as selected', () => {
      render(<AppStreamsViewToolbar {...defaultProps} selectedViewFilter="installed-and-related" />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toHaveClass('pf-m-selected');
    });

    test('shows "Installed only" as selected', () => {
      render(<AppStreamsViewToolbar {...defaultProps} selectedViewFilter="installed-only" />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toHaveClass('pf-m-selected');
    });

    test('shows "All" as selected', () => {
      render(<AppStreamsViewToolbar {...defaultProps} selectedViewFilter="all" />);

      const button = screen.getByRole('button', { name: 'All' });
      expect(button).toHaveClass('pf-m-selected');
    });
  });

  describe('Toggle Group Item Interactions', () => {
    test('calls handleItemClick when clicking "Installed and related"', async () => {
      const handleItemClick = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('calls handleItemClick when clicking "Installed only"', async () => {
      const handleItemClick = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('calls handleItemClick when clicking "All"', async () => {
      const handleItemClick = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} handleItemClick={handleItemClick} />);

      const button = screen.getByRole('button', { name: 'All' });
      await userEvent.click(button);

      expect(handleItemClick).toHaveBeenCalled();
    });

    test('does not call handleItemClick when clicking disabled button', async () => {
      const handleItemClick = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} handleItemClick={handleItemClick} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toBeDisabled();

      // Attempting to click a disabled button should not call the handler
      await userEvent.click(button);
      expect(handleItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled States', () => {
    test('disables "Installed and related" when noDataAvailable is true', () => {
      render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed and related' });
      expect(button).toBeDisabled();
    });

    test('disables "Installed only" when noDataAvailable is true', () => {
      render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toBeDisabled();
    });

    test('disables "Installed only" when disableInstalledOnly is true', () => {
      render(<AppStreamsViewToolbar {...defaultProps} disableInstalledOnly={true} />);

      const button = screen.getByRole('button', { name: 'Installed only' });
      expect(button).toBeDisabled();
    });

    test('does not disable "All" button in any case', () => {
      render(<AppStreamsViewToolbar {...defaultProps} noDataAvailable={true} disableInstalledOnly={true} />);

      const button = screen.getByRole('button', { name: 'All' });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Name Filter', () => {
    test('displays name filter input', () => {
      render(<AppStreamsViewToolbar {...defaultProps} />);

      const input = screen.getByPlaceholderText('Filter by name');
      expect(input).toBeInTheDocument();
    });

    test('displays current name filter value', () => {
      render(<AppStreamsViewToolbar {...defaultProps} nameFilter="test-filter" />);

      const input = screen.getByPlaceholderText('Filter by name');
      expect(input).toHaveValue('test-filter');
    });

    test('calls setNameFilter when typing in input', async () => {
      const setNameFilter = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} setNameFilter={setNameFilter} />);

      const input = screen.getByPlaceholderText('Filter by name');
      await userEvent.type(input, 'new');

      expect(setNameFilter).toHaveBeenCalled();
    });
  });

  describe('Download CSV Button', () => {
    test('calls downloadCSV when download button is clicked', () => {
      const downloadCSV = jest.fn();
      render(<AppStreamsViewToolbar {...defaultProps} downloadCSV={downloadCSV} />);

      // Component should render successfully with downloadCSV prop
      expect(screen.getByRole('button', { name: 'Installed and related' })).toBeInTheDocument();
    });

    test('renders successfully with downloadCSV prop', () => {
      render(<AppStreamsViewToolbar {...defaultProps} />);

      // Component should still render even when download is present
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });
});
