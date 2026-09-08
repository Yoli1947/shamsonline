// Cliente compartido para la API de MiCorreo (Correo Argentino).
// Contrato real: "Correo Argentino - API MiCorreo.md" (doc entregado por Correo).
//
// Secrets requeridos (supabase secrets set ...):
//   CA_USER, CA_PASS               credenciales de la cuenta API (Basic Auth para /token)
//   CA_CUSTOMER_ID                 customerId asignado por Correo Argentino
//   CA_ORIGIN_POSTAL_CODE          CP desde donde salen los envíos (depósito/local)
//   CA_ENV                         "prod" para producción; cualquier otro valor (u omitido) usa QA

const CA_ENV = Deno.env.get('CA_ENV') === 'prod' ? 'prod' : 'qa';
const CA_BASE = CA_ENV === 'prod'
  ? 'https://api.correoargentino.com.ar/micorreo/v1'
  : 'https://apitest.correoargentino.com.ar/micorreo/v1';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getMicorreoToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const user = Deno.env.get('CA_USER');
  const pass = Deno.env.get('CA_PASS');
  if (!user || !pass) throw new Error('Faltan los secrets CA_USER / CA_PASS');

  const basic = btoa(`${user}:${pass}`);
  const res = await fetch(`${CA_BASE}/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}` },
  });

  if (!res.ok) {
    throw new Error(`No se pudo autenticar contra MiCorreo (${res.status})`);
  }

  const data = await res.json();
  cachedToken = data.token;
  // La documentación dice "expires", pero la API real devuelve "expire" (sin s).
  // Refrescamos un minuto antes de que venza para no pisar una request en curso.
  const expiresRaw = data.expire ?? data.expires;
  tokenExpiresAt = new Date(String(expiresRaw).replace(' ', 'T')).getTime() - 60_000;
  return cachedToken!;
}

export class MicorreoError extends Error {
  status: number;
  detail: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export async function micorreoRequest(
  method: string,
  path: string,
  opts: { body?: unknown; query?: Record<string, string> } = {}
) {
  const token = await getMicorreoToken();
  const qs = opts.query ? `?${new URLSearchParams(opts.query).toString()}` : '';

  const res = await fetch(`${CA_BASE}${path}${qs}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new MicorreoError(data.message || `Error de MiCorreo (${res.status})`, res.status, data);
  }
  return data;
}

export function getCaCustomerId(): string {
  const id = Deno.env.get('CA_CUSTOMER_ID');
  if (!id) throw new Error('Falta el secret CA_CUSTOMER_ID');
  return id;
}

export function getCaOriginPostalCode(): string {
  const cp = Deno.env.get('CA_ORIGIN_POSTAL_CODE');
  if (!cp) throw new Error('Falta el secret CA_ORIGIN_POSTAL_CODE');
  return cp;
}

// Nombres tal como salen del <select> de provincia en CheckoutModal.tsx,
// mapeados al código de una letra que pide la API de MiCorreo.
const PROVINCE_CODES: Record<string, string> = {
  'salta': 'A',
  'buenos aires': 'B',
  'caba': 'C',
  'ciudad autónoma de buenos aires': 'C',
  'ciudad autonoma de buenos aires': 'C',
  'capital federal': 'C',
  'san luis': 'D',
  'entre ríos': 'E',
  'entre rios': 'E',
  'la rioja': 'F',
  'santiago del estero': 'G',
  'chaco': 'H',
  'san juan': 'J',
  'catamarca': 'K',
  'la pampa': 'L',
  'mendoza': 'M',
  'misiones': 'N',
  'formosa': 'P',
  'neuquén': 'Q',
  'neuquen': 'Q',
  'río negro': 'R',
  'rio negro': 'R',
  'santa fe': 'S',
  'tucumán': 'T',
  'tucuman': 'T',
  'chubut': 'U',
  'tierra del fuego': 'V',
  'corrientes': 'W',
  'córdoba': 'X',
  'cordoba': 'X',
  'jujuy': 'Y',
  'santa cruz': 'Z',
};

export function toProvinceCode(name: string): string {
  const code = PROVINCE_CODES[(name || '').trim().toLowerCase()];
  if (!code) throw new Error(`Provincia no reconocida por MiCorreo: "${name}"`);
  return code;
}
