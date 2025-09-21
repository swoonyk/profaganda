export function normalizeReview(text: string): string {
  let normalized = text.replace(/<[^>]*>/g, '');
  
  normalized = normalized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  normalized = normalized.trim();
  
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized;
}

export function isReviewUsable(text: string, minLength: number = 30, maxLength: number = 3000): boolean {
  const normalized = normalizeReview(text);
  
  if (!normalized || normalized.length < minLength) {
    return false;
  }
  
  if (normalized.length > maxLength) {
    return false;
  }
  
  const uniqueChars = new Set(normalized.toLowerCase().replace(/\s/g, '')).size;
  if (uniqueChars < 5) {
    return false;
  }
  
  return true;
}
