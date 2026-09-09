type JwtToke = 'access' | 'refresh';

export type JwtPayload = {
  sub: string;
  email: string;
  tokenType: JwtToke;
};
