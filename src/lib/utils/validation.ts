import { resolve as dnsResolve } from "dns";

/**
 * SSRF protection: check whether a domain resolves to a private/internal IP.
 *
 * Blocks:
 *  - 127.0.0.0/8    (loopback)
 *  - 10.0.0.0/8     (private)
 *  - 172.16.0.0/12  (private)
 *  - 192.168.0.0/16 (private)
 *  - 169.254.0.0/16 (link-local)
 *  - 0.0.0.0/8      (unspecified)
 *  - ::1, fc00::/7   (IPv6 private/loopback)
 *  - localhost, internal hostnames without dots
 */

/** Check if an IPv4 address falls in a private/reserved range. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed = treat as private
  }

  const [a, b] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8
  if (a === 10) return true;
  // 127.0.0.0/8
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 198.18.0.0/15 (benchmark testing)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 224.0.0.0/4 (multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (reserved)
  if (a >= 240) return true;

  return false;
}

/** Check if an IPv6 address is private/loopback. */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // ::1 loopback
  if (normalized === "::1") return true;
  // fc00::/7 (unique local)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  // fe80::/10 (link-local)
  if (normalized.startsWith("fe80")) return true;
  // :: (unspecified)
  if (normalized === "::") return true;

  return false;
}

/** Check if a hostname is obviously internal (no dots, localhost, etc.). */
function isInternalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Explicit blocklist
  const blocked = [
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
    "broadcasthost",
    "kubernetes",
    "kubernetes.default",
    "kubernetes.default.svc",
  ];
  if (blocked.includes(lower)) return true;

  // No dots = likely internal hostname
  if (!lower.includes(".")) return true;

  // Ends with common internal TLDs
  const internalSuffixes = [".local", ".internal", ".localhost", ".test", ".invalid"];
  if (internalSuffixes.some((s) => lower.endsWith(s))) return true;

  return false;
}

/**
 * Resolve a domain's A records and return the IP addresses.
 * Returns an empty array on failure (DNS timeout, NXDOMAIN, etc.).
 */
function resolveDomain(domain: string): Promise<string[]> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve([]), 5_000);

    dnsResolve(domain, (err, addresses) => {
      clearTimeout(timer);
      if (err || !addresses) {
        resolve([]);
        return;
      }
      resolve(addresses);
    });
  });
}

export interface SSRFCheckResult {
  safe: boolean;
  reason?: string;
}

/**
 * Validate that a domain is safe to make requests to (not pointing
 * at internal/private infrastructure). Performs DNS resolution and
 * checks all resolved IPs against private ranges.
 */
export async function checkSSRF(domain: string): Promise<SSRFCheckResult> {
  // 1. Check hostname patterns
  if (isInternalHostname(domain)) {
    return { safe: false, reason: "Domain appears to be an internal hostname" };
  }

  // 2. Check if domain is literally an IP address
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    if (isPrivateIPv4(domain)) {
      return { safe: false, reason: "IP address is in a private range" };
    }
    // Allow public IPs
    return { safe: true };
  }

  // IPv6 literal (with or without brackets)
  const ipv6Match = domain.match(/^\[?([0-9a-fA-F:]+)\]?$/);
  if (ipv6Match) {
    if (isPrivateIPv6(ipv6Match[1])) {
      return { safe: false, reason: "IPv6 address is in a private range" };
    }
    return { safe: true };
  }

  // 3. DNS resolution check
  const addresses = await resolveDomain(domain);

  if (addresses.length === 0) {
    return { safe: false, reason: "Domain does not resolve to any IP address" };
  }

  for (const ip of addresses) {
    if (ip.includes(":")) {
      if (isPrivateIPv6(ip)) {
        return {
          safe: false,
          reason: `Domain resolves to private IPv6 address: ${ip}`,
        };
      }
    } else {
      if (isPrivateIPv4(ip)) {
        return {
          safe: false,
          reason: `Domain resolves to private IP address: ${ip}`,
        };
      }
    }
  }

  return { safe: true };
}
