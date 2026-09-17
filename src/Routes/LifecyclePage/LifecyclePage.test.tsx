import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import LifecyclePage from './LifecyclePage';

// Mock the useChrome hook
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(() => ({
    appAction: jest.fn(),
  })),
}));

// Mock the LifecycleTab component
jest.mock('../../Components/Lifecycle/Lifecycle', () => {
  return function MockLifecycleTab() {
    return <div data-testid="lifecycle-tab">Lifecycle Tab</div>;
  };
});

// Mock SCSS import
jest.mock('./LifecyclePage.scss', () => ({}));

describe('LifecyclePage', () => {
  it('renders the page header with title', () => {
    render(<LifecyclePage />);
    expect(screen.getByText('Life Cycle')).toBeInTheDocument();
  });

  it('renders the warning alert', () => {
    render(<LifecyclePage />);
    expect(screen.getByText('Dates are approximations and subject to change.')).toBeInTheDocument();
  });

  it('renders the expandable info alert', () => {
    render(<LifecyclePage />);
    expect(screen.getByText('Get notified about lifecycle changes')).toBeInTheDocument();
  });

  it('shows the info alert description after expanding', async () => {
    const user = userEvent.setup();
    render(<LifecyclePage />);

    expect(
      screen.queryByText(/Subscribe to lifecycle notifications about RHEL and Application Stream retirement/i)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /get notified about lifecycle changes/i }));

    expect(
      await screen.findByText(/Subscribe to lifecycle notifications about RHEL and Application Stream retirement/i)
    ).toBeInTheDocument();

    const settingsLink = screen.getByRole('link', { name: /manage notification settings/i });
    expect(settingsLink).toHaveAttribute(
      'href',
      `${window.location.origin}/settings/notifications/user-preferences?bundle=rhel&app=life-cycle`
    );
    expect(settingsLink).toHaveAttribute('target', '_blank');
    expect(settingsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the lifecycle tab component', () => {
    render(<LifecyclePage />);
    expect(screen.getByTestId('lifecycle-tab')).toBeInTheDocument();
  });

  it('renders the help button for popover', () => {
    render(<LifecyclePage />);
    const helpButton = screen.getByRole('button', { name: /life cycle information/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('renders the about popover content with links when button is clicked', async () => {
    const user = userEvent.setup();
    render(<LifecyclePage />);

    const helpButton = screen.getByRole('button', { name: /life cycle information/i });
    await user.click(helpButton);

    const inventoryLink = await screen.findByRole('link', { name: /inventory/i });
    expect(inventoryLink).toHaveAttribute('href', 'https://console.redhat.com/insights/inventory');
    expect(inventoryLink).toHaveAttribute('target', '_blank');
    expect(inventoryLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the Customer Portal link in popover when opened', async () => {
    const user = userEvent.setup();
    render(<LifecyclePage />);

    const helpButton = screen.getByRole('button', { name: /life cycle information/i });
    await user.click(helpButton);

    const portalLink = await screen.findByRole('link', { name: /customer portal/i });
    expect(portalLink).toHaveAttribute('href', 'https://access.redhat.com/product-life-cycles');
    expect(portalLink).toHaveAttribute('target', '_blank');
  });

  it('renders the Red Hat Lightspeed documentation link in popover when opened', async () => {
    const user = userEvent.setup();
    render(<LifecyclePage />);

    const helpButton = screen.getByRole('button', { name: /life cycle information/i });
    await user.click(helpButton);

    const docsLink = await screen.findByRole('link', {
      name: /using red hat lightspeed for rhel planning dashboard/i,
    });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/' +
        'dynamically_creating_a_digital_roadmap_to_manage_rhel_systems/using-the-digital-roadmap-dashboard#life-cycle'
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
  });
});
