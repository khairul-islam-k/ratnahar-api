export type AuthUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  type: string;
};

export type RefreshAuthUser = AuthUser & {
  refreshToken: string;
};
