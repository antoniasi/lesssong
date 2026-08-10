export async function searchTracks(query = 'Roots Reggae') {
  try {
    const response = await fetch(`/api/spotify?query=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Erro na busca:', error);
    return [];
  }
}
