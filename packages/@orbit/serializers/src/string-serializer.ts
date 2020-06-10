import { Serializer, SerializerOptions } from './serializer';
import { BaseSerializer } from './base-serializer';
import { dasherize, camelize, underscore } from '@orbit/utils';

export type StringInflection =
  | 'camelize'
  | 'dasherize'
  | 'underscore'
  | 'pluralize'
  | 'singularize';

export interface StringSerializerOptions extends SerializerOptions {
  inflections?: StringInflection[];
  pluralizeFn?: (str: string) => string;
  singularizeFn?: (str: string) => string;
}

export class StringSerializer extends BaseSerializer<StringSerializerOptions>
  implements Serializer<string | null, string | null, StringSerializerOptions> {
  serialize(
    arg: string | null,
    customOptions?: StringSerializerOptions
  ): string | null {
    const options = this.buildOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    const { inflections } = options;
    let result = arg;

    if (inflections) {
      for (let inflection of inflections) {
        result = this.applyInflection(inflection, result, options);
      }
    }

    return result;
  }

  deserialize(
    arg: string | null,
    customOptions?: StringSerializerOptions
  ): string | null {
    const options = this.buildOptions(customOptions);

    if (arg === null) {
      if (options.disallowNull) {
        throw new Error('null values are not allowed');
      }
      return null;
    }

    const { inflections } = options;
    let result = arg;

    if (inflections) {
      for (let i = inflections.length - 1; i >= 0; i--) {
        result = this.applyInverseInflection(inflections[i], result, options);
      }
    }

    return result;
  }

  protected applyInflection(
    inflection: StringInflection,
    arg: string,
    options: StringSerializerOptions
  ): string {
    switch (inflection) {
      case 'pluralize':
        return this.pluralize(arg, options);
      case 'singularize':
        return this.singularize(arg, options);
      case 'dasherize':
        return dasherize(arg);
      case 'underscore':
        return underscore(arg);
      case 'camelize':
        return camelize(arg);
      default:
        throw new Error(
          `'StringSerializer does not recognize inflection '${inflection}'`
        );
    }
  }

  protected applyInverseInflection(
    inflection: StringInflection,
    arg: string,
    options: StringSerializerOptions
  ): string {
    switch (inflection) {
      case 'pluralize':
        return this.singularize(arg, options);
      case 'singularize':
        return this.pluralize(arg, options);
      case 'dasherize':
        return camelize(arg);
      case 'underscore':
        return camelize(arg);
      case 'camelize':
        return arg;
      default:
        throw new Error(
          `StringSerializer does not recognize inflection '${inflection}'`
        );
    }
  }

  protected pluralize(arg: string, options: StringSerializerOptions): string {
    if (options.pluralizeFn) {
      return options.pluralizeFn(arg);
    } else {
      throw new Error(
        "StringSerializer must be passed a 'pluralizeFn' in order to pluralize a string"
      );
    }
  }

  protected singularize(arg: string, options: StringSerializerOptions): string {
    if (options.singularizeFn) {
      return options.singularizeFn(arg);
    } else {
      throw new Error(
        "StringSerializer must be passed a 'singularizeFn' in order to singularize a string"
      );
    }
  }
}
