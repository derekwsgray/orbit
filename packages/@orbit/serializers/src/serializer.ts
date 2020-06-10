export interface Serializer<
  From,
  To,
  SerializationOptions,
  DeserializationOptions
> {
  serialize(arg: From, options?: SerializationOptions): To;
  deserialize(arg: To, options?: DeserializationOptions): From;
}
