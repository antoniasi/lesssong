export default async function handler(req, res) {
  const { query } = req.query;
  const searchQuery = query || 'Damian Marley Welcome To Jamrock';

  try {
    // Busca direto na API do iTunes (retorna trechos de áudio de 30s 100% reais e sem DRM)
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&entity=song&limit=12`
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Erro ao buscar músicas' });
    }

    const data = await response.json();

    const tracks = (data.results || [])
      .filter((track) => track.previewUrl) // Filtra apenas o que tem áudio real
      .map((track) => ({
        id: String(track.trackId),
        title: track.trackName,
        artist: track.artistName,
        album: track.collectionName,
        coverUrl: track.artworkUrl100?.replace('100x100bb', '300x300bb'), // Capa em alta resolução
        audioUrl: track.previewUrl, // Áudio MP3 real de 30s da música exata!
        externalUrl: track.trackViewUrl,
      }));

    return res.status(200).json(tracks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
