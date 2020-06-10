export abstract class BaseSerializer<SerializerOptions> {
  protected defaultOptions?: SerializerOptions;

  constructor(defaultOptions?: SerializerOptions) {
    this.defaultOptions = defaultOptions;
  }

  protected buildOptions(customOptions?: SerializerOptions): SerializerOptions {
    let options = this.defaultOptions;
    if (options && customOptions) {
      return {
        ...options,
        customOptions
      };
    } else {
      return (options || customOptions || {}) as SerializerOptions;
    }
  }
}
