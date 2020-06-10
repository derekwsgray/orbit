import { deepSet, Dict } from '@orbit/utils';
import {
  Schema,
  KeyMap,
  Record,
  RecordIdentity,
  RecordOperation,
  ModelDefinition
} from '@orbit/data';
import {
  BooleanSerializer,
  StringSerializer,
  DateSerializer,
  DateTimeSerializer,
  Serializer,
  NumberSerializer,
  StringSerializerOptions
} from '@orbit/serializers';
import {
  Resource,
  ResourceIdentity,
  ResourceRelationship
} from './jsonapi-resource';
import { ResourceOperation } from './atomic-operations';
import { ResourceOperationsDocument } from './atomic-operations-documents';
import { RecordDocument, ResourceDocument } from './jsonapi-documents';
import { JSONAPIOperationSerializer } from './serializers/jsonapi-operation-serializer';
import {
  JSONAPIResourceSerializer,
  JSONAPIResourceSerializationOptions
} from './serializers/jsonapi-resource-serializer';
import {
  JSONAPIResourceIdentitySerializer,
  JSONAPIResourceIdentitySerializationOptions
} from './serializers/jsonapi-resource-identity-serializer';

export interface JSONAPISerializerOptions {
  primaryRecord?: Record;
  primaryRecords?: Record[];
}

export interface JSONAPISerializerSettings {
  schema: Schema;
  keyMap?: KeyMap;
  serializers?: Dict<Serializer<any, any, any>>;
}

const RESOURCE = 'jsonapi-resource';
const RESOURCE_IDENTITY = 'jsonapi-resource-identity';
const RESOURCE_TYPE = 'jsonapi-resource-type';
const RESOURCE_OPERATION = 'jsonapi-operation';
const RESOURCE_FIELD = 'jsonapi-resource-field';

export class JSONAPISerializer
  implements
    Serializer<RecordDocument, ResourceDocument, JSONAPISerializerOptions> {
  protected _schema: Schema;
  protected _keyMap: KeyMap;
  protected _serializers: Dict<Serializer<any, any, any>>;

  constructor(settings: JSONAPISerializerSettings) {
    this._schema = settings.schema;
    this._keyMap = settings.keyMap;
    this._initSerializers(settings.serializers);
  }

  get schema(): Schema {
    return this._schema;
  }

  get keyMap(): KeyMap {
    return this._keyMap;
  }

  serializerFor(type: string): Serializer<any, any, any> {
    return this._serializers[type];
  }

  resourceKey(type: string): string {
    return 'id';
  }

  resourceType(type: string): string {
    return this.typeSerializer.serialize(type);
  }

  resourceRelationship(type: string, relationship: string): string {
    return this.fieldSerializer.serialize(relationship);
  }

  resourceAttribute(type: string, attr: string): string {
    return this.fieldSerializer.serialize(attr);
  }

  resourceIdentity(identity: RecordIdentity): ResourceIdentity {
    return {
      type: this.resourceType(identity.type),
      id: this.resourceId(identity.type, identity.id)
    };
  }

  resourceIds(type: string, ids: string[]): string[] {
    return ids.map((id) => this.resourceId(type, id));
  }

  resourceId(type: string, id: string): string {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return id;
    } else {
      return this.keyMap.idToKey(type, resourceKey, id);
    }
  }

  recordId(type: string, resourceId: string): string {
    let resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      return resourceId;
    }

    let existingId = this.keyMap.keyToId(type, resourceKey, resourceId);

    if (existingId) {
      return existingId;
    }

    return this._generateNewId(type, resourceKey, resourceId);
  }

  recordType(resourceType: string): string {
    return this.typeSerializer.deserialize(resourceType);
  }

  recordIdentity(resourceIdentity: ResourceIdentity): RecordIdentity {
    let type = this.recordType(resourceIdentity.type);
    let id = this.recordId(type, resourceIdentity.id);
    return { type, id };
  }

  recordAttribute(type: string, resourceAttribute: string): string {
    return this.fieldSerializer.deserialize(resourceAttribute);
  }

  recordRelationship(type: string, resourceRelationship: string): string {
    return this.fieldSerializer.deserialize(resourceRelationship);
  }

  serialize(document: RecordDocument): ResourceDocument {
    let data = document.data;

    return {
      data: Array.isArray(data)
        ? this.serializeRecords(data as Record[])
        : this.serializeRecord(data as Record)
    };
  }

  serializeOperations(operations: RecordOperation[]): ResourceOperation[] {
    return operations.map((operation) => this.serializeOperation(operation));
  }

  serializeOperation(operation: RecordOperation): ResourceOperation {
    return this.operationSerializer.serialize(operation);
  }

  serializeRecords(records: Record[]): Resource[] {
    return records.map((record) => this.serializeRecord(record));
  }

  serializeRecord(record: Record): Resource {
    const resource: Resource = {
      type: this.resourceType(record.type)
    };
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.serializeId(resource, record, model);
    this.serializeAttributes(resource, record, model);
    this.serializeRelationships(resource, record, model);

    return resource;
  }

  serializeIdentity(record: Record): ResourceIdentity {
    return {
      type: this.resourceType(record.type),
      id: this.resourceId(record.type, record.id)
    };
  }

  serializeId(
    resource: Resource,
    record: RecordIdentity,
    model: ModelDefinition
  ): void {
    let value = this.resourceId(record.type, record.id);
    if (value !== undefined) {
      resource.id = value;
    }
  }

  serializeAttributes(
    resource: Resource,
    record: Record,
    model: ModelDefinition
  ): void {
    if (record.attributes) {
      Object.keys(record.attributes).forEach((attr) => {
        this.serializeAttribute(resource, record, attr, model);
      });
    }
  }

  serializeAttribute(
    resource: Resource,
    record: Record,
    attr: string,
    model: ModelDefinition
  ): void {
    let value: any = record.attributes[attr];
    if (value === undefined) {
      return;
    }
    const attrOptions = model.attributes[attr];
    if (attrOptions === undefined) {
      return;
    }
    const serializer = this._serializers[attrOptions.type];
    if (serializer) {
      value =
        value === null
          ? null
          : serializer.serialize(value, attrOptions.serializationOptions);
    }
    deepSet(
      resource,
      ['attributes', this.resourceAttribute(record.type, attr)],
      value
    );
  }

  serializeRelationships(
    resource: Resource,
    record: Record,
    model: ModelDefinition
  ): void {
    if (record.relationships) {
      Object.keys(record.relationships).forEach((relationship) => {
        this.serializeRelationship(resource, record, relationship, model);
      });
    }
  }

  serializeRelationship(
    resource: Resource,
    record: Record,
    relationship: string,
    model: ModelDefinition
  ): void {
    const value = record.relationships[relationship].data;

    if (value === undefined) {
      return;
    }
    if (model.relationships[relationship] === undefined) {
      return;
    }

    let data;

    if (Array.isArray(value)) {
      data = (value as RecordIdentity[]).map((id) => this.resourceIdentity(id));
    } else if (value !== null) {
      data = this.resourceIdentity(value as RecordIdentity);
    } else {
      data = null;
    }

    const resourceRelationship = this.resourceRelationship(
      record.type,
      relationship
    );

    deepSet(resource, ['relationships', resourceRelationship, 'data'], data);
  }

  deserialize(
    document: ResourceDocument,
    options?: JSONAPISerializerOptions
  ): RecordDocument {
    let result: RecordDocument;
    let data;

    if (Array.isArray(document.data)) {
      let primaryRecords = options && options.primaryRecords;
      if (primaryRecords) {
        data = (document.data as Resource[]).map((entry, i) => {
          return this.deserializeResource(entry, primaryRecords[i]);
        });
      } else {
        data = (document.data as Resource[]).map((entry) =>
          this.deserializeResource(entry)
        );
      }
    } else if (document.data !== null) {
      let primaryRecord = options && options.primaryRecord;
      if (primaryRecord) {
        data = this.deserializeResource(
          document.data as Resource,
          primaryRecord
        );
      } else {
        data = this.deserializeResource(document.data as Resource);
      }
    } else {
      data = null;
    }
    result = { data };

    if (document.included) {
      result.included = document.included.map((e) =>
        this.deserializeResource(e)
      );
    }

    if (document.links) {
      result.links = document.links;
    }

    if (document.meta) {
      result.meta = document.meta;
    }

    return result;
  }

  deserializeOperationsDocument(
    document: ResourceOperationsDocument
  ): RecordOperation[] {
    return this.deserializeOperations(document.operations);
  }

  deserializeOperations(operations: ResourceOperation[]): RecordOperation[] {
    return operations.map((operation) => this.deserializeOperation(operation));
  }

  deserializeOperation(operation: ResourceOperation): RecordOperation {
    return this.operationSerializer.deserialize(operation);
  }

  deserializeResourceIdentity(
    resource: Resource,
    primaryRecord?: Record
  ): Record {
    let record: Record;
    const type: string = this.recordType(resource.type);
    const resourceKey = this.resourceKey(type);

    if (resourceKey === 'id') {
      record = { type, id: resource.id };
    } else {
      let id: string;
      let keys: Dict<string>;

      if (resource.id) {
        keys = {
          [resourceKey]: resource.id
        };

        id =
          (primaryRecord && primaryRecord.id) ||
          this.keyMap.idFromKeys(type, keys) ||
          this.schema.generateId(type);
      } else {
        id =
          (primaryRecord && primaryRecord.id) || this.schema.generateId(type);
      }

      record = { type, id };

      if (keys) {
        record.keys = keys;
      }
    }

    if (this.keyMap) {
      this.keyMap.pushRecord(record);
    }

    return record;
  }

  deserializeResource(resource: Resource, primaryRecord?: Record): Record {
    const record = this.deserializeResourceIdentity(resource, primaryRecord);
    const model: ModelDefinition = this._schema.getModel(record.type);

    this.deserializeAttributes(record, resource, model);
    this.deserializeRelationships(record, resource, model);
    this.deserializeLinks(record, resource, model);
    this.deserializeMeta(record, resource, model);

    return record;
  }

  deserializeAttributes(
    record: Record,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.attributes) {
      Object.keys(resource.attributes).forEach((resourceAttribute) => {
        let attribute = this.recordAttribute(record.type, resourceAttribute);
        if (this.schema.hasAttribute(record.type, attribute)) {
          let value = resource.attributes[resourceAttribute];
          this.deserializeAttribute(record, attribute, value, model);
        }
      });
    }
  }

  deserializeAttribute(
    record: Record,
    attr: string,
    value: any,
    model: ModelDefinition
  ): void {
    record.attributes = record.attributes || {};
    if (value !== undefined && value !== null) {
      const attrOptions = model.attributes[attr];
      const serializer = this._serializers[attrOptions.type];
      if (serializer) {
        value = serializer.deserialize(
          value,
          attrOptions.deserializationOptions
        );
      }
    }
    record.attributes[attr] = value;
  }

  deserializeRelationships(
    record: Record,
    resource: Resource,
    model: ModelDefinition
  ): void {
    if (resource.relationships) {
      Object.keys(resource.relationships).forEach((resourceRel) => {
        let relationship = this.recordRelationship(record.type, resourceRel);
        if (this.schema.hasRelationship(record.type, relationship)) {
          let value = resource.relationships[resourceRel];
          this.deserializeRelationship(record, relationship, value, model);
        }
      });
    }
  }

  deserializeRelationship(
    record: Record,
    relationship: string,
    value: ResourceRelationship,
    model: ModelDefinition
  ) {
    let resourceData = value.data;

    if (resourceData !== undefined) {
      let data;

      if (resourceData === null) {
        data = null;
      } else if (Array.isArray(resourceData)) {
        data = (resourceData as ResourceIdentity[]).map((resourceIdentity) =>
          this.recordIdentity(resourceIdentity)
        );
      } else {
        data = this.recordIdentity(resourceData as ResourceIdentity);
      }

      deepSet(record, ['relationships', relationship, 'data'], data);
    }

    let { links, meta } = value;

    if (links !== undefined) {
      deepSet(record, ['relationships', relationship, 'links'], links);
    }

    if (meta !== undefined) {
      deepSet(record, ['relationships', relationship, 'meta'], meta);
    }
  }

  deserializeLinks(record: Record, resource: Resource, model: ModelDefinition) {
    if (resource.links) {
      record.links = resource.links;
    }
  }

  deserializeMeta(record: Record, resource: Resource, model: ModelDefinition) {
    if (resource.meta) {
      record.meta = resource.meta;
    }
  }

  // Protected / Private

  protected get resourceSerializer(): Serializer<
    Record,
    Resource,
    JSONAPIResourceSerializationOptions
  > {
    return this._serializers[RESOURCE];
  }

  protected get identitySerializer(): Serializer<
    RecordIdentity,
    ResourceIdentity,
    JSONAPIResourceIdentitySerializationOptions
  > {
    return this._serializers[RESOURCE_IDENTITY];
  }

  protected get typeSerializer(): Serializer<
    string,
    string,
    StringSerializerOptions
  > {
    return this._serializers[RESOURCE_TYPE];
  }

  protected get fieldSerializer(): Serializer<
    string,
    string,
    StringSerializerOptions
  > {
    return this._serializers[RESOURCE_FIELD];
  }

  protected get operationSerializer(): Serializer<
    RecordOperation,
    ResourceOperation,
    unknown
  > {
    return this._serializers[RESOURCE_OPERATION];
  }

  protected _initSerializers(
    customSerializers: Dict<Serializer<any, any, any>> = {}
  ): void {
    const serializers = { ...customSerializers };
    serializers.boolean = serializers.boolean || new BooleanSerializer();
    serializers.string = serializers.string || new StringSerializer();
    serializers.date = serializers.date || new DateSerializer();
    serializers.datetime = serializers.datetime || new DateTimeSerializer();
    serializers.number = serializers.number || new NumberSerializer();

    const options = {
      keyMap: this.keyMap,
      schema: this.schema,
      serializerFor: this.serializerFor.bind(this)
    };

    serializers[RESOURCE_OPERATION] =
      serializers[RESOURCE_OPERATION] ||
      new JSONAPIOperationSerializer(options);

    serializers[RESOURCE_IDENTITY] =
      serializers[RESOURCE_IDENTITY] ||
      new JSONAPIResourceIdentitySerializer(options);

    serializers[RESOURCE] =
      serializers[RESOURCE] || new JSONAPIResourceSerializer(options);

    serializers[RESOURCE_TYPE] =
      serializers[RESOURCE_TYPE] ||
      new StringSerializer({
        inflections: ['pluralize', 'dasherize'],
        pluralizeFn: this.schema.pluralize,
        singularizeFn: this.schema.singularize
      });

    serializers[RESOURCE_FIELD] =
      serializers[RESOURCE_FIELD] ||
      new StringSerializer({
        inflections: ['dasherize']
      });

    this._serializers = serializers;
  }

  protected _generateNewId(
    type: string,
    keyName: string,
    keyValue: string
  ): string {
    let id = this.schema.generateId(type);

    this.keyMap.pushRecord({
      type,
      id,
      keys: {
        [keyName]: keyValue
      }
    });

    return id;
  }
}
