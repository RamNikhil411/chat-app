export const handleAPIErrorResponse = async (response: any) => {
  switch (response?.status) {
    case 422:
      return {
        type: "VALIDATION_ERROR",
        message: response?.message,
        error_data: response?.errors,
        status: response?.status,
      };
    case 409:
      return {
        type: "CONFLICT",
        message: response?.message,
        error_data: response?.errors,
        status: response?.status,
      };
    case 401:
      return {
        type: "Invalid_Credentials",
        message: response?.message,
        error_data: response?.message,
        status: response?.status,
      };
    case 400:
      return {
        type: "BAD_REQUEST",
        message: response?.message,
        error_data: response?.error,
        status: response?.status,
      };
    case 403:
      return {
        type: "FORBIDDEN",
        message: response?.message,
        error_data: response?.error,
        status: response?.status,
      };

    default:
      return {
        type: "OTHER",
        message: response?.message,
        error_data: response?.error,
        status: response?.status,
      };
  }
};
