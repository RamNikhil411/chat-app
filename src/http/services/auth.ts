import { $fetch } from "../fetch";
export const SignUpAPI = async (payload) => {
  try {
    const response = await $fetch.post("auth/signup", payload);
    return response;
  } catch (error) {
    return error;
  }
};

export const LoginAPI = async (payload) => {
  try {
    const response = await $fetch.post("auth/signin", payload);
    return response;
  } catch (error) {
    return error;
  }
};
