import {
  Record,
  RecordIdentity,
  RecordOperation,
  Schema,
  KeyMap
} from '@orbit/data';
import { Resource, ResourceIdentity } from '../jsonapi-resource';
import { ResourceOperation } from '../atomic-operations';
import {
  Serializer,
  BaseSerializer,
  NoopSerializer,
  StringSerializationOptions
} from '@orbit/serializers';
import {
  JSONAPIResourceIdentitySerializer,
  JSONAPIResourceIdentitySerializationOptions
} from './jsonapi-resource-identity-serializer';
import { JSONAPIResourceSerializationOptions } from './jsonapi-resource-serializer';
import { Dict } from '@orbit/utils';

const RESOURCE = 'jsonapi-resource';
const RESOURCE_IDENTITY = 'jsonapi-resource-identity';
const RESOURCE_FIELD = 'jsonapi-resource-field';
const RESOURCE_OPERATION = 'jsonapi-operation';
const RESOURCE_TYPE = 'jsonapi-resource-type';

export interface JSONAPIBaseSerializerSettings {
  keyMap?: KeyMap;
  schema: Schema;
  serializerFor: (
    type: string,
    settings?: Dict<any>
  ) => Serializer<unknown, unknown, unknown, unknown>;
  serializerSettingsFor: (type: string) => Dict<any>;
}

export abstract class JSONAPIBaseSerializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> extends BaseSerializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> {
  protected _schema: Schema;
  protected _keyMap: KeyMap;
  protected _serializers: Dict<Serializer<unknown, unknown, unknown, unknown>>;
  protected _serializerFor: (
    type: string,
    settings?: Dict<any>
  ) => Serializer<unknown, unknown, unknown, unknown>;
  protected _serializerSettingsFor: (type: string) => Dict<any>;
  protected _noopSerializer: Serializer<unknown, unknown, unknown, unknown>;

  constructor(
    settings: JSONAPIBaseSerializerSettings,
    defaultSerializationOptions?: unknown
  ) {
    super(defaultSerializationOptions);

    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    this._serializerFor = settings.serializerFor;
    this._serializerSettingsFor = settings.serializerSettingsFor;
    this._serializers = {};
    this._noopSerializer = new NoopSerializer();
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  serializerFor(type: string): Serializer<unknown, unknown, unknown, unknown> {
    let serializer = this._serializers[type];
    if (serializer === undefined) {
      let settings;
      if (this._serializerSettingsFor) {
        settings = this._serializerSettingsFor(type);
      }
      serializer = this._serializers[type] =
        this._serializerFor(type, settings) || this._noopSerializer;
    }
    return serializer;
  }

  protected get identitySerializer(): Serializer<
    RecordIdentity,
    ResourceIdentity,
    JSONAPIResourceIdentitySerializationOptions,
    JSONAPIResourceIdentitySerializationOptions
  > {
    return this.serializerFor(
      RESOURCE_IDENTITY
    ) as JSONAPIResourceIdentitySerializer;
  }

  protected get fieldSerializer(): Serializer<
    string,
    string,
    unknown,
    unknown
  > {
    return this.serializerFor(RESOURCE_FIELD) as Serializer<
      string,
      string,
      unknown,
      unknown
    >;
  }

  protected get resourceSerializer(): Serializer<
    Record,
    Resource,
    JSONAPIResourceSerializationOptions,
    JSONAPIResourceSerializationOptions
  > {
    return this.serializerFor(RESOURCE) as Serializer<
      Record,
      Resource,
      JSONAPIResourceSerializationOptions,
      JSONAPIResourceSerializationOptions
    >;
  }

  protected get typeSerializer(): Serializer<
    string,
    string,
    StringSerializationOptions,
    StringSerializationOptions
  > {
    return this.serializerFor(RESOURCE_TYPE) as Serializer<
      string,
      string,
      StringSerializationOptions,
      StringSerializationOptions
    >;
  }

  protected get operationSerializer(): Serializer<
    RecordOperation,
    ResourceOperation,
    unknown,
    unknown
  > {
    return this.serializerFor(RESOURCE_OPERATION) as Serializer<
      RecordOperation,
      ResourceOperation,
      unknown,
      unknown
    >;
  }
}
