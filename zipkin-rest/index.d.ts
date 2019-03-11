export namespace AxiosWrapper {
  export function local(operationName: string, callable: Function);

  export function resetAxios();

  export function get(url: string, opt?: object);

  export function put(url: string, data: object, opt?: object);

  export function post(url: string, data: object, opt?: object);

  export function del(url: string, opt?: object);

  export function sendRequest(url: string, opt: object);
}
