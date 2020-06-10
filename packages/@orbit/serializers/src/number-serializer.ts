import { Serializer, SerializerOptions } from './serializer';
import { BaseSerializer } from './base-serializer';

export class NumberSerializer extends BaseSerializer<SerializerOptions>
  implements Serializer<number | null, number | null, SerializerOptions> {
  serialize(
    arg: number | null,
    customOptions?: SerializerOptions
  ): number | null {
    const options = this.buildOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }

  deserialize(
    arg: number | null,
    customOptions?: SerializerOptions
  ): number | null {
    const options = this.buildOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }
}
