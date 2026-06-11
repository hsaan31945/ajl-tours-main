const shouldLogPerf = () => process.env.DEBUG_PERF === 'true';

const getRecordCount = (body) => {
  if (Array.isArray(body)) return body.length;
  if (body && typeof body === 'object') {
    if (Array.isArray(body.data)) return body.data.length;
    if (Array.isArray(body.tours)) return body.tours.length;
    if (Array.isArray(body.bookings)) return body.bookings.length;
    if (Array.isArray(body.items)) return body.items.length;
  }
  return undefined;
};

const byteLength = (payload) => {
  if (!payload) return 0;
  if (Buffer.isBuffer(payload)) return payload.length;
  if (typeof payload === 'string') return Buffer.byteLength(payload);
  return Buffer.byteLength(JSON.stringify(payload));
};

const attachPerfLogger = (req, res) => {
  if (!shouldLogPerf() || res.__apiPerfLoggerAttached) return;
  res.__apiPerfLoggerAttached = true;

  const startedAt = Date.now();
  let responseSize = 0;
  let recordCount;

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    recordCount = getRecordCount(body);
    responseSize = byteLength(body);
    return originalJson(body);
  };

  const originalSend = res.send?.bind(res);
  if (originalSend) {
    res.send = (body) => {
      if (!responseSize) responseSize = byteLength(body);
      return originalSend(body);
    };
  }

  const originalEnd = res.end.bind(res);
  res.end = (chunk, encoding, callback) => {
    if (!responseSize && chunk) responseSize = byteLength(chunk);
    return originalEnd(chunk, encoding, callback);
  };

  res.on('finish', () => {
    console.log('API PERF', {
      route: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      responseSizeKB: Math.round((responseSize / 1024) * 10) / 10,
      recordCount,
    });
  });
};

const perfLogger = (req, res, next) => {
  attachPerfLogger(req, res);
  next();
};

module.exports = {
  attachPerfLogger,
  perfLogger,
};
