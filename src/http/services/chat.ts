import { $fetch } from "../fetch";
export const GetUsersAPI = async () => {
  try {
    const response = await $fetch.get("users");
    return response;
  } catch (error) {
    return error;
  }
};

export const AddConversationAPI = async (payload) => {
  try {
    const response = await $fetch.post("conversations", payload);
    return response;
  } catch (error) {
    return error;
  }
};

export const GetConversationsAPI = async () => {
  try {
    const response = await $fetch.get("conversations");
    return response;
  } catch (error) {
    return error;
  }
};

export const SendMessageAPI = async (payload) => {
  try {
    const response = await $fetch.post("messages", payload);
    return response;
  } catch (error) {
    return error;
  }
};
