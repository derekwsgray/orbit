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
  UnknownSerializer,
  StringSerializationOptions,
  SerializerResolver
} from '@orbit/serializers';
import {
  JSONAPIResourceIdentitySerializer,
  JSONAPIResourceIdentitySerializationOptions
} from './jsonapi-resource-identity-serializer';
import { JSONAPIResourceSerializationOptions } from './jsonapi-resource-serializer';

const RESOURCE = 'jsonapi-resource';
const RESOURCE_IDENTITY = 'jsonapi-resource-identity';
const RESOURCE_FIELD = 'jsonapi-resource-field';
const RESOURCE_OPERATION = 'jsonapi-operation';
const RESOURCE_TYPE = 'jsonapi-resource-type';

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
  protected _resolver: SerializerResolver;
  protected _schema: Schema;
  protected _keyMap: KeyMap;

  constructor(settings: {
    resolver: SerializerResolver;
    schema: Schema;
    keyMap?: KeyMap;
    serializationOptions?: SerializationOptions;
    deserializationOptions?: DeserializationOptions;
  }) {
    const {
      resolver,
      schema,
      keyMap,
      serializationOptions,
      deserializationOptions
    } = settings;
    super({
      resolver,
      serializationOptions,
      deserializationOptions
    });
    this._resolver = resolver;
    this._schema = schema;
    this._keyMap = keyMap;
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  serializerFor(type: string): UnknownSerializer {
    return this._resolver.resolve(type);
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
