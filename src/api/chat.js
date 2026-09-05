import apiClient from './client';

export const getMyChats = async () => {
  return await apiClient.get('/chat');
};

export const accessOrCreateChat = async (receiverId) => {
  return await apiClient.post('/chat/access', { receiverId });
};

export const createGroupChat = async ({ members, groupName }) => {
  return await apiClient.post('/chat/group', { members, groupName });
};

export const sendMessage = async ({ chatId, message, attachment }) => {
  return await apiClient.post('/chat/send-message', {
    chatId,
    message,
    attachment,
  });
};

export const getMessages = async (chatId, page = 1, limit = 100) => {
  return await apiClient.get(`/chat/m/${chatId}?page=${page}&limit=${limit}`);
};

export const acceptChatRequest = async (chatId) => {
  return await apiClient.patch(`/chat/accept/${chatId}`);
};

export const declineChatRequest = async (chatId) => {
  return await apiClient.delete(`/chat/decline/${chatId}`);
};
