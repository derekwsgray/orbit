export interface SerializerOptions {
  disallowNull?: boolean;
}

export interface Serializer<From, To, Options> {
  serialize(arg: From, options?: Options): To;
  deserialize(arg: To, options?: Options): From;
}
