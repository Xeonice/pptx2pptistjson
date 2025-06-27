// Jest setup file for test environment configuration

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.beforeEach(() => {
  jest.clearAllMocks();
});