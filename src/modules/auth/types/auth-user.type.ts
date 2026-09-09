export type AuthUser = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export type RefreshAuthUser = AuthUser & {
  refreshToken: string;
};
