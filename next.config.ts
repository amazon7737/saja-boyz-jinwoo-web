import type { NextConfig } from 'next';
import { HTML_LIMITED_BOT_UA_RE } from 'next/dist/shared/lib/router/utils/html-bots';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  htmlLimitedBots: new RegExp(
    `${HTML_LIMITED_BOT_UA_RE.source}|kakaotalk-scrap`,
    'i',
  ),
};
export default nextConfig;
