/** Convert a stored MinIO object name (e.g. "mp/uuid.jpg") to a browser URL via the Nginx /photos/ proxy. */
export function photoUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `/photos/${path}`;
}
