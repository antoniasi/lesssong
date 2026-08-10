export default async function handler(req, res) {
  const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET;

  const { query } = req.query;

  try {
    // 1. Obter Token no Backend da Vercel (Sem bloqueio de CORS)
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!tokenResponse.ok) {
      return res.status(500).json({ error: 'Erro ao autenticar no Spotify' });
    }

    const { access_token } = await tokenResponse.json();

    // 2. Buscar Músicas no Spotify
    const searchQuery = query || 'Roots Reggae';
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=15`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await spotifyResponse.json();

    // Filtra e formata apenas faixas com prévia de áudio (preview_url)
    const tracks = (data.tracks?.items || [])
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

    return res.status(200).json(tracks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
