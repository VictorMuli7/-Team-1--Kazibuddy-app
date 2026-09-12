function requireRole(...roles) {
  return (req, res, next) => {
    const session = req.session.user;
    if (!session || (roles.length && !roles.includes(session.role))) {
      return res.status(401).json({ ok: false, error: "Not authorized." });
    }
    next();
  };
}

module.exports = { requireRole };
