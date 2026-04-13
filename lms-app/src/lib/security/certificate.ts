/**
 * SSL Certificate Pinning Configuration
 *
 * For Expo managed workflow, SSL pinning is configured via the
 * `expo-build-properties` plugin in app.json or via a config plugin.
 *
 * On iOS:  NSAppTransportSecurity + pinned public keys in Info.plist
 * On Android: network_security_config.xml with pin-set
 *
 * In Expo, this is typically done using a config plugin at build time:
 *
 * app.json → plugins → [
 *   ["expo-build-properties", {
 *     android: { networkSecurityConfig: "./network_security_config.xml" },
 *   }]
 * ]
 *
 * network_security_config.xml example:
 * <network-security-config>
 *   <domain-config>
 *     <domain includeSubdomains="true">api.freeapi.app</domain>
 *     <pin-set>
 *       <pin digest="SHA-256">BASE64_ENCODED_PIN_HERE</pin>
 *     </pin-set>
 *   </domain-config>
 * </network-security-config>
 *
 * For production: generate pins with:
 *   openssl s_client -servername api.freeapi.app -connect api.freeapi.app:443 | \
 *     openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | \
 *     openssl dgst -sha256 -binary | openssl enc -base64
 */

const PINNED_DOMAINS = ['api.freeapi.app'] as const;

/**
 * Validates that a URL is targeting a pinned domain.
 * Use before making sensitive requests outside the main Axios client.
 */
export function isPinnedDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return PINNED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

/**
 * Returns the list of domains that should be pinned.
 * Used by config plugins at build time.
 */
export function getPinnedDomains(): readonly string[] {
  return PINNED_DOMAINS;
}
