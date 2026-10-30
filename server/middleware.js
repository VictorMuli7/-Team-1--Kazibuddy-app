function requireRole(...roles) {
  return (req, res, next) => {
    const session = req.session.user;
    if (!session || (roles.length && !roles.includes(session.role))) {
      return res.status(401).json({ ok: false, error: "Not authorized." });
    }
    next();
  };
}

/* Express 4 doesn't catch rejected promises from async handlers, so wrap
   them: any thrown error / failed query is forwarded to the error handler
   in server.js instead of leaving the request hanging. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { requireRole, asyncHandler };
