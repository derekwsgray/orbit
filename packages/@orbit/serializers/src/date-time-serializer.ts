import { Serializer, SerializerOptions } from './serializer';
import { BaseSerializer } from './base-serializer';

export class DateTimeSerializer extends BaseSerializer<SerializerOptions>
  implements Serializer<Date | null, string | null, SerializerOptions> {
  serialize(
    arg: Date | null,
    customOptions?: SerializerOptions
  ): string | null {
    const options = this.buildOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    return arg.toISOString();
  }

  deserialize(
    arg: string | null,
    customOptions?: SerializerOptions
  ): Date | null {
    const options = this.buildOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    let offset = arg.indexOf('+');
    if (offset !== -1 && arg.length - 5 === offset) {
      offset += 3;
      return new Date(arg.slice(0, offset) + ':' + arg.slice(offset));
    }
    return new Date(arg);
  }
}
