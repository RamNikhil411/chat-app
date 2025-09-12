import Cookies from "js-cookie";
import prepareURLEncodedParams from "./prepareURLEncodedParams";

interface IAPIResponse {
  success: boolean;
  status: number;
  data: any;
  message?: any;
}

class FetchService {
  authStatusCodes: number[] = [401, 403, 404];
  authErrorURLs: string[] = [
    "/auth/signin-with-phone",
    "/auth/signin-with-email",
  ];

  private _fetchType: string;
  constructor(fetchTypeValue = "json") {
    this._fetchType = fetchTypeValue;
  }

  configureAuthorization(config: any) {
    let accessToken = Cookies.get("token") || "";
    config.headers["Authorization"] = "Bearer " + accessToken;
  }

  setHeader(config: any) {
    config.headers = {};
  }

  setDefaultHeaders(config: any) {
    config.headers = config.headers || {};
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }

  checkToLogOutOrNot(path: string) {
    return this.authErrorURLs.some((arrayUrl: string) =>
      path.includes(arrayUrl)
    );
  }

  isAuthRequest(path: string) {
    return this.authErrorURLs.includes(path);
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = Cookies.get("refreshToken");

    if (!refreshToken) {
      window.location.href = "/";
      return null;
    }

    try {
      const response = await fetch(
        import.meta.env.VITE_PUBLIC_API_URL + "/auth/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        window.location.href = "/";
        return null;
      }

      const data = await response.json();
      Cookies.set("token", data.accessToken);
      return data.accessToken;
    } catch (error) {
      window.location.href = "/";
      return null;
    }
  }

  async hit(...args: any): Promise<IAPIResponse> {
    let [path, config] = args;
    config.headers = config.headers || {};
    if (!config.headers["Content-Type"]) {
      this.setDefaultHeaders(config);
    }

    if (!this.isAuthRequest(path)) {
      this.configureAuthorization(config);
    }

    let url = import.meta.env.VITE_PUBLIC_API_URL + path;
    // Debug log
    let response: any = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401 && !this.checkToLogOutOrNot(path)) {
        const newToken = await this.refreshAccessToken();
        if (newToken) {
          config.headers["Authorization"] = "Bearer " + newToken;
          response = await fetch(url, config);
        }
      }

      if (
        this.authStatusCodes.includes(response.status) &&
        !this.checkToLogOutOrNot(path)
      ) {
        const contentType = response.headers.get("Content-Type") || "";
        let errorData;
        try {
          errorData = contentType.includes("text/html")
            ? await response.text()
            : await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        return {
          success: false,
          status: response.status,
          data: errorData,
          message: response.statusText,
        };
      }

      const contentType = response.headers.get("Content-Type") || "";
      let errorData;
      try {
        errorData = contentType.includes("text/html")
          ? await response.text()
          : await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      let err: any = new Error(errorData.message || response.statusText);
      err.data = errorData;
      err.status = response.status;
      throw err;
    }

    if (this._fetchType === "response") {
      return response;
    } else {
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/html")) {
        return {
          success: true,
          status: response.status,
          data: await response.text(),
        };
      }
      return {
        success: true,
        status: response.status,
        data: await response.json(),
      };
    }
  }

  async post(url: string, payload?: any) {
    return await this.hit(url, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  }

  async postFormData(url: string, file?: File) {
    return await this.hit(url, {
      method: "POST",
      body: file,
    });
  }

  async get(url: string, queryParams = {}, contentType?: string) {
    if (Object.keys(queryParams).length) {
      url = prepareURLEncodedParams(url, queryParams);
    }
    const config: any = {
      method: "GET",
      headers: {},
    };
    this.setDefaultHeaders(config);
    if (contentType) {
      config.headers["Content-Type"] = contentType;
      config.headers["Accept"] = contentType;
    }
    return this.hit(url, config);
  }

  async delete(url: string, payload = {}) {
    return this.hit(url, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });
  }

  async deleteWithOutPayload(url: string) {
    return this.hit(url, {
      method: "DELETE",
    });
  }

  async put(url: string, payload = {}) {
    return this.hit(url, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async patch(url: string, payload = {}) {
    return this.hit(url, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
}

export const $fetch = new FetchService();
export const $fetchResponse = new FetchService("response");
