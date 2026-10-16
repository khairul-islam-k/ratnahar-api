export type AuthUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  type: string;
  tenantId: string | null;
};

export type RefreshAuthUser = AuthUser & {
  refreshToken: string;
};
