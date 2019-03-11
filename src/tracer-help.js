const {Annotation, HttpHeaders} = require('zipkin')
const optimizeHttp = require('./optimize-http')

module.exports = function (tracer) {
  // 为了解决异步之后 traceId 混乱的问题
  return class TracerHelp {
    constructor(traceId) {
      this.traceId = traceId
      this.tracer = tracer
    }

    // 重新赋值
    async local(operationName, callable) {
      tracer.setId(this.traceId)
      return await tracer.local(operationName, callable)
    }

    // 重置
    reset() {
      tracer.setId(this.traceId)
    }

    // 所有异步但是不需要记录 zipkin，会在异步结束之后回滚当前的 traceId
    // TODO 方法在并发过大时有异常，可能是 await 引起的异步回调，目前没有好的解决方案
    static async scoped(callable) {
      let traceId = tracer.id
      let result = await callable()
      tracer.setId(traceId)
      return result
    }

    /**
     * 创建 TracerHelp
     * X-B3-TraceId
     * @param ctx 可选，没有就绑定当前的 tracer.id
     * @returns {TracerHelp}
     */
    static create(ctx) {
      let tracerId = ctx ? TracerHelp.getTraceId(ctx) : tracer.id;
      return new TracerHelp(tracerId);
    }

    /**
     * 记录部分的参数
     * @param ctx
     * @param options
     * @param isEnd 是否停止
     */
    static async addRecordBinary(ctx, options, isEnd = false) {
      await tracer.scoped(() => {
        tracer.setId(ctx[HttpHeaders.TraceId])
        Object.keys(options).forEach((key) => {
          tracer.recordBinary(key, options[key])
        });
        // 是否结束
        if (isEnd) {
          tracer.recordAnnotation(new Annotation.ServerSend())
        }
      })
    }

    /**
     * @param ctx
     * @returns {*}
     */
    static getTraceId(ctx) {
      return ctx[HttpHeaders.TraceId]
    }

    static async addBodyRecord(ctx, body, err) {
      return await TracerHelp.addRecordBinary(ctx, {
        'error': body.message,
        'error.stack': err.stack,
        'http.status_code': body.status,
        'http.params': optimizeHttp(ctx.query),
        'http.body': optimizeHttp(ctx.request.body)
      }, true)
    }
  }
}
