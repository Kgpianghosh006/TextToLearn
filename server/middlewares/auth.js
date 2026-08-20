// middlewares/auth.js
const { auth } = require('express-oauth2-jwt-bearer');

let _checkJwt = null;

// Lazily creates and caches the JWT verification middleware.
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

// checkJwt — Express middleware compatible wrapper.
const checkJwt = (req, res, next) => getCheckJwt()(req, res, next);

module.exports = { checkJwt };
