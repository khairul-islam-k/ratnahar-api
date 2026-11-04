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
      // SSLCommerz uses store credentials directly when creating a payment;
      // it does not use the bKash token grant flow.
      return null;
    default:
      throw new Error(`Unsupported payment gateway: ${gatewayName}`);
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
        `Authentication request failed (${response.status} ${response.statusText})${
          responseBody ? `: ${responseBody}` : ''
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


export async function callPaymentGateway() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'foo',
        body: 'bar',
        userId: 1,
      }),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.log(error);
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
