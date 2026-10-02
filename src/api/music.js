import apiClient from './client';

export const fetchHomeMusic = async () => {
  return await apiClient.get('/music/home');
};

export const searchMusic = async (query = '', genre = '') => {
  return await apiClient.get('/music/search', {
    params: { q: query, genre },
  });
};

export const fetchLikedSongs = async () => {
  return await apiClient.get('/music/liked');
};

export const toggleLikeSong = async (songId) => {
  return await apiClient.post(`/music/songs/${songId}/like`);
};

export const fetchUserPlaylists = async () => {
  return await apiClient.get('/music/playlists');
};

export const createPlaylist = async (data) => {
  return await apiClient.post('/music/playlists', data);
};

export const fetchPlaylistDetails = async (id) => {
  return await apiClient.get(`/music/playlists/${id}`);
};

export const addSongToPlaylist = async (playlistId, songId) => {
  return await apiClient.post(`/music/playlists/${playlistId}/songs`, { songId });
};

export const removeSongFromPlaylist = async (playlistId, songId) => {
  return await apiClient.delete(`/music/playlists/${playlistId}/songs/${songId}`);
};

export const fetchArtistDetails = async (id) => {
  return await apiClient.get(`/music/artists/${id}`);
};

export const toggleFollowArtist = async (id) => {
  return await apiClient.post(`/music/artists/${id}/follow`);
};

export const fetchUserLibrary = async () => {
  return await apiClient.get('/music/library');
};
