export class IdGenerator {
  private usedIds: Set<string> = new Set();
  private idCounters: Map<string, number> = new Map();

  /**
   * Generates a unique ID, handling duplicates by appending a counter
   */
  generateUniqueId(originalId: string | undefined, elementType?: string): string {
    // If no original ID, generate one based on element type
    if (!originalId || originalId === 'unknown') {
      return this.generateNewId(elementType || 'element');
    }

    // Check if ID already exists
    if (!this.usedIds.has(originalId)) {
      this.usedIds.add(originalId);
      return originalId;
    }

    // Handle duplicate by appending counter
    let counter = 1;
    let uniqueId = `${originalId}_${counter}`;
    
    while (this.usedIds.has(uniqueId)) {
      counter++;
      uniqueId = `${originalId}_${counter}`;
    }

    this.usedIds.add(uniqueId);
    return uniqueId;
  }

  /**
   * Generates a new ID when no original ID is available
   */
  private generateNewId(prefix: string): string {
    const counter = (this.idCounters.get(prefix) || 0) + 1;
    this.idCounters.set(prefix, counter);
    
    const id = `${prefix}_${counter}`;
    this.usedIds.add(id);
    return id;
  }

  /**
   * Resets the ID generator state
   */
  reset(): void {
    this.usedIds.clear();
    this.idCounters.clear();
  }

  /**
   * Returns all used IDs for debugging
   */
  getUsedIds(): string[] {
    return Array.from(this.usedIds);
  }
}