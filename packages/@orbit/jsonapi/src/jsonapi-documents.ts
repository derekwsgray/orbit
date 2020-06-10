/* eslint @typescript-eslint/no-empty-interface:off */
import { Dict } from '@orbit/utils';
import { Link, Record } from '@orbit/data';
import { Resource, ResourceIdentity } from './jsonapi-resource';

export interface RecordDocument {
  data: Record | Record[];
  included?: Record[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}

export interface ResourceDocument {
  data: Resource | Resource[] | ResourceIdentity | ResourceIdentity[];
  included?: Resource[];
  links?: Dict<Link>;
  meta?: Dict<any>;
}
