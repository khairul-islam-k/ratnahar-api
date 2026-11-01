import axios, { type AxiosInstance } from 'axios';

export interface BkashTokenResponse {
  id_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  [key: string]: unknown;
}

/** Request a bKash grant token with the merchant and application credentials. */
export async function getBkashToken(
  baseURL: string,
  username: string,
  password: string,
  appKey: string,
  appSecret: string,
): Promise<BkashTokenResponse> {
  const credentials = { username, password, appKey, appSecret };
  for (const [name, value] of Object.entries(credentials)) {
    if (!value.trim()) {
      throw new Error(`bKash ${name} is required`);
    }
  }

  const { data } = await axios.post<BkashTokenResponse>(
    '/tokenized/checkout/token/grant',
    { app_key: appKey, app_secret: appSecret },
    {
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        username,
        password,
      },
    },
  );

  return data;
}

/** Create an Axios client for bKash APIs using credentials obtained at runtime. */
export function createBkashApiClient(
  baseURL: string,
  appKey: string,
  grantToken: string,
): AxiosInstance {
  if (!appKey.trim()) {
    throw new Error('bKash X-App-Key is required');
  }
  if (!grantToken.trim()) {
    throw new Error('bKash grant token is required');
  }

  return axios.create({
    baseURL,
    headers: {
      'X-App-Key': appKey,
      Authorization: `Bearer ${grantToken}`,
      'Content-Type': 'application/json',
    },
  });
}



