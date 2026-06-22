export function getVideoThumbnailUrl(videoUrl: string | null | undefined): string | null {
  if (!videoUrl) return null;
  const lastDotIndex = videoUrl.lastIndexOf('.');
  if (lastDotIndex === -1) return null;
  return videoUrl.slice(0, lastDotIndex) + '.jpg';
}
