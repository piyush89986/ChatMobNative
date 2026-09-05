import apiClient from './client';

export const getMyProfile = async () => {
  return await apiClient.get('/users/me');
};

export const updateProfile = async ({ user_name, email, gender, bio, address }) => {
  return await apiClient.patch('/users', {
    user_name,
    email,
    gender,
    bio,
    address,
  });
};

export const searchUsers = async (query) => {
  return await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
};

export const uploadAvatar = async (formData) => {
  return await apiClient.patch('/users/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAccount = async () => {
  return await apiClient.delete('/users');
};
