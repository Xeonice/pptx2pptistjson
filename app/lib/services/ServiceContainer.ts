/**
 * Simple dependency injection container
 */
export class ServiceContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();
  private singletons: Map<string, any> = new Map();

  /**
   * Register a service instance
   */
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  /**
   * Register a factory function for creating services
   */
  registerFactory<T>(name: string, factory: () => T, singleton = true): void {
    this.factories.set(name, factory);
    if (!singleton) {
      // Mark as non-singleton by removing from singletons if exists
      this.singletons.delete(name);
    }
  }

  /**
   * Register a class constructor
   */
  registerClass<T>(name: string, ClassConstructor: new (...args: any[]) => T, singleton = true): void {
    this.registerFactory(name, () => {
      // Simple constructor without reflection for now
      return new ClassConstructor();
    }, singleton);
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    // Check if we have a direct instance
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check if we have a singleton
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check if we have a factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      if (factory) {
        const instance = factory();
        
        // Store as singleton by default
        this.singletons.set(name, instance);
        return instance;
      }
    }

    throw new Error(`Service '${name}' not found in container`);
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name) || this.singletons.has(name);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

/**
 * Global service container instance
 */
export const container = new ServiceContainer();

// Note: Decorators and reflection metadata support will be added in future versions