/* eslint @typescript-eslint/no-empty-interface:off */
import { Dict } from '@orbit/utils';
import { Link, RecordOperation } from '@orbit/data';
import { ResourceOperation } from './atomic-operations';

export interface ResourceOperationsDocument {
  links?: Dict<Link>;
  meta?: Dict<any>;
  operations: ResourceOperation[];
}

export interface RecordOperationsDocument {
  links?: Dict<Link>;
  meta?: Dict<any>;
  operations: RecordOperation[];
}
