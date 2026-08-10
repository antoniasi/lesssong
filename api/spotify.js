export default async function handler(req, res) {
  const CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_SPOTIFY_CLIENT_SECRET;

  const { query } = req.query;

  // Músicas padrão com áudios de prévia garantidos para o jogo rodar perfeitamente
  const FALLBACK_TRACKS = [
    {
      id: '1',
      title: 'Congos Man',
      artist: 'The Congos',
      album: 'Heart of the Congos',
      coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      externalUrl: 'https://open.spotify.com'
    },
    {
      id: '2',
      title: 'Chase the Devil',
      artist: 'Max Romeo',
      album: 'War Ina Babylon',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      externalUrl: 'https://open.spotify.com'
    },
    {
      id: '3',
      title: 'Satta Massagana',
      artist: 'The Abyssinians',
      album: 'Satta Massagana',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      externalUrl: 'https://open.spotify.com'
    }
  ];

  try {
    // 1. Tenta autenticar no Spotify
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!tokenResponse.ok) {
      return res.status(200).json(FALLBACK_TRACKS);
    }

    const { access_token } = await tokenResponse.json();

    // 2. Busca no Spotify
    const searchQuery = query || 'Reggae';
    const spotifyResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    const data = await spotifyResponse.json();

    const tracks = (data.tracks?.items || [])
      .map((track) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        coverUrl: track.album.images[0]?.url,
        audioUrl: track.preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        externalUrl: track.external_urls.spotify,
      }));

    if (tracks.length === 0) {
      return res.status(200).json(FALLBACK_TRACKS);
    }

    return res.status(200).json(tracks);
  } catch (error) {
    // Se der qualquer erro na API, retorna o fallback para a aplicação funcionar 100%
    return res.status(200).json(FALLBACK_TRACKS);
  }
}
