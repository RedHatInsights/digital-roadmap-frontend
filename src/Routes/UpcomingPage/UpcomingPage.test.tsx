import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import UpcomingPage from './UpcomingPage';

// Mock the useChrome hook
jest.mock('@redhat-cloud-services/frontend-components/useChrome', () => ({
  useChrome: jest.fn(() => ({
    appAction: jest.fn(),
  })),
}));

// Mock the UpcomingTab component
jest.mock('../../Components/Upcoming/Upcoming', () => {
  return function MockUpcomingTab() {
    return <div data-testid="upcoming-tab">Upcoming Tab</div>;
  };
});

// Mock SCSS import
jest.mock('./UpcomingPage.scss', () => ({}));

describe('UpcomingPage', () => {
  it('renders the page header with title', () => {
    render(<UpcomingPage />);
    expect(screen.getByText('Roadmap')).toBeInTheDocument();
  });

  it('renders the warning alert', () => {
    render(<UpcomingPage />);
    expect(screen.getByText('Upcoming features and dates are subject to change.')).toBeInTheDocument();
  });

  it('renders the upcoming tab component', () => {
    render(<UpcomingPage />);
    expect(screen.getByTestId('upcoming-tab')).toBeInTheDocument();
  });

  it('renders the help button for popover', () => {
    render(<UpcomingPage />);
    const helpButton = screen.getByRole('button', { name: /roadmap information/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('renders the about popover content with links when button is clicked', async () => {
    const user = userEvent.setup();
    render(<UpcomingPage />);

    const helpButton = screen.getByRole('button', { name: /roadmap information/i });
    await user.click(helpButton);

    const inventoryLink = await screen.findByRole('link', { name: /inventory/i });
    expect(inventoryLink).toHaveAttribute('href', 'https://console.redhat.com/insights/inventory');
    expect(inventoryLink).toHaveAttribute('target', '_blank');
    expect(inventoryLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the Red Hat Lightspeed documentation link in popover when opened', async () => {
    const user = userEvent.setup();
    render(<UpcomingPage />);

    const helpButton = screen.getByRole('button', { name: /roadmap information/i });
    await user.click(helpButton);

    const docsLink = await screen.findByRole('link', {
      name: /using red hat lightspeed for rhel planning dashboard/i,
    });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.redhat.com/en/documentation/red_hat_lightspeed/1-latest/html/' +
        'dynamically_creating_a_digital_roadmap_to_manage_rhel_systems/' +
        'using-the-digital-roadmap-dashboard#upcoming-features'
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
  });
});
