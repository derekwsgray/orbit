import { deepMerge } from '@orbit/utils';
import {
  BooleanSerializer,
  StringSerializer,
  DateSerializer,
  DateTimeSerializer,
  NumberSerializer,
  buildSerializerFor,
  buildSerializerClassFor,
  buildSerializerSettingsFor,
  SerializerForFn,
  SerializerClassForFn,
  SerializerSettingsForFn
} from '@orbit/serializers';
import { JSONAPIOperationSerializer } from './jsonapi-operation-serializer';
import { JSONAPIResourceSerializer } from './jsonapi-resource-serializer';
import { JSONAPIResourceIdentitySerializer } from './jsonapi-resource-identity-serializer';
import { Schema, KeyMap } from '@orbit/data';
import {
  RESOURCE,
  RESOURCE_DOCUMENT,
  RESOURCE_FIELD,
  RESOURCE_IDENTITY,
  RESOURCE_OPERATION,
  RESOURCE_TYPE
} from './serializable-types';
import { JSONAPIDocumentSerializer } from './jsonapi-document-serializer';
import { JSONAPIResourceFieldSerializer } from './jsonapi-resource-field-serializer';

export function buildJSONAPISerializerFor(settings: {
  schema: Schema;
  keyMap?: KeyMap;
  serializerFor?: SerializerForFn;
  serializerClassFor?: SerializerClassForFn;
  serializerSettingsFor?: SerializerSettingsForFn;
}): SerializerForFn {
  const { schema, keyMap } = settings;

  let serializerClassFor = buildSerializerClassFor({
    boolean: BooleanSerializer,
    string: StringSerializer,
    date: DateSerializer,
    datetime: DateTimeSerializer,
    number: NumberSerializer,
    [RESOURCE]: JSONAPIResourceSerializer,
    [RESOURCE_DOCUMENT]: JSONAPIDocumentSerializer,
    [RESOURCE_IDENTITY]: JSONAPIResourceIdentitySerializer,
    [RESOURCE_OPERATION]: JSONAPIOperationSerializer,
    [RESOURCE_TYPE]: StringSerializer,
    [RESOURCE_FIELD]: JSONAPIResourceFieldSerializer
  });
  if (settings.serializerClassFor) {
    serializerClassFor = (type: string) => {
      return settings.serializerClassFor(type) || serializerClassFor(type);
    };
  }

  let serializerSettingsFor: SerializerSettingsForFn;
  let defaultSerializerSettingsFor = buildSerializerSettingsFor({
    sharedSettings: {
      keyMap,
      schema
    },
    settingsByType: {
      [RESOURCE_TYPE]: {
        serializationOptions: { transforms: ['pluralize', 'dasherize'] },
        pluralizeFn: schema.pluralize,
        singularizeFn: schema.singularize
      },
      [RESOURCE_FIELD]: {
        serializationOptions: { transforms: ['dasherize'] }
      }
    }
  });
  let customSerializerSettingsFor = settings.serializerSettingsFor;
  if (customSerializerSettingsFor) {
    serializerSettingsFor = (type: string) => {
      let defaultSerializerSettings = defaultSerializerSettingsFor(type) || {};
      let customSerializerSettings = customSerializerSettingsFor(type) || {};
      return deepMerge(defaultSerializerSettings, customSerializerSettings);
    };
  } else {
    serializerSettingsFor = defaultSerializerSettingsFor;
  }

  let customSerializerFor = settings.serializerFor;
  let backupSerializerFor = buildSerializerFor({
    serializerClassFor,
    serializerSettingsFor
  });
  if (customSerializerFor) {
    return (type: string) =>
      customSerializerFor(type) || backupSerializerFor(type);
  } else {
    return (type: string) => backupSerializerFor(type);
  }
}
