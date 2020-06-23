import { Serializer } from './serializer';
import { NoopSerializer } from './noop-serializer';
import { Dict } from '@orbit/utils';

export type UnknownSerializer = Serializer<unknown, unknown, unknown, unknown>;
export type UnknownSerializerClass = new (
  options?: unknown
) => UnknownSerializer;

export class SerializerResolver {
  defaultSerializer?: UnknownSerializer;
  defaultSerializerSettings: Dict<unknown>;
  protected _serializers: Dict<UnknownSerializer>;
  protected _serializerClasses: Dict<UnknownSerializerClass>;
  protected _serializationOptions: Dict<Dict<unknown>>;
  protected _deserializationOptions: Dict<Dict<unknown>>;

  constructor(settings?: {
    defaultSerializer?: UnknownSerializer;
    defaultSerializerSettings?: Dict<unknown>;
    serializers?: Dict<UnknownSerializer>;
    serializerClasses?: Dict<UnknownSerializerClass>;
    serializationOptions?: Dict<Dict<unknown>>;
    deserializationOptions?: Dict<Dict<unknown>>;
  }) {
    this.defaultSerializer = settings?.defaultSerializer;
    this.defaultSerializerSettings = settings?.defaultSerializerSettings || {};
    this._serializers = settings?.serializers || {};
    this._serializerClasses = settings?.serializerClasses || {};
    this._serializationOptions = settings?.serializationOptions || {};
    this._deserializationOptions = settings?.deserializationOptions || {};
  }

  resolve(type: string): UnknownSerializer {
    return this._serializers[type] || this.createSerializer(type);
  }

  getSerializer(type: string): UnknownSerializer {
    return this._serializers[type];
  }

  setSerializer(type: string, serializer: UnknownSerializer): void {
    this._serializers[type] = serializer;
  }

  getSerializerClass(type: string): UnknownSerializerClass {
    return this._serializerClasses[type];
  }

  setSerializerClass(
    type: string,
    SerializerClass: UnknownSerializerClass
  ): void {
    this._serializerClasses[type] = SerializerClass;
  }

  getSerializationOptions(type: string): Dict<unknown> {
    return this._serializationOptions[type];
  }

  setSerializationOptions(
    type: string,
    serializationOptions: Dict<unknown>
  ): void {
    this._serializationOptions[type] = serializationOptions;
  }

  getDeserializationOptions(type: string): Dict<unknown> {
    return this._deserializationOptions[type];
  }

  setDeserializationOptions(
    type: string,
    deserializationOptions: Dict<unknown>
  ): void {
    this._deserializationOptions[type] = deserializationOptions;
  }

  createSerializer(type: string): UnknownSerializer | undefined {
    const SerializerClass = this._serializerClasses[type];
    let serializer: UnknownSerializer | undefined;
    if (SerializerClass) {
      const settings = {
        ...this.defaultSerializerSettings
      };

      if (this._serializationOptions[type]) {
        settings.serializationOptions = this._serializationOptions[type];
      }

      if (this._deserializationOptions[type]) {
        settings.deserializationOptions = this._deserializationOptions[type];
      }

      serializer = new SerializerClass(settings);
    } else {
      serializer = this.defaultSerializer;
    }

    if (serializer) {
      this._serializers[type] = serializer;
      return serializer;
    }
  }
}
