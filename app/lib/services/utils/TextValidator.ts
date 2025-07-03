/**
 * Utility functions for validating text content
 */

/**
 * Check if text content has valid, meaningful text
 * This helps determine if an element should be treated as text or shape
 */
export function hasValidText(content: string | undefined): boolean {
  if (!content) return false;
  
  // Remove HTML tags if present
  const textWithoutTags = content.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  const trimmedText = textWithoutTags.trim();
  
  // Check if there's any meaningful content
  return trimmedText.length > 0;
}

/**
 * Extract text content from HTML string
 */
export function extractTextFromHtml(html: string): string {
  // Remove HTML tags
  const textWithoutTags = html.replace(/<[^>]*>/g, '');
  
  // Replace HTML entities
  const text = textWithoutTags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  return text.trim();
}