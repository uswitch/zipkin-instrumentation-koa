const {BatchRecorder, ConsoleRecorder, jsonEncoder: {JSON_V2}, Tracer} = require('zipkin')
const ExplicitContext = require('./explicit-context')
const {HttpLogger} = require('zipkin-transport-http')
const ctxImpl = new ExplicitContext()

module.exports = ({endpoint, serviceName}) => {
  const isDebug = process.env.NODE_DEBUG === 'true'
  const recorder = isDebug ? new ConsoleRecorder() : new BatchRecorder({
    logger: new HttpLogger({
      endpoint,
      jsonEncoder: JSON_V2
    })
  })
  return new Tracer({ctxImpl, recorder, localServiceName: serviceName})
}
