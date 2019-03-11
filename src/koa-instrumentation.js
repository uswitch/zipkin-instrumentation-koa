const {HttpHeaders, TraceId, option: {Some, None}, Annotation} = require('zipkin');
const lib = require('./lib');
module.exports = function ({tracer = false, serviceName = 'unknown', port = 0}) {
  if (tracer === false) {
    return async (ctx, next) => {
      await next()
    }
  }
  return async (ctx, next) => {
    // 忽略 OPTIONS 的记录
    if (ctx.method.toUpperCase() === 'OPTIONS') {
      return await next()
    }
    const req = ctx.request
    const res = ctx.response

    function readHeader(headerName) {
      const val = lib.getHeaderValue(req, headerName)
      if (val !== null) {
        return new Some(val)
      } else {
        return None
      }
    }

    if (lib.containsRequiredHeaders(req)) {
      const spanId = readHeader(HttpHeaders.SpanId)
      spanId.ifPresent((sid) => {
        const childId = new TraceId({
          traceId: readHeader(HttpHeaders.TraceId),
          parentId: readHeader(HttpHeaders.ParentSpanId),
          spanId: sid,
          sampled: readHeader(HttpHeaders.Sampled).map(lib.stringToBoolean),
          flags: readHeader(HttpHeaders.Flags).flatMap(lib.stringToIntOption).getOrElse(0)
        })
        tracer.setId(childId)
      })
    }
    else {
      const rootId = tracer.createRootId();
      if (lib.getHeaderValue(req, HttpHeaders.Flags)) {
        const rootIdWithFlags = new TraceId({
          traceId: rootId.traceId,
          parentId: rootId.parentId,
          spanId: rootId.spanId,
          sampled: rootId.sampled,
          flags: readHeader(HttpHeaders.Flags)
        })
        tracer.setId(rootIdWithFlags)
      }
      else {
        tracer.setId(rootId)
      }
    }
    const traceId = tracer.id
    await tracer.scoped(() => {
      tracer.setId(traceId)
      tracer.recordServiceName(serviceName)
      tracer.recordRpc(req.method.toUpperCase())
      tracer.recordBinary('http.url', lib.formatRequestUrl(req))
      tracer.recordBinary('http.method', req.method.toUpperCase())
      tracer.recordAnnotation(new Annotation.ServerRecv())
      tracer.recordAnnotation(new Annotation.LocalAddr({port}))
      if (traceId.flags !== 0 && traceId.flags !== null && !isNaN(traceId.flags)) {
        tracer.recordBinary(HttpHeaders.Flags, traceId.flags.toString())
      }
    })
    ctx[HttpHeaders.TraceId] = traceId
    await next()
    await tracer.scoped(() => {
      tracer.setId(traceId)
      tracer.recordBinary('http.status_code', res.status.toString())
      tracer.recordAnnotation(new Annotation.ServerSend())
    })
  }
};
