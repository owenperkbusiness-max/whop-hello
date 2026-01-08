import Whop from "@whop/sdk";

export const whopsdk = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.WHOP_APP_ID || process.env.NEXT_PUBLIC_WHOP_APP_ID,
});
