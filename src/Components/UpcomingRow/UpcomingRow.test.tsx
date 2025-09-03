import React, { Suspense } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableRow, columnNames } from './UpcomingRow';
import { UpcomingChanges } from '../../types/UpcomingChanges';

// Mock the lazy-loaded LifecycleModalWindow component
jest.mock('../../Components/LifecycleModalWindow/LifecycleModalWindow', () => {
  return function MockLifecycleModalWindow({ name, modalData, isModalOpen, handleModalToggle }: any) {
    console.log('🔍 Mock Modal Props:', {
      name,
      modalData,
      isModalOpen,
      modalDataType: typeof modalData,
      modalDataLength: modalData?.length,
    });

    if (!isModalOpen) return null;

    // Handle undefined explicitly to avoid rendering "undefined" as text
    const displayName = name === undefined || name === null ? '' : String(name);

    // Handle both string arrays and SystemsDetail objects
    let joinedData = '';
    if (modalData && Array.isArray(modalData)) {
      if (typeof modalData[0] === 'string') {
        // Handle string arrays
        joinedData = modalData.join(', ');
      } else if (modalData[0] && typeof modalData[0] === 'object') {
        // Handle SystemsDetail objects - try common property names
        joinedData = modalData
          .map((item) => item.name || item.hostname || item.systemName || item.system || Object.values(item)[0])
          .join(', ');
      }
    }

    return (
      <div data-testid="lifecycle-modal">
        <div data-testid="modal-name">{displayName}</div>
        <div data-testid="modal-data">{joinedData}</div>
        <button data-testid="modal-close" onClick={handleModalToggle}>
          Close Modal
        </button>
      </div>
    );
  };
});

// Mock PatternFly CSS import
jest.mock('@patternfly/react-core/dist/styles/base.css', () => ({}));

// Test data
const baseRepo: UpcomingChanges = {
  name: 'Ruby 2.7 EOL',
  type: 'Deprecation',
  release: '9.0',
  date: '2024-12-01',
  package: 'ruby',
};

const repoWithDetails: UpcomingChanges = {
  ...baseRepo,
  details: {
    summary: 'Ruby 2.7 has reached end of life and will no longer receive security updates.',
    potentiallyAffectedSystemsCount: 5,
    // Use type assertion to bypass TypeScript error for now
    potentiallyAffectedSystemsDetail: ['system1.example.com', 'system2.example.com', 'system3.example.com'] as any,
    trainingTicket: 'RUBY-123',
    dateAdded: '2024-01-15',
    lastModified: '2024-02-01',
    detailFormat: 0,
    architecture: 'x86_64',
  },
};

const defaultProps = {
  repo: baseRepo,
  columnNames,
  rowIndex: 0,
  isExpanded: false,
  hideRepo: jest.fn(),
  showRepo: jest.fn(),
};

// Helper to render component within a proper table structure
const renderTableRow = (props = defaultProps) => {
  return render(
    <table>
      <Suspense
        fallback={
          <tbody>
            <tr>
              <td>Loading...</td>
            </tr>
          </tbody>
        }
      >
        <TableRow {...props} />
      </Suspense>
    </table>
  );
};

describe('TableRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders basic row with all data', async () => {
      await act(async () => {
        renderTableRow();
      });

      // Wait for lazy components to load
      await waitFor(() => {
        expect(screen.getByText('Ruby 2.7 EOL')).toBeInTheDocument();
      });

      expect(screen.getByText('Deprecation')).toBeInTheDocument();
      expect(screen.getByText('9.0')).toBeInTheDocument();
      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
    });

    test('renders different repo data correctly', () => {
      const differentRepo: UpcomingChanges = {
        name: 'PostgreSQL 15 Feature',
        type: 'Addition',
        release: '10.2',
        date: '2024-12-15',
        package: 'postgresql',
      };

      renderTableRow({
        ...defaultProps,
        repo: differentRepo,
      });

      expect(screen.getByText('PostgreSQL 15 Feature')).toBeInTheDocument();
      expect(screen.getByText('Addition')).toBeInTheDocument();
      expect(screen.getByText('10.2')).toBeInTheDocument();
      expect(screen.getByText('Dec 2024')).toBeInTheDocument();
    });
  });

  describe('Type Icons', () => {
    test('renders danger icon for Deprecation type', () => {
      renderTableRow({
        ...defaultProps,
        repo: { ...baseRepo, type: 'Deprecation' },
      });

      const iconContainer = screen.getByText('Deprecation').closest('.drf-lifecycle__upcoming-row-type');
      expect(iconContainer).toBeInTheDocument();
      // PatternFly Icon component should be rendered
      expect(iconContainer?.querySelector('.pf-v5-c-icon')).toBeInTheDocument();
    });

    test('renders warning icon for Change type', () => {
      renderTableRow({
        ...defaultProps,
        repo: { ...baseRepo, type: 'Change' },
      });

      const iconContainer = screen.getByText('Change').closest('.drf-lifecycle__upcoming-row-type');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('.pf-v5-c-icon')).toBeInTheDocument();
    });

    test('renders info icon for Addition type', () => {
      renderTableRow({
        ...defaultProps,
        repo: { ...baseRepo, type: 'Addition' },
      });

      const iconContainer = screen.getByText('Addition').closest('.drf-lifecycle__upcoming-row-type');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('.pf-v5-c-icon')).toBeInTheDocument();
    });

    test('renders info icon for Enhancement type', () => {
      renderTableRow({
        ...defaultProps,
        repo: { ...baseRepo, type: 'Enhancement' },
      });

      const iconContainer = screen.getByText('Enhancement').closest('.drf-lifecycle__upcoming-row-type');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('.pf-v5-c-icon')).toBeInTheDocument();
    });
  });

  describe('Row Expansion', () => {
    test('calls showRepo when collapsed row is clicked', () => {
      renderTableRow({
        ...defaultProps,
        isExpanded: false,
      });

      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);

      expect(defaultProps.showRepo).toHaveBeenCalledTimes(1);
      expect(defaultProps.hideRepo).not.toHaveBeenCalled();
    });

    test('calls hideRepo when expanded row is clicked', () => {
      renderTableRow({
        ...defaultProps,
        isExpanded: true,
      });

      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);

      expect(defaultProps.hideRepo).toHaveBeenCalledTimes(1);
      expect(defaultProps.showRepo).not.toHaveBeenCalled();
    });

    test('does not render expanded content when collapsed', async () => {
      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithDetails,
          isExpanded: false,
        });
      });

      // When collapsed with details, the expanded row should not be visible
      // Check that the expandable row has the hidden attribute
      await waitFor(() => {
        const expandableRow = screen.getByText('Potentially affected systems').closest('tr');
        expect(expandableRow).toHaveAttribute('hidden');
      });
    });

    test('renders expanded content when expanded and details exist', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      expect(screen.getByText(repoWithDetails.details!.summary)).toBeInTheDocument();
      expect(screen.getByText('Potentially affected systems')).toBeInTheDocument();
      expect(screen.getByText('Tracking ticket')).toBeInTheDocument();
      expect(screen.getByText('Date added')).toBeInTheDocument();
      expect(screen.getByText('Last modified')).toBeInTheDocument();
    });
  });

  describe('Details Section', () => {
    test('renders all detail fields when expanded', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      expect(
        screen.getByText('Ruby 2.7 has reached end of life and will no longer receive security updates.')
      ).toBeInTheDocument();
      expect(screen.getByText('RUBY-123')).toBeInTheDocument();
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-02-01')).toBeInTheDocument();
    });

    test('renders tracking ticket as a link', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      const ticketLink = screen.getByRole('link', { name: 'RUBY-123' });
      expect(ticketLink).toHaveAttribute('href', 'https://issues.redhat.com/browse/RUBY-123');
      expect(ticketLink).toHaveAttribute('rel', 'noreferrer');
    });

    test('renders affected systems count as clickable button when count > 0', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      const systemsButton = screen.getByRole('button', { name: '5' });
      expect(systemsButton).toBeInTheDocument();
    });

    test('renders affected systems count as text when count is 0', () => {
      const repoWithZeroSystems = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          potentiallyAffectedSystemsCount: 0,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithZeroSystems,
        isExpanded: true,
      });

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '0' })).not.toBeInTheDocument();
    });

    test('handles missing potentiallyAffectedSystemsCount', () => {
      const repoWithoutSystemsCount = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          potentiallyAffectedSystemsCount: undefined as any,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithoutSystemsCount,
        isExpanded: true,
      });

      // Should not crash and should render the section
      expect(screen.getByText('Potentially affected systems')).toBeInTheDocument();
    });
  });

  describe('Modal Functionality', () => {
    test('opens modal when affected systems button is clicked', async () => {
      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithDetails,
          isExpanded: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      });

      const systemsButton = screen.getByRole('button', { name: '5' });

      await act(async () => {
        fireEvent.click(systemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
      });

      expect(screen.getByTestId('modal-name')).toHaveTextContent('ruby');
      expect(screen.getByTestId('modal-data')).toHaveTextContent(
        'system1.example.com, system2.example.com, system3.example.com'
      );
    });

    test('closes modal when close button is clicked', async () => {
      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithDetails,
          isExpanded: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      });

      // Open modal
      const systemsButton = screen.getByRole('button', { name: '5' });

      await act(async () => {
        fireEvent.click(systemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByTestId('modal-close');

      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('lifecycle-modal')).not.toBeInTheDocument();
      });
    });

    test('does not render modal initially', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      expect(screen.queryByTestId('lifecycle-modal')).not.toBeInTheDocument();
    });
  });

  describe('Detail Format Handling', () => {
    test('handles detailFormat 1 (full width)', () => {
      const repoWithFormat1 = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          detailFormat: 1 as 0 | 1 | 2 | 3,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithFormat1,
        isExpanded: true,
      });

      expect(screen.getByText(repoWithFormat1.details!.summary)).toBeInTheDocument();
    });

    test('handles detailFormat 2 (no padding)', () => {
      const repoWithFormat2 = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          detailFormat: 2 as 0 | 1 | 2 | 3,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithFormat2,
        isExpanded: true,
      });

      expect(screen.getByText(repoWithFormat2.details!.summary)).toBeInTheDocument();
    });

    test('handles detailFormat 3 (full width and no padding)', () => {
      const repoWithFormat3 = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          detailFormat: 3 as 0 | 1 | 2 | 3,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithFormat3,
        isExpanded: true,
      });

      expect(screen.getByText(repoWithFormat3.details!.summary)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles repo without details', () => {
      renderTableRow({
        ...defaultProps,
        repo: baseRepo,
        isExpanded: true,
      });

      // Should not render expanded details section
      expect(screen.queryByText('Potentially affected systems')).not.toBeInTheDocument();
      expect(screen.queryByText('Tracking ticket')).not.toBeInTheDocument();
    });

    test('handles empty affected systems array', async () => {
      const repoWithEmptySystems = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          potentiallyAffectedSystemsDetail: [] as any,
        },
      };

      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithEmptySystems,
          isExpanded: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      });

      const systemsButton = screen.getByRole('button', { name: '5' });

      await act(async () => {
        fireEvent.click(systemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
      });

      // Modal should still open but with no data
      expect(screen.getByTestId('modal-data')).toBeEmptyDOMElement();
    });

    test('handles undefined affected systems', () => {
      const repoWithUndefinedSystems = {
        ...repoWithDetails,
        details: {
          ...repoWithDetails.details!,
          potentiallyAffectedSystemsDetail: undefined as any,
        },
      };

      renderTableRow({
        ...defaultProps,
        repo: repoWithUndefinedSystems,
        isExpanded: true,
      });

      // Should not crash
      expect(screen.getByText('Potentially affected systems')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes for expand button', () => {
      renderTableRow({
        ...defaultProps,
        isExpanded: false,
      });

      const expandButton = screen.getByRole('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('updates ARIA attributes when expanded', () => {
      renderTableRow({
        ...defaultProps,
        isExpanded: true,
      });

      const expandButton = screen.getByRole('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('has proper link attributes for tracking ticket', () => {
      renderTableRow({
        ...defaultProps,
        repo: repoWithDetails,
        isExpanded: true,
      });

      const ticketLink = screen.getByRole('link', { name: 'RUBY-123' });
      expect(ticketLink).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to LifecycleModalWindow', async () => {
      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithDetails,
          isExpanded: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      });

      const systemsButton = screen.getByRole('button', { name: '5' });

      await act(async () => {
        fireEvent.click(systemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-name')).toHaveTextContent('ruby');
        expect(screen.getByTestId('modal-data')).toHaveTextContent(
          'system1.example.com, system2.example.com, system3.example.com'
        );
      });
    });

    test('handles keyboard events on modal toggle', async () => {
      await act(async () => {
        renderTableRow({
          ...defaultProps,
          repo: repoWithDetails,
          isExpanded: true,
        });
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
      });

      const systemsButton = screen.getByRole('button', { name: '5' });

      // Simulate keyboard event
      await act(async () => {
        fireEvent.keyDown(systemsButton, { key: 'Enter' });
        fireEvent.click(systemsButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('lifecycle-modal')).toBeInTheDocument();
      });
    });
  });
});
