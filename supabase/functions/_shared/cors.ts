export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://shamsonline.com.ar',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_ORIGINS = [
  'https://shamsonline.com.ar',
  'https://www.shamsonline.com.ar',
  'https://admin.shamsonline.com.ar',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
