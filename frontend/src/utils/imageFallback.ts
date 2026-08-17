// High-definition Genre Photography Palettes for zero-broken image rendering
export const GENRE_FALLBACK_IMAGES: Record<string, string[]> = {
  Action: [
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=600&auto=format&fit=crop&q=80"
  ],
  Adventure: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
  ],
  "Science Fiction": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
  ],
  "Sci-Fi": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80"
  ],
  Thriller: [
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80"
  ],
  Horror: [
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
  ],
  Drama: [
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80"
  ],
  Crime: [
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80"
  ],
  Romance: [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80"
  ],
  Animation: [
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80"
  ],
  Comedy: [
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80"
  ]
};

export const DEFAULT_BACKDROP = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80";

export function getClientGenreFallback(title?: string, genres?: string[]): string {
  const gList = Array.isArray(genres) && genres.length > 0 ? genres : ['Drama'];
  for (const g of gList) {
    if (GENRE_FALLBACK_IMAGES[g]) {
      const palette = GENRE_FALLBACK_IMAGES[g];
      const charSum = (title || 'Film').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return palette[charSum % palette.length];
    }
  }
  return GENRE_FALLBACK_IMAGES.Drama[0];
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  title?: string,
  _year?: number | string,
  genres?: string[],
  _director?: string
) {
  const target = e.target as HTMLImageElement;
  const fallback = getClientGenreFallback(title, genres);
  
  if (target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
}
