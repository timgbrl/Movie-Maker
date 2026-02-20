import { klingConnectivityCheck } from '@/lib/kling';
import { shouldUseMockData } from '@/lib/openai';

export async function GET() {
  const diagnostics = await klingConnectivityCheck();

  return Response.json({
    useMockData: shouldUseMockData(),
    hasKlingApiKey: Boolean(process.env.KLING_API_KEY?.trim()),
    klingApiBaseUrl: process.env.KLING_API_BASE_URL || '',
    diagnostics
  });
}
