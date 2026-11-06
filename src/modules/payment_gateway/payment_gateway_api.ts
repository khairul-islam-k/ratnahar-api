import { BadGatewayException } from '@nestjs/common';
import { config } from 'process';

type GatewayName = 'BKASH' | 'ROCKET' | 'SSLCOMMERZ';
const BKASH_SANDBOX = "https://tokenized.sandbox.bka.sh";
const BKASH_LIVE = "https://tokenized.pay.bka.sh";

const SSLCOMMERZ_LIVE = "https://securepay.sslcommerz.com";
const SSLCOMMERZ_SANDBOX = "https://sandbox.sslcommerz.com";


export const getTokens = async (config: any, gatewayName: string) => {

  switch (gatewayName.trim().toUpperCase()) {
    case 'BKASH':
      const currentUrl = getCurrentUrl('BKASH', config?.isLive);
      const header = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': config?.gatewayData?.username,
        'password': config?.gatewayData?.password,
      };
      const body = {
        app_key: config?.gatewayData?.appKey,
        app_secret: config?.gatewayData?.appSecret,
      };

      return await authenticationToken(
        `${currentUrl}/v2/tokenized-checkout/auth/grant-token`,
        header,
        body,
      )
    case 'ROCKET':
      return '';
    case 'SSLCOMMERZ':
      return null;
    default:
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
  }
}

export const refreshToken = async (config: any) => {
  switch (config?.gatewayName?.trim().toUpperCase()) {
    case 'BKASH':
      const currentUrl = getCurrentUrl('BKASH', config?.isLive);
      const header = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': config?.gatewayData?.username,
        'password': config?.gatewayData?.password,
      };
      const body = {
        app_key: config?.gatewayData?.appKey,
        app_secret: config?.gatewayData?.appSecret,
        refresh_token: config?.gatewayData?.refresh_token,
      };

      return await refreshTokenApi(
        `${currentUrl}/v2/tokenized-checkout/auth/refresh-token`,
        header,
        body,
      )
    case 'ROCKET':
      return '';
    case 'SSLCOMMERZ':
      return null;
    default:
      throw new Error(`Unsupported payment gateway`);
  }
}

export const createPaymentApi = async (config: any, payload: any) => {
  switch (config?.gatewayName?.trim().toUpperCase()) {
    case 'BKASH': {
      const baseUrl = getCurrentUrl('BKASH', config?.isLive);

      const header = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-App-Key': config?.gatewayData?.appKey,
        Authorization: config?.gatewayData?.access_token,
      };

      const res = await callPaymentGateway(header, payload, `${baseUrl}/v2/tokenized-checkout/payment/create`);
      return res;

    }
    default:
      throw new Error(`Unsupported payment gateway: ${config?.gatewayName}`);
  }
}

const authenticationToken = async (url: string, header: any, body: any) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: header,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Authentication request failed (${response.status} ${response.statusText})${responseBody ? `: ${responseBody}` : ''
        }`,
      );
    }

    const responseBody = await response.text();
    try {
      return JSON.parse(responseBody) as unknown;
    } catch {
      throw new Error(
        `Authentication response was not valid JSON (HTTP ${response.status}): ${responseBody.slice(0, 500)}`,
      );
    }
  } catch (error: unknown) {
    throw error;
  }
}

const refreshTokenApi = async (url: string, header: any, body: any) => {
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: header,
  });

  return response.json();
}


export async function callPaymentGateway(header: any, payload: any, url: string) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: header,
    });

    const responseBody = await response.text();
    let result: unknown;
    try {
      result = responseBody ? JSON.parse(responseBody) as unknown : null;
    } catch {
      throw new Error(
        `Payment gateway returned invalid JSON (HTTP ${response.status}): ${responseBody.slice(0, 500)}`,
      );
    }

    if (!response.ok) {
      const gatewayMessage =
        typeof result === 'object' && result !== null && 'message' in result &&
          typeof result.message === 'string'
          ? result.message
          : response.statusText;

      if (response.status === 401 && /token has expired/i.test(gatewayMessage)) {
        throw new BadGatewayException(
          'bKash access token expired. Refresh the gateway token with the saved refresh token, then retry the payment.',
        );
      }

      throw new BadGatewayException(
        `Payment gateway request failed (${response.status} ${response.statusText}): ${gatewayMessage}`,
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
}


const getCurrentUrl = (gatewayName: GatewayName, isLive?: boolean) => {
  switch (gatewayName) {
    case 'BKASH':
      return isLive ? BKASH_LIVE : BKASH_SANDBOX;
    default:
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
  }
};
