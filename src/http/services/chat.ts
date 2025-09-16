import { $fetch } from "../fetch";
export const GetUsersAPI = async (queryParams: any) => {
  try {
    const response = await $fetch.get("users", queryParams);
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
