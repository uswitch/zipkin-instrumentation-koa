export namespace TracerHelp {
  export function local(operationName: string, callable: Function);

  export function reset();

  export function scoped(callable: Function);

  export function create(ctx: any);

  export function getTraceId();

  export function addRecordBinary(ctx: any, options: object, isEnd?: Boolean);

  export function addBodyRecord(ctx: any, options: object, err: object)
}
