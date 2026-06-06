import { SourceType } from './types';

export function detectSource(url: string): SourceType {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) {
    return 'facebook';
  }
  if (u.trim() === '') return 'manual';
  return 'other';
}

export function sourceLabel(type: SourceType): string {
  switch (type) {
    case 'tiktok':
      return 'TikTok';
    case 'facebook':
      return 'Facebook';
    case 'other':
      return 'Web';
    default:
      return 'Manual';
  }
}
