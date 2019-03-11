# zipkin-instrumentation-koa
```javascript
const serviceName = 'backend'
const {KoaInstrumentation} = require('zipkin-instrumentation-koa')
const tracer = require('zipkin-instrumentation-koa/src/recorder')({
  endpoint: 'http://127.0.0.1:9411',
  serviceName
});
const Koa = require('koa')
const app = new Koa()
app.use(KoaInstrumentation({tracer, serviceName}))
```
