/**
 * Generates a stable key for React lists based on item properties
 * @param item - The item to generate a key for
 * @param index - Optional index to use as fallback
 * @returns A stable string key
 */
export function generateStableKey(item: any, index?: number): string {
    // If the item has an id, use it
    if (item && item.id) {
      return `item-${item.id}`;
    }
    
    // If the item has a unique identifier like uuid or slug, use it
    if (item && item.uuid) {
      return `item-${item.uuid}`;
    }
    
    if (item && item.slug) {
      return `item-${item.slug}`;
    }
    
    // Use a combination of properties if available
    if (item && typeof item === 'object') {
      const propertyValues = Object.values(item)
        .filter(val => typeof val === 'string' || typeof val === 'number')
        .join('-');
        
      if (propertyValues.length > 0) {
        return `item-${propertyValues}`;
      }
    }
    
    // Fall back to index if provided
    if (index !== undefined) {
      return `item-${index}`;
    }
    
    // Last resort: random number + timestamp
    return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }