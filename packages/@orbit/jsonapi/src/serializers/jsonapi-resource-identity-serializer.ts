import { Record, Schema, KeyMap } from '@orbit/data';
import { Dict } from '@orbit/utils';
import { Resource } from '../jsonapi-resource';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';
import { SerializerForFn } from '@orbit/serializers';

export interface JSONAPIResourceIdentityDeserializationOptions {
  primaryRecord?: Record;
}

export interface JSONAPIResourceIdentitySerializerSettings {
  serializerFor?: SerializerForFn;
  deserializationOptions?: JSONAPIResourceIdentityDeserializationOptions;
  schema: Schema;
  keyMap?: KeyMap;
  getResourceKey?: (recordType: string) => string;
}

export class JSONAPIResourceIdentitySerializer extends JSONAPIBaseSerializer<
  Record,
  Resource,
  unknown,
  JSONAPIResourceIdentityDeserializationOptions
> {
  getResourceKey?: (recordType: string) => string;

  constructor(settings: JSONAPIResourceIdentitySerializerSettings) {
    super(settings);
    this.getResourceKey = settings.getResourceKey;
  }

  serialize(recordIdentity: Record): Resource {
    const { type, id } = recordIdentity;

    const resourceKey: string = this.getResourceKey
      ? this.getResourceKey(type)
      : 'id';

    const resourceType = this.typeSerializer.serialize(type);

    const resourceId =
      resourceKey === 'id' ? id : this.keyMap.idToKey(type, resourceKey, id);

    return {
      type: resourceType,
      id: resourceId
    };
  }

  deserialize(
    resource: Resource,
    customOptions?: JSONAPIResourceIdentityDeserializationOptions
  ): Record {
    const options = this.buildDeserializationOptions(customOptions);
    const recordType = this.typeSerializer.deserialize(resource.type);

    const resourceKey: string = this.getResourceKey
      ? this.getResourceKey(recordType)
      : 'id';

    if (resourceKey === 'id') {
      return { type: recordType, id: resource.id };
    } else {
      const primaryRecord = options?.primaryRecord;
      let id: string;
      let keys: Dict<string>;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          options.primaryRecord?.id ||
          this.keyMap.idFromKeys(recordType, keys) ||
          this.schema.generateId(recordType);
      } else {
        id =
          (primaryRecord && primaryRecord.id) ||
          this.schema.generateId(recordType);
      }

      const record: Record = { type: recordType, id };

      if (keys && this.keyMap) {
        record.keys = keys;
        this.keyMap.pushRecord(record);
      }

      return record;
    }
  }
}
