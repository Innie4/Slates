# Authentication provider references

Verified 2026-10-22. These notes describe integration requirements, not completed account setup or production approval.

## Packages and runtime

Fresh `npm view` metadata: `openid-client@6.8.8`, `jose@6.2.13`, `@simplewebauthn/server@14.0.3`, `@simplewebauthn/browser@14.0.0`. SimpleWebAuthn server requires Node 20 or later. Slate's Node 24 supports the required Web Crypto, Fetch, Request, and ESM APIs.

Sources: [OpenID Client](https://github.com/panva/openid-client), [JOSE](https://github.com/panva/jose), [SimpleWebAuthn server](https://simplewebauthn.dev/docs/packages/server), [browser](https://simplewebauthn.dev/docs/packages/browser).

## OAuth integration

Keep Slate's existing custom application session. Provider login verifies a provider identity, then creates the ordinary Slate session. Persist identities using a unique `(provider, subject)` pair. Do not automatically link a password account solely because the provider reports the same email. Linking should require authentication of the existing Slate account. Provider signup must complete required contact details and terms before becoming an active account.

Suggested endpoints:

- `GET /api/auth/providers`: boolean availability and public provider labels, never secrets.
- `GET /api/auth/oauth/:provider/start`: create an expiring one-use browser-bound transaction; redirect to the fixed provider endpoint.
- `GET /api/auth/oauth/google/callback`: Google authorization-code response.
- `POST /api/auth/oauth/apple/callback`: Apple form response.
- `POST /api/auth/oauth/complete`: finish a verified pending signup with required phone and terms.

Use `new Configuration(serverMetadata, clientId, clientMetadata, clientAuthentication)` from `openid-client`. A string third argument represents a client secret; the default client authentication is `ClientSecretPost`. Call `enableNonRepudiationChecks(config)` and configure the fixed provider `jwks_uri` to require explicit ID token JWS signature validation. `authorizationCodeGrant(config, currentUrl, checks)` accepts either a `URL` or a Fetch `Request`, including Apple's form POST. Checks include `expectedState`, `expectedNonce`, `idTokenExpected: true`, and Google's `pkceCodeVerifier`. Use the package's `randomPKCECodeVerifier()` and `calculatePKCECodeChallenge()` for Google S256 PKCE.

Sources: [Configuration](https://github.com/panva/openid-client/blob/main/docs/classes/Configuration.md), [code grant](https://github.com/panva/openid-client/blob/main/docs/functions/authorizationCodeGrant.md), [checks](https://github.com/panva/openid-client/blob/main/docs/interfaces/AuthorizationCodeGrantChecks.md), [signature checks](https://github.com/panva/openid-client/blob/main/docs/functions/enableNonRepudiationChecks.md).

## Google

Requires a Google Cloud Web OAuth client ID, client secret, branding/consent configuration, and an exactly registered callback URL. Request only `openid email profile`. Validate issuer, audience, expiration, signature, state, nonce, PKCE, and verified email before using profile data. Identify the user by `sub`, not email. Use a fixed redirect allowlist and never forward provider tokens to the browser or persist them when only login is needed.

Sources: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect), [Google public metadata](https://accounts.google.com/.well-known/openid-configuration).

## Apple

Requires a Services ID associated with a primary Sign in with Apple-enabled App ID, Team ID, key ID, private `.p8` key, and registered website domain and HTTPS return URL. Apple's current environment guide also states that website authentication requires an existing App Store app using Sign in with Apple. Eligibility and Developer membership must be checked; this is not automatically available from free web hosting.

Use the Services ID as `client_id`. Sign a short-lived client secret with ES256 using `jose.importPKCS8` and `new SignJWT()`: `iss` is the Team ID, `sub` is the Services ID, `aud` is `https://appleid.apple.com`, `iat` and `exp` are numeric dates, and protected `kid` is the key ID. Apple's maximum lifetime is 15,777,000 seconds; use a much shorter lifetime generated server-side. Never expose the private key.

Apple public discovery advertises `client_secret_post`, RS256 ID tokens, authorization-code response, and query/fragment/form_post response modes. It does not advertise PKCE and the official token schema does not list `code_verifier`. Do not claim Apple PKCE support. Use state, nonce, confidential client authentication, and one-use transaction binding. Requesting `email` or `name` requires `response_mode=form_post`. Its authorization code is single-use and expires after five minutes. The redirect URI must be HTTPS with a domain, not localhost or an IP address, and cannot contain a fragment.

Accept `application/x-www-form-urlencoded` only on the exact Apple callback route with a small body limit. Its cross-site form POST will not carry a SameSite=Lax cookie. Use a dedicated short-lived Secure, HttpOnly, SameSite=None authentication-transaction cookie, without weakening the normal Slate session cookie. Require that cookie, matching one-use state, and verified ID token nonce. Never create a state-only fallback. Consume the transaction atomically. Returned `user` profile JSON is not signed; treat it as optional untrusted display data. Email and subject come from the verified token. Apple may return a private relay address; do not assume a regular Apple email address or a repeated name response.

Sources: [Apple environment requirements](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple), [website configuration](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web), [authorization parameters](https://developer.apple.com/documentation/signinwithapple/incorporating-sign-in-with-apple-into-other-platforms), [token endpoint](https://developer.apple.com/documentation/signinwithapplerestapi/generate-and-validate-tokens), [client secret](https://developer.apple.com/documentation/accountorganizationaldatasharing/creating-a-client-secret), [public metadata](https://appleid.apple.com/.well-known/openid-configuration).

## Passkeys

Passkeys use the browser's authenticator. A device may offer fingerprint, Face ID, a device PIN, or a security key. The site does not receive biometric data and cannot force a particular biometric method. Do not promise Face ID on every device. HTTPS and a stable RP ID are required, with localhost permitted for local development. Staging's RP ID is `slate-staging-w0ax.onrender.com`, without scheme or path; expected origin is its exact HTTPS origin. Passkeys registered here are not automatically valid for another production domain.

Register only for an authenticated account, preferably after recent authentication. Use `generateRegistrationOptions({ rpName, rpID, userID, userName, attestationType: 'none', excludeCredentials, authenticatorSelection: { residentKey: 'required', userVerification: 'required' } })`. `userID` is an opaque stable `Uint8Array`, not email. Do not require `authenticatorAttachment: 'platform'` if users should also be able to use security keys or another device.

Browser methods: `startRegistration({ optionsJSON })` and `startAuthentication({ optionsJSON })`. Feature-detect support and keep password access available. Call them from an explicit user action. Canceled dialogs and unavailable authenticators need calm recoverable messages.

Verify registration with `verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin, expectedRPID, requireUserVerification: true })`. Save only when `verified` and `registrationInfo` are present: `credential.id`, `credential.publicKey`, `credential.counter`, `credential.transports`, `credentialDeviceType`, `credentialBackedUp`, plus the account foreign key and WebAuthn user ID. Store raw public-key bytes as BLOB/BYTEA or encode losslessly. Credential ID must be unique.

For username-less login, use `generateAuthenticationOptions({ rpID, userVerification: 'required' })` without account-specific `allowCredentials`. Save a short-lived one-use challenge bound to the browser transaction. On the response, find the stored credential by its ID and verify ownership/userHandle. Verify with `verifyAuthenticationResponse({ response, expectedChallenge, expectedOrigin, expectedRPID, requireUserVerification: true, credential: { id, publicKey: Uint8Array, counter, transports } })`. Update `authenticationInfo.newCounter` after success before issuing a Slate session. Synced passkeys can have a zero counter, which the maintained verifier handles. Store challenges persistently and consume them atomically; an in-memory map is insufficient across workers or restarts.

Sources: [server APIs and data model](https://simplewebauthn.dev/docs/packages/server), [browser APIs](https://simplewebauthn.dev/docs/packages/browser), [passkey guide](https://simplewebauthn.dev/docs/advanced/passkeys/).

## Verification and release limits

Use isolated test identities and credentials. Test duplicate and expired challenges, wrong origin/RP ID, replayed registration/authentication, credential ownership, absent user verification, OAuth state/nonce mismatch, duplicate provider subject, missing terms/phone, invalid signatures, provider cancellation, and account linking attempts. Verify database constraints and transaction consumption across both SQLite and PostgreSQL.

Without configured provider credentials, Google and Apple end-to-end login cannot be claimed. Browser automation with a virtual authenticator can exercise the WebAuthn protocol but cannot verify physical Face ID or fingerprint hardware. Authentication boundary changes require qualified human review before production release under the repository policy. No paid service was enabled during this research.
