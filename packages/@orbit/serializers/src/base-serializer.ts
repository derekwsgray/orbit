import { Serializer } from './serializer';

export interface BaseSerializationOptions {
  disallowNull?: boolean;
}

export abstract class BaseSerializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
>
  implements
    Serializer<From, To, SerializationOptions, DeserializationOptions> {
  protected serializationOptions?: SerializationOptions;
  protected deserializationOptions?: DeserializationOptions;

  constructor(settings?: {
    serializationOptions?: SerializationOptions;
    deserializationOptions?: DeserializationOptions;
  }) {
    this.serializationOptions = settings?.serializationOptions;
    this.deserializationOptions = settings?.deserializationOptions;
  }

  protected buildSerializationOptions(
    customOptions?: SerializationOptions
  ): SerializationOptions {
    let options = this.serializationOptions;
    if (options && customOptions) {
      return {
        ...options,
        customOptions
      };
    } else {
      return (options || customOptions || {}) as SerializationOptions;
    }
  }

  protected buildDeserializationOptions(
    customOptions?: DeserializationOptions
  ): DeserializationOptions {
    let options = this.deserializationOptions;
    if (options && customOptions) {
      return {
        ...options,
        customOptions
      };
    } else {
      return (options || customOptions || {}) as DeserializationOptions;
    }
  }

  abstract serialize(arg: From, options?: SerializationOptions): To;
  abstract deserialize(arg: To, options?: DeserializationOptions): From;
}
