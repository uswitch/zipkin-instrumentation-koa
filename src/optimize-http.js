/**
 * 省略http参数和body为空
 * @param value
 * @returns {*}
 */
module.exports = function (value) {
  if (typeof value === 'string') {
    return value
  }
  value = JSON.stringify(value);
  return value === '{}' ? undefined : value
};
