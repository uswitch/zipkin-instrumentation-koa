const {HttpHeaders, option: {Some, None}} = require("zipkin");
const url = require("url");

function getHeaderValue(req, headerName) {
  return req.get(headerName);
}

exports.getHeaderValue = getHeaderValue;

exports.containsRequiredHeaders = function (req) {
  return getHeaderValue(req, HttpHeaders.TraceId) !== '' && getHeaderValue(req, HttpHeaders.SpanId) !== '';
}

exports.formatRequestUrl = function (req) {
  const parsed = url.parse(req.originalUrl);
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: parsed.pathname,
    search: parsed.search
  });
}

exports.stringToBoolean = function (str) {
  return str === '1';
};

exports.stringToIntOption = function (str) {
  try {
    return new Some(parseInt(str));
  }
  catch (err) {
    return None;
  }
};
