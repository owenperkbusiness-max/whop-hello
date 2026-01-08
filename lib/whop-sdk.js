import { WhopServerSdk } from "@whop/api";

export const whopSdk = WhopServerSdk({
  appId: process.env.WHOP_APP_ID || process.env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: process.env.WHOP_API_KEY,
});
