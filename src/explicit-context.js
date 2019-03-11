module.exports = class ExplicitContext {
  constructor() {
    this.currentCtx = null
  }

  setContext(ctx) {
    this.currentCtx = ctx
  }

  getContext() {
    return this.currentCtx
  }

  async scoped(callable) {
    const prevCtx = this.currentCtx
    const result = await callable()
    this.currentCtx = prevCtx
    return result
  }

  async letContext(ctx, callable) {
    return await this.scoped(() => {
      this.setContext(ctx)
      return callable()
    })
  }
}
