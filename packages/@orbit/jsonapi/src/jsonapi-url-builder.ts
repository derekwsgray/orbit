import {
  AttributeFilterSpecifier,
  AttributeSortSpecifier,
  FilterSpecifier,
  KeyMap,
  PageSpecifier,
  QueryExpressionParseError,
  RelatedRecordFilterSpecifier,
  RelatedRecordsFilterSpecifier,
  SortSpecifier
} from '@orbit/data';
import { clone, Dict } from '@orbit/utils';
import { JSONAPISerializer } from './jsonapi-serializer';
import { Filter } from './lib/jsonapi-request-options';
import { appendQueryParams } from './lib/query-params';
import { SerializerForFn } from '@orbit/serializers';
import {
  RESOURCE_TYPE,
  RESOURCE_IDENTITY,
  RESOURCE_FIELD
} from './serializers/serializable-types';
import { ResourceIdentity } from './jsonapi-resource';

export interface JSONAPIURLBuilderSettings {
  host?: string;
  namespace?: string;
  serializer?: JSONAPISerializer;
  serializerFor?: SerializerForFn;
  keyMap?: KeyMap;
}

export default class JSONAPIURLBuilder {
  host: string;
  namespace: string;
  serializer?: JSONAPISerializer;
  serializerFor?: SerializerForFn;
  keyMap?: KeyMap;

  constructor(settings: JSONAPIURLBuilderSettings) {
    this.host = settings.host;
    this.namespace = settings.namespace;
    this.serializer = settings.serializer;
    this.serializerFor = settings.serializerFor;
    this.keyMap = settings.keyMap;
  }

  resourceNamespace(type?: string): string {
    return this.namespace;
  }

  resourceHost(type?: string): string {
    return this.host;
  }

  resourceURL(type: string, id?: string): string {
    let host = this.resourceHost(type);
    let namespace = this.resourceNamespace(type);
    let url: string[] = [];

    if (host) {
      url.push(host);
    }
    if (namespace) {
      url.push(namespace);
    }
    url.push(this.resourcePath(type, id));

    if (!host) {
      url.unshift('');
    }

    return url.join('/');
  }

  resourcePath(type: string, id?: string): string {
    let resourceType, resourceId;
    if (this.serializer) {
      resourceType = this.serializer.resourceType(type);
      if (id) {
        resourceId = this.serializer.resourceId(type, id);
      }
    } else if (id) {
      let identity = this.serializerFor(RESOURCE_IDENTITY).serialize({
        type,
        id
      }) as ResourceIdentity;
      resourceType = identity.type;
      resourceId = identity.id;
    } else {
      resourceType = this.serializerFor(RESOURCE_TYPE).serialize(type);
    }

    let path = [resourceType];
    if (resourceId) {
      path.push(resourceId);
    }
    return path.join('/');
  }

  resourceRelationshipURL(
    type: string,
    id: string,
    relationship: string
  ): string {
    return (
      this.resourceURL(type, id) +
      '/relationships/' +
      this.serializeRelationshipInPath(type, relationship)
    );
  }

  relatedResourceURL(type: string, id: string, relationship: string): string {
    return (
      this.resourceURL(type, id) +
      '/' +
      this.serializeRelationshipInPath(type, relationship)
    );
  }

  buildFilterParam(filterSpecifiers: FilterSpecifier[]): Filter[] {
    const filters: Filter[] = [];

    filterSpecifiers.forEach((filterSpecifier) => {
      if (
        filterSpecifier.kind === 'attribute' &&
        filterSpecifier.op === 'equal'
      ) {
        const attributeFilter = filterSpecifier as AttributeFilterSpecifier;

        // Note: We don't know the `type` of the attribute here, so passing `null`
        const resourceAttribute = this.serializeAttributeAsParam(
          null,
          attributeFilter.attribute
        );
        filters.push({ [resourceAttribute]: attributeFilter.value });
      } else if (filterSpecifier.kind === 'relatedRecord') {
        const relatedRecordFilter = filterSpecifier as RelatedRecordFilterSpecifier;
        if (Array.isArray(relatedRecordFilter.record)) {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter.record
              .map((e) => e.id)
              .join(',')
          });
        } else {
          filters.push({
            [relatedRecordFilter.relation]: relatedRecordFilter.record.id
          });
        }
      } else if (filterSpecifier.kind === 'relatedRecords') {
        if (filterSpecifier.op !== 'equal') {
          throw new Error(
            `Operation "${filterSpecifier.op}" is not supported in JSONAPI for relatedRecords filtering`
          );
        }
        const relatedRecordsFilter = filterSpecifier as RelatedRecordsFilterSpecifier;
        filters.push({
          [relatedRecordsFilter.relation]: relatedRecordsFilter.records
            .map((e) => e.id)
            .join(',')
        });
      } else {
        throw new QueryExpressionParseError(
          `Filter operation ${filterSpecifier.op} not recognized for JSONAPISource.`,
          filterSpecifier
        );
      }
    });

    return filters;
  }

  buildSortParam(sortSpecifiers: SortSpecifier[]): string {
    return sortSpecifiers
      .map((sortSpecifier) => {
        if (sortSpecifier.kind === 'attribute') {
          const attributeSort = sortSpecifier as AttributeSortSpecifier;

          // Note: We don't know the `type` of the attribute here, so passing `null`
          const resourceAttribute = this.serializeAttributeAsParam(
            null,
            attributeSort.attribute
          );
          return (
            (sortSpecifier.order === 'descending' ? '-' : '') +
            resourceAttribute
          );
        }
        throw new QueryExpressionParseError(
          `Sort specifier ${sortSpecifier.kind} not recognized for JSONAPISource.`,
          sortSpecifier
        );
      })
      .join(',');
  }

  buildPageParam(pageSpecifier: PageSpecifier): Dict<any> {
    let pageParam = clone(pageSpecifier);
    delete pageParam.kind;
    return pageParam;
  }

  appendQueryParams(url: string, params: any): string {
    let fullUrl = url;
    if (params) {
      fullUrl = appendQueryParams(fullUrl, params);
    }
    return fullUrl;
  }

  protected serializeAttributeAsParam(type: string, attribute: string): string {
    if (this.serializer) {
      return this.serializer.resourceAttribute(type, attribute);
    } else {
      return this.serializerFor(RESOURCE_FIELD).serialize(attribute) as string;
    }
  }

  protected serializeRelationshipAsParam(
    type: string,
    relationship: string
  ): string {
    if (this.serializer) {
      return this.serializer.resourceRelationship(type, relationship);
    } else {
      return this.serializerFor(RESOURCE_FIELD).serialize(
        relationship
      ) as string;
    }
  }

  protected serializeRelationshipInPath(
    type: string,
    relationship: string
  ): string {
    if (this.serializer) {
      return this.serializer.resourceRelationship(type, relationship);
    } else {
      return this.serializerFor(RESOURCE_FIELD).serialize(
        relationship
      ) as string;
    }
  }
}
