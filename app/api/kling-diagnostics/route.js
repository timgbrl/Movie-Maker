import { klingConnectivityCheck } from '@/lib/kling';
import { shouldUseMockData } from '@/lib/openai';

export async function GET() {
  const diagnostics = await klingConnectivityCheck();

  return Response.json({
    useMockData: shouldUseMockData(),
    hasKlingApiKey: Boolean(process.env.KLING_API_KEY?.trim()),
    klingApiBaseUrl: process.env.KLING_API_BASE_URL || '',
    klingCreateUrlOverride: process.env.KLING_CREATE_URL || '',
    klingStatusUrlTemplateOverride: process.env.KLING_STATUS_URL_TEMPLATE || '',
    proxy: {
      httpsProxySet: Boolean(process.env.HTTPS_PROXY),
      httpProxySet: Boolean(process.env.HTTP_PROXY),
      allProxySet: Boolean(process.env.ALL_PROXY)
    },
    diagnostics
  });
}
