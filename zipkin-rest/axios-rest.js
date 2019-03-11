const {Annotation, Request} = require('zipkin')

function revertAxios(axiosWrapper) {
  let axios = function (url, opt = {method: 'GET'}) {
    if (typeof url === 'object') {
      opt = url
      url = opt.url
    }
    return axiosWrapper.sendRequest(url, opt)
  };
  ['get', 'post', 'del', 'put', 'resetAxios', 'sendRequest'].forEach((method) => {
    axios[method] = axiosWrapper[method].bind(axiosWrapper)
  })
  return axios
}

// 省略http参数和body为空
let optimizeHttp = function (value) {
  if (typeof value === 'string') {
    return value
  }
  value = JSON.stringify(value)
  return value === '{}' ? undefined : value
}

class AxiosWrapper {

  /**
   * Override default constructor.
   */
  constructor({tracer, serviceName = 'unknown', remoteServiceName}, axios) {
    this.axios = axios
    this.tracer = tracer
    this.serviceName = serviceName
    this.remoteServiceName = remoteServiceName
  }

  /**
   * 重置 axios 为新的 instance
   * @param instance
   */
  resetAxios(instance) {
    let axiosWrapper = new AxiosWrapper({
      tracer: this.tracer,
      serviceName: this.serviceName,
      remoteServiceName: this.remoteServiceName
    }, instance)
    return revertAxios(axiosWrapper)
  }

  /**
   * Sends a GET-Request to the given url.
   */
  get(url, opt = {}) {
    opt.method = 'GET'
    return this.sendRequest(url, opt)
  }

  /**
   * Sends a PUT-Request to the given url.
   *
   */
  put(url, data, opt = {}) {
    opt.method = 'PUT'
    opt.data = data
    return this.sendRequest(url, opt)
  }

  /**
   * Sends a POST-Request to the given url.
   *
   */
  post(url, data, opt = {}) {
    opt.method = 'POST'
    opt.data = data
    return this.sendRequest(url, opt)
  }

  /**
   * Sends a DELETE-Request to the given url.
   *
   */
  del(url, opt = {}) {
    opt.method = 'DELETE'
    return this.sendRequest(url, opt)
  }

  /**
   * Wrapper for axios.request
   * Here we create the scope and record the annotations.
   *
   */
  sendRequest(url, opts) {
    const {axios, tracer, serviceName} = this
    const {method} = opts

    return tracer.scoped(() => {
      tracer.setId(tracer.createChildId())
      const traceId = tracer.id

      tracer.recordServiceName(serviceName)
      tracer.recordRpc(method.toUpperCase())
      tracer.recordBinary('http.url', url)
      tracer.recordAnnotation(new Annotation.ClientSend())

      const config = Request.addZipkinHeaders(opts, traceId)
      config.url = url
      return axios.request(config)
        .then(async result => {
          await tracer.scoped(() => {
            tracer.setId(traceId)
            tracer.recordBinary('http.status_code', result.status.toString())
            tracer.recordAnnotation(new Annotation.ClientRecv())
          })
          return result
        })
        .catch(async err => {
          await tracer.scoped(() => {
            tracer.setId(traceId)
            tracer.recordBinary('error', err.toString())
            tracer.recordBinary('error.stack', err.stack)
            tracer.recordBinary('http.status_code', err.status)
            tracer.recordBinary('http.params', optimizeHttp(opts.params))
            tracer.recordBinary('http.data', optimizeHttp(opts.data))
            tracer.recordAnnotation(new Annotation.ClientRecv())
          })
          throw err
        })
    })
  }
}

module.exports = (options, instance) => {
  return revertAxios(new AxiosWrapper(options, instance))
}
