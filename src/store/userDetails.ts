import { Store } from "@tanstack/react-store";

interface UserState {
  user: any;
}

function loadUserState(): UserState {
  try {
    if (typeof window == "undefined") return { user: null };
    const savedState = localStorage.getItem("userDetails");
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (error) {}
    }
    return { user: null };
  } catch (error) {
    return { user: null };
  }
}

const initialState: UserState = loadUserState();

export const userStore = new Store<UserState>(initialState);

export const updateUserStore = (updates: Partial<UserState>) => {
  userStore.setState((state) => ({
    ...state,
    ...updates,
  }));
  if (typeof window == "undefined") return;
  localStorage.setItem("userDetails", JSON.stringify(userStore.state));
};

export const getUserState = (): UserState => {
  return userStore.state;
};
