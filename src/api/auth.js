import apiClient from './client';

export const registerUser = async ({ user_name, email, phone, password }) => {
  return await apiClient.post('/auth/register', {
    user_name,
    email,
    phone,
    password,
  });
};

export const loginUser = async ({ login_user, password }) => {
  return await apiClient.post('/auth/login', {
    login_user,
    password,
  });
};
