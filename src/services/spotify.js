const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiration = 0;

export async function getSpotifyToken() {
  if (accessToken && Date.now() < tokenExpiration) {
    return accessToken;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiration = Date.now() + data.expires_in * 1000 - 60000;
  return accessToken;
}

export async function searchTracks(query) {
  if (!query || query.trim().length < 2) return [];

  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  
  return (data.tracks?.items || [])
    .filter((track) => track.preview_url)
    .map((track) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      coverUrl: track.album.images[0]?.url,
      audioUrl: track.preview_url,
      externalUrl: track.external_urls.spotify,
    }));
}
