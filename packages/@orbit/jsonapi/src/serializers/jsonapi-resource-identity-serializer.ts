import { Record, RecordIdentity } from '@orbit/data';
import { Dict } from '@orbit/utils';
import { ResourceIdentity } from '../jsonapi-resource';
import { JSONAPIBaseSerializer } from './jsonapi-base-serializer';

export interface JSONAPIResourceIdentitySerializationOptions {
  primaryRecord?: Record;
  getResourceKey?: (recordType: string) => string;
}

export class JSONAPIResourceIdentitySerializer extends JSONAPIBaseSerializer<
  RecordIdentity,
  ResourceIdentity,
  JSONAPIResourceIdentitySerializationOptions,
  JSONAPIResourceIdentitySerializationOptions
> {
  serialize(
    recordIdentity: RecordIdentity,
    options?: JSONAPIResourceIdentitySerializationOptions
  ): ResourceIdentity {
    const { type, id } = recordIdentity;

    const resourceKey: string = options?.getResourceKey
      ? options.getResourceKey(type)
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
    resourceIdentity: ResourceIdentity,
    options?: JSONAPIResourceIdentitySerializationOptions
  ): RecordIdentity {
    const recordType = this.typeSerializer.deserialize(resourceIdentity.type);
    const resourceKey: string = options?.getResourceKey
      ? options.getResourceKey(recordType)
      : 'id';

    if (resourceKey === 'id') {
      return { type: recordType, id: resourceIdentity.id };
    } else {
      const primaryRecord = options?.primaryRecord;
      let id: string;
      let keys: Dict<string>;

      if (resourceIdentity.id) {
        keys = {
          [resourceKey]: resourceIdentity.id
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

      const recordIdentity: RecordIdentity = { type: recordType, id };

      if (keys && this.keyMap) {
        this.keyMap.pushRecord({
          ...recordIdentity,
          keys
        });
      }

      return recordIdentity;
    }
  }
}
