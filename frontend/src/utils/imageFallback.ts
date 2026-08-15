// Dynamic Cinema Poster Generator for error fallbacks & unlisted titles
export function generateClientCinemaPoster(
  title?: string,
  year?: number | string,
  genres?: string[],
  director?: string
): string {
  const safeTitle = (title || 'Movie').replace(/[<>&"]/g, '');
  const safeYear = year ? String(year) : '';
  const safeGenre = Array.isArray(genres) && genres.length > 0 ? genres[0] : 'Feature Film';
  const safeDirector = director && director !== 'Unknown' ? `Dir. ${director}` : '';

  let gradient1 = '#0f172a';
  let gradient2 = '#1e1b4b';
  let accent = '#818cf8';

  if (safeGenre.includes('Action') || safeGenre.includes('Adventure')) {
    gradient2 = '#31102e';
    accent = '#f43f5e';
  } else if (safeGenre.includes('Sci-Fi') || safeGenre.includes('Science Fiction')) {
    gradient2 = '#083344';
    accent = '#38bdf8';
  } else if (safeGenre.includes('Horror') || safeGenre.includes('Thriller')) {
    gradient2 = '#1c1917';
    accent = '#ef4444';
  } else if (safeGenre.includes('Animation') || safeGenre.includes('Family')) {
    gradient2 = '#2e1065';
    accent = '#a855f7';
  } else if (safeGenre.includes('Romance')) {
    gradient2 = '#4c0519';
    accent = '#fb7185';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 750" width="500" height="750">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${gradient1}" />
        <stop offset="100%" stop-color="${gradient2}" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="transparent" />
        <stop offset="60%" stop-color="rgba(2,6,23,0.5)" />
        <stop offset="100%" stop-color="rgba(2,6,23,0.95)" />
      </linearGradient>
    </defs>
    <rect width="500" height="750" fill="url(#bg)" />
    
    <rect x="20" y="20" width="460" height="710" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" rx="12" />
    <circle cx="250" cy="220" r="100" fill="rgba(255,255,255,0.03)" />
    <circle cx="250" cy="220" r="65" fill="none" stroke="${accent}" stroke-width="2" opacity="0.4" stroke-dasharray="6,6" />
    
    <!-- Film Reel Logo -->
    <path d="M 220 190 L 280 190 L 280 250 L 220 250 Z" fill="none" stroke="${accent}" stroke-width="3" rx="4" opacity="0.8" />
    <polygon points="238,205 238,235 265,220" fill="${accent}" opacity="0.9" />

    <rect width="500" height="750" fill="url(#overlay)" />

    <!-- Badge -->
    <rect x="40" y="520" width="auto" height="26" rx="6" fill="rgba(255,255,255,0.1)" />
    <text x="45" y="538" fill="${accent}" font-family="Arial, sans-serif" font-size="12" font-weight="bold" letter-spacing="1.5">${safeGenre.toUpperCase()}${safeYear ? ' • ' + safeYear : ''}</text>

    <!-- Title -->
    <text x="40" y="590" fill="#ffffff" font-family="'Helvetica Neue', Arial, sans-serif" font-size="30" font-weight="900" letter-spacing="-0.5">${safeTitle.length > 20 ? safeTitle.substring(0, 18) + '...' : safeTitle}</text>
    
    <!-- Director -->
    <text x="40" y="625" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14" font-weight="500">${safeDirector}</text>
    
    <text x="40" y="690" fill="rgba(255,255,255,0.4)" font-family="Arial, sans-serif" font-size="10" letter-spacing="2">CINEMATCH AI • CINEMA POSTER</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_BACKDROP = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80";

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  title?: string,
  year?: number | string,
  genres?: string[],
  director?: string
) {
  const target = e.target as HTMLImageElement;
  const fallback = generateClientCinemaPoster(title, year, genres, director);
  
  if (target.src !== fallback) {
    target.onerror = null;
    target.src = fallback;
  }
}
