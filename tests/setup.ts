// Jest setup file for test environment configuration
import '@testing-library/jest-dom';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock Request and Response for Next.js API routes
(global as any).Request = jest.fn().mockImplementation((url: string, options?: any) => ({
  url,
  method: options?.method || 'GET',
  headers: new Map(Object.entries(options?.headers || {})),
  body: options?.body,
  json: () => Promise.resolve(JSON.parse(options?.body || '{}')),
}));

(global as any).Response = jest.fn().mockImplementation((body: string, options?: any) => ({
  status: options?.status || 200,
  headers: new Map(Object.entries(options?.headers || {})),
  json: () => Promise.resolve(JSON.parse(body || '{}')),
}));

// Ensure DOM elements are properly created for React 18
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Ensure document has proper structure
  if (typeof document !== 'undefined') {
    // Make sure documentElement exists
    if (!document.documentElement) {
      const html = document.createElement('html');
      document.appendChild(html);
    }
    
    // Make sure head exists
    if (!document.head) {
      const head = document.createElement('head');
      document.documentElement.appendChild(head);
    }
    
    // Make sure body exists and is properly attached
    if (!document.body) {
      const body = document.createElement('body');
      document.documentElement.appendChild(body);
    }
    
    // Clear any existing content
    document.body.innerHTML = '';
  }
});