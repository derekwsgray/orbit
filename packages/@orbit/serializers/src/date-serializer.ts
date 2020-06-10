import { Serializer, SerializerOptions } from './serializer';
import { BaseSerializer } from './base-serializer';

export class DateSerializer extends BaseSerializer<SerializerOptions>
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

    return `${arg.getFullYear()}-${arg.getMonth() + 1}-${arg.getDate()}`;
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

    const [year, month, date] = arg.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
  }
}
