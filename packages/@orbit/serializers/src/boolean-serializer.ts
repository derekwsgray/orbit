import { Serializer, SerializerOptions } from './serializer';
import { BaseSerializer } from './base-serializer';

export class BooleanSerializer extends BaseSerializer<SerializerOptions>
  implements Serializer<boolean | null, boolean | null, SerializerOptions> {
  serialize(
    arg: boolean | null,
    customOptions?: SerializerOptions
  ): boolean | null {
    const options = this.buildOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }

  deserialize(
    arg: boolean | null,
    customOptions?: SerializerOptions
  ): boolean | null {
    const options = this.buildOptions(customOptions);

    if (arg === null && options.disallowNull) {
      throw new Error('null values are not allowed');
    }

    return arg;
  }
}
