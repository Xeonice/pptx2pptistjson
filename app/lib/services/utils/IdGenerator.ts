export class IdGenerator {
  private usedIds: Set<string> = new Set();
  private idCounters: Map<string, number> = new Map();

  /**
   * Generates a unique ID, handling duplicates by appending a counter
   */
  generateUniqueId(originalId: string | undefined, elementType?: string): string {
    // For shapes, try to use original PowerPoint ID if it exists and looks like PPTist format
    if (elementType === 'shape' && originalId && this.isPPTistLikeId(originalId)) {
      if (!this.usedIds.has(originalId)) {
        this.usedIds.add(originalId);
        return originalId;
      }
    }
    
    // Generate PPTist-style IDs for better compatibility
    return this.generateNewId(elementType || 'element');
  }

  /**
   * Check if an ID looks like PPTist format (mix of letters, numbers, special chars)
   */
  private isPPTistLikeId(id: string): boolean {
    // PPTist IDs are typically 6-12 characters with letters, numbers, and - or _
    return /^[a-zA-Z0-9_-]{6,12}$/.test(id);
  }

  /**
   * Generates a new ID when no original ID is available
   */
  private generateNewId(prefix: string): string {
    const counter = (this.idCounters.get(prefix) || 0) + 1;
    this.idCounters.set(prefix, counter);
    
    // Generate PPTist-style ID: random-looking alphanumeric with some special chars
    const id = this.generatePPTistStyleId();
    this.usedIds.add(id);
    return id;
  }

  /**
   * Generates a PPTist-style ID (10 characters, alphanumeric with occasional special chars)
   */
  private generatePPTistStyleId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const specialChars = '-_';
    let result = '';
    
    for (let i = 0; i < 10; i++) {
      if (i > 0 && Math.random() < 0.1) {
        // 10% chance for special character (but not as first character)
        result += specialChars[Math.floor(Math.random() * specialChars.length)];
      } else {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    // Ensure uniqueness
    if (this.usedIds.has(result)) {
      return this.generatePPTistStyleId(); // Recursive call if collision
    }
    
    return result;
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