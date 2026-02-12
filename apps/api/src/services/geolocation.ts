/**
 * IP Geolocation Service
 * Detects user country from IP address
 */

interface GeolocationData {
  ip: string;
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Get geolocation data from IP address using ipapi.co
 * Free tier: 30k requests/month
 */
export async function getGeolocationFromIP(ip: string): Promise<GeolocationData | null> {
  try {
    // Clean IP address (remove IPv6 prefix if present)
    const cleanIP = ip.includes("::ffff:") ? ip.split("::ffff:")[1] ?? ip : ip;

    // Skip localhost/private IPs
    if (cleanIP === "127.0.0.1" || cleanIP === "::1" || cleanIP.startsWith("192.168.") || cleanIP.startsWith("10.")) {
      return {
        ip: cleanIP,
        country: "Local",
        countryCode: "LOCAL",
        city: "Localhost"
      };
    }

    // Use ipapi.co (free tier, no API key needed for basic info)
    const response = await fetch(`https://ipapi.co/${cleanIP}/json/`);

    if (!response.ok) {
      console.error("Geolocation API error:", response.status);
      return null;
    }

    const data = await response.json() as Record<string, any>;

    return {
      ip: cleanIP,
      country: data.country_name || "Unknown",
      countryCode: data.country_code || "XX",
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude
    };
  } catch (error) {
    console.error("Failed to get geolocation:", error);
    return null;
  }
}

/**
 * Get IP from request headers (handles proxies)
 */
export function getClientIP(request: Request, headers?: Headers): string {
  // Check CloudFlare headers first
  const cfIP = headers?.get("CF-Connecting-IP");
  if (cfIP) return cfIP;

  // Check other common proxy headers
  const forwardedFor = headers?.get("X-Forwarded-For");
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0]?.trim() ?? forwardedFor;
  }

  const realIP = headers?.get("X-Real-IP");
  if (realIP) return realIP;

  // Fallback to request URL (for WebSocket)
  try {
    const url = new URL(request.url);
    // In dev, this will be localhost, in prod it should be the actual IP
    return url.hostname;
  } catch {
    return "127.0.0.1";
  }
}

/**
 * Get country from CloudFlare headers (if available)
 */
export function getCountryFromCFHeaders(headers: Headers): string | null {
  const cfCountry = headers.get("CF-IPCountry");
  return cfCountry && cfCountry !== "XX" ? cfCountry : null;
}

/**
 * Format location string for display
 */
export function formatLocation(geo: GeolocationData | null): string {
  if (!geo) return "Unknown";

  if (geo.countryCode === "LOCAL") return "Local Development";

  const parts = [];
  if (geo.city) parts.push(geo.city);
  if (geo.region && geo.region !== geo.city) parts.push(geo.region);
  if (geo.country) parts.push(geo.country);

  return parts.join(", ") || "Unknown";
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode === "XX" || countryCode === "LOCAL") return "🌍";

  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}