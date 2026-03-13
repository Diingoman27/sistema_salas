module.exports = (err, req, res, next) => {
  // Basic error logging
  console.error(err && err.stack ? err.stack : err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};
