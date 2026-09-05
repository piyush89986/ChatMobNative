import apiClient from './client';

export const getFeedPosts = async (page = 1, limit = 20) => {
  return await apiClient.get(`/posts?page=${page}&limit=${limit}`);
};

export const createPost = async (payload) => {
  return await apiClient.post('/posts', payload);
};

export const toggleLike = async (postId) => {
  return await apiClient.post(`/posts/${postId}/like`);
};

export const addComment = async (postId, text) => {
  return await apiClient.post(`/posts/${postId}/comment`, { text });
};

export const getUserPosts = async (userId) => {
  return await apiClient.get(`/posts/user/${userId}`);
};

export const getStories = async () => {
  return await apiClient.get('/posts/stories');
};

export const createStory = async (payload) => {
  return await apiClient.post('/posts/stories', payload);
};

export const getNotifications = async () => {
  return await apiClient.get('/posts/notifications');
};
