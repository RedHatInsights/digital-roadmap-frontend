import '@testing-library/jest-dom/jest-globals';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }

    observe() {
        // Mock implementation
    }

    unobserve() {
        // Mock implementation
    }

    disconnect() {
        // Mock implementation
    }
};

// Suppress React Suspense warnings and expected console errors in tests
const originalError = console.error;
const originalLog = console.log;
beforeEach(() => {
  console.error = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    
    // Suppress React Suspense warnings
    if (message.includes('A suspended resource finished loading inside a test, but the event was not wrapped in act')) {
      return;
    }
    
    // Suppress expected API errors from tests
    if (message.includes('Error fetching all changes:') || 
        message.includes('Error fetching relevant changes:') ||
        message.includes('Error fetching changes:') ||
        message.includes('Unexpected error in fetchBothDataSources:') ||
        message.includes('Error fetching lifecycle changes:')) {
      return;
    }
    
    // Suppress DOM validation warnings from tests
    if (message.includes('validateDOMNesting')) {
      return;
    }
    
    originalError.call(console, ...args);
  };
  
  console.log = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    
    // Suppress expected log messages from tests
    if (message.includes('Auto-switching to "all" view due to empty relevant data') ||
        message.includes('View filter changed to:')) {
      return;
    }
    
    originalLog.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.log = originalLog;
});
