const crypto = require('crypto');
 
const round = n => Math.round(n * 10) / 10;
 
// A label for who called, without ever writing the key itself.
function who(req) {
  if (!req.apiKey) return 'none';
  const hash = crypto.createHash('sha256').update(req.apiKey).digest('hex');
  return 'key-' + hash.slice(0, 6);
}
 
function monitor(req, res, next) {
  const start = process.hrtime.bigint();
 
  res.on('finish', () => { // after the response is sent
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
 
    console.log(JSON.stringify({
      time: new Date().toISOString(),
      method: req.method,
      path: req.path, // path only: no query string
      status: res.statusCode,
      ms: round(ms),
      caller: who(req),
    }));
  });
 
  next();
}
 
module.exports = { monitor };
