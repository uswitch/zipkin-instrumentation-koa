module.exports = require('koa2-cors')({
  origin: function () {
    return '*'
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowHeaders: [
    'Origin',
    'Accept',
    'X-Requested-With',
    'X-B3-TraceId',
    'X-B3-ParentSpanId',
    'X-B3-SpanId',
    'X-B3-Sampled',
    'X-B3-Flags',
    'Authorization'
  ]
})
