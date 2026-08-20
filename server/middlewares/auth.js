/**
 * middlewares/auth.js
 *
 * Auth0 JWT verification middleware using `express-oauth2-jwt-bearer`.
 *
 * The middleware is created lazily (on first request) so that `dotenv` has
 * time to populate `process.env` before the `auth()` factory runs. This
 * avoids the "audience is required" assertion error when the module is
 * required before dotenv.config() is called.
 *
 * When applied to a route, this middleware:
 *   1. Extracts the `Authorization: Bearer <token>` header.
 *   2. Fetches Auth0's JWKS to verify the token signature.
 *   3. Validates the `aud` (audience) and `iss` (issuer) claims.
 *   4. On success, attaches the decoded payload to `req.auth`.
 *      The authenticated user's unique ID is at `req.auth.payload.sub`.
 *
 * Configuration (via .env):
 *   AUTH0_DOMAIN   — your Auth0 tenant domain, e.g. dev-xxx.us.auth0.com
 *   AUTH0_AUDIENCE — the API Identifier set in your Auth0 API settings
 */
const { auth } = require('express-oauth2-jwt-bearer');

let _checkJwt = null;

/**
 * Lazily creates and caches the JWT verification middleware.
 * This ensures process.env is populated (via dotenv) before auth() runs.
 */
function getCheckJwt() {
  if (!_checkJwt) {
    _checkJwt = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
      tokenSigningAlg: 'RS256',
    });
  }
  return _checkJwt;
}

/**
 * checkJwt — Express middleware compatible wrapper.
 * Usage: router.get('/protected', checkJwt, handler)
 */
const checkJwt = (req, res, next) => getCheckJwt()(req, res, next);

module.exports = { checkJwt };
