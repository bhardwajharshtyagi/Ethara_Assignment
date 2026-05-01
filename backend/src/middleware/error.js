export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}
