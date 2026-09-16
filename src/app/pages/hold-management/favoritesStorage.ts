// Favorited (starred) order ids — shared across Order Listing, Order Details, and the Overview page's
// Favorites card. Each of those is a separate route (see App.tsx), so plain component state would be lost
// on navigation; localStorage persistence mirrors the existing "My Holds" group pattern in
// HoldManagementOverview.tsx and the email templates store.
const FAVORITES_STORAGE_KEY = "intellisight.holdManagement.favorites";

export function loadFavoriteOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveFavoriteOrderIds(ids: string[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private browsing, quota) — favorites just won't persist across reloads.
  }
}
