const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

export function apiUrl(path: string) {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return `${apiBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
