/**
 * Extracts and normalizes the client IP address from express request
 * Handles IPv6 loopback (::1), IPv4-mapped IPv6 (::ffff:127.0.0.1), and X-Forwarded-For proxy headers.
 */
const getClientIp = (req) => {
  if (!req) return '127.0.0.1';
  let ip = req.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() || req.ip || req.socket?.remoteAddress || '127.0.0.1';
  
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  if (ip.startsWith('::ffff:')) {
    return ip.replace('::ffff:', '');
  }
  return ip;
};

module.exports = {
  getClientIp,
};
