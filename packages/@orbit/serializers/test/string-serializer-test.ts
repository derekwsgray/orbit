import {
  StringSerializer,
  StringTransformConst
} from '../src/string-serializer';

const { module, test } = QUnit;

module('StringSerializer', function (hooks) {
  let serializer: StringSerializer;

  module('with no options', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer();
    });

    test('#serialize returns arg untouched', function (assert) {
      assert.equal(serializer.serialize('abc'), 'abc');
    });

    test('#deserialize returns arg untouched', function (assert) {
      assert.equal(serializer.deserialize('abc'), 'abc');
    });

    test('#serialize returns nulls', function (assert) {
      assert.equal(serializer.serialize(null), null);
    });

    test('#deserialize returns nulls', function (assert) {
      assert.equal(serializer.deserialize(null), null);
    });
  });

  module('serializationOptions: { disallowNull: false }', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { disallowNull: false }
      });
    });

    test('#serialize returns nulls', function (assert) {
      assert.equal(serializer.serialize(null), null);
    });

    test('#deserialize returns nulls', function (assert) {
      assert.equal(serializer.deserialize(null), null);
    });
  });

  module('serializationOptions: { disallowNull: true }', function (hooks) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { disallowNull: true }
      });
    });

    test('#serialize throws error on null', function (assert) {
      assert.throws(() => {
        serializer.serialize(null);
      }, 'null is not allowed');
    });

    test('#deserialize throws error on null', function (assert) {
      assert.throws(() => {
        serializer.deserialize(null);
      }, 'null is not allowed');
    });
  });

  module("serializationOptions: { transforms: ['dasherize'] }", function (
    hooks
  ) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['dasherize'] }
      });
    });

    test('#serialize dasherizes strings', function (assert) {
      assert.equal(
        serializer.serialize('lowercase'),
        'lowercase',
        'leaves lowercase words alone'
      );
      assert.equal(
        serializer.serialize('MixedCase'),
        'mixed-case',
        'lowercases and dasherizes MixedCase words'
      );
      assert.equal(
        serializer.serialize('one_two'),
        'one-two',
        'dasherizes underscored words'
      );
      assert.equal(
        serializer.serialize('one two three'),
        'one-two-three',
        'converts space separated words'
      );
    });

    test('#deserialize camelizes strings', function (assert) {
      assert.equal(
        serializer.deserialize('lowercase'),
        'lowercase',
        'leaves lowercase words alone'
      );
      assert.equal(
        serializer.deserialize('MixedCase'),
        'mixedCase',
        'lowercases the first letter in MixedCase words'
      );
      assert.equal(
        serializer.deserialize('one-two'),
        'oneTwo',
        'converts dasherized words'
      );
      assert.equal(
        serializer.deserialize('one_two_three'),
        'oneTwoThree',
        'converts underscored words'
      );
      assert.equal(
        serializer.deserialize('one two three'),
        'oneTwoThree',
        'converts space separated words'
      );
    });
  });

  module("serializationOptions: { transforms: ['underscore'] }", function (
    hooks
  ) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['underscore'] }
      });
    });
    test('#serialize underscores strings', function (assert) {
      assert.equal(
        serializer.serialize('lowercase'),
        'lowercase',
        'leaves lowercase words alone'
      );
      assert.equal(
        serializer.serialize('MixedCase'),
        'mixed_case',
        'lowercases the first letter in MixedCase words'
      );
      assert.equal(
        serializer.serialize('oneTwo'),
        'one_two',
        'converts lowerCamelCase words'
      );
      assert.equal(
        serializer.serialize('one_two_three'),
        'one_two_three',
        'leaves underscore-separated words alone'
      );
      assert.equal(
        serializer.serialize('one two three'),
        'one_two_three',
        'underscores space-separated words'
      );
    });

    test('#deserialize camelizes strings', function (assert) {
      assert.equal(
        serializer.deserialize('lowercase'),
        'lowercase',
        'leaves lowercase words alone'
      );
      assert.equal(
        serializer.deserialize('MixedCase'),
        'mixedCase',
        'lowercases the first letter in MixedCase words'
      );
      assert.equal(
        serializer.deserialize('one-two'),
        'oneTwo',
        'converts dasherized words'
      );
      assert.equal(
        serializer.deserialize('one_two_three'),
        'oneTwoThree',
        'converts underscored words'
      );
      assert.equal(
        serializer.deserialize('one two three'),
        'oneTwoThree',
        'converts space separated words'
      );
    });
  });

  module("serializationOptions: { transforms: ['camelize'] }", function (
    hooks
  ) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['camelize'] }
      });
    });
    test('#serialize camelizes strings', function (assert) {
      assert.equal(
        serializer.serialize('lowercase'),
        'lowercase',
        'leaves lowercase words alone'
      );
      assert.equal(
        serializer.serialize('MixedCase'),
        'mixedCase',
        'lowercases the first letter in MixedCase words'
      );
      assert.equal(
        serializer.serialize('one-two'),
        'oneTwo',
        'converts dasherized words'
      );
      assert.equal(
        serializer.serialize('one_two_three'),
        'oneTwoThree',
        'converts underscored words'
      );
      assert.equal(
        serializer.serialize('one two three'),
        'oneTwoThree',
        'converts space separated words'
      );
    });

    test('#deserialize returns strings with no modification', function (assert) {
      assert.equal(serializer.deserialize('lowercase'), 'lowercase');
      assert.equal(serializer.deserialize('MixedCase'), 'MixedCase');
      assert.equal(serializer.deserialize('one-two'), 'one-two');
      assert.equal(serializer.deserialize('one_two_three'), 'one_two_three');
      assert.equal(serializer.deserialize('one two three'), 'one two three');
    });
  });

  module("serializationOptions: { transforms: ['pluralize'] }", function (
    hooks
  ) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['pluralize'] },
        pluralizeFn: (arg) => `${arg}z`,
        singularizeFn: (arg) => arg.substr(0, arg.length - 1)
      });
    });

    test('#serialize pluralizes strings with given pluralizeFn', function (assert) {
      assert.equal(serializer.serialize('cow'), 'cowz');
      assert.equal(serializer.serialize('person'), 'personz');
    });

    test('#deserialize singularizes strings with given singularizeFn', function (assert) {
      assert.equal(serializer.deserialize('cowz'), 'cow');
      assert.equal(serializer.deserialize('people'), 'peopl');
    });

    test('#serialize requires pluralizeFn', function (assert) {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['pluralize'] }
      });
      assert.throws(() => {
        serializer.serialize('cow');
      }, 'StringSerializer must be passed a `pluralizeFn` in order to pluralize a string');
    });

    test('#deserialize requires singularizeFn', function (assert) {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['pluralize'] }
      });
      assert.throws(() => {
        serializer.deserialize('cow');
      }, 'StringSerializer must be passed a `singularizeFn` in order to singularize a string');
    });
  });

  module("serializationOptions: { transforms: ['pluralize'] }", function (
    hooks
  ) {
    hooks.beforeEach(function () {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['singularize'] },
        pluralizeFn: (arg) => `${arg}z`,
        singularizeFn: (arg) => arg.substr(0, arg.length - 1)
      });
    });

    test('#serialize singularizes strings with given singularizeFn', function (assert) {
      assert.equal(serializer.serialize('cowz'), 'cow');
      assert.equal(serializer.serialize('people'), 'peopl');
    });

    test('#deserialize pluralizes strings with given pluralizeFn', function (assert) {
      assert.equal(serializer.deserialize('cow'), 'cowz');
      assert.equal(serializer.deserialize('person'), 'personz');
    });

    test('#serialize requires singularizeFn', function (assert) {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['singularize'] }
      });
      assert.throws(() => {
        serializer.deserialize('cow');
      }, "StringSerializer must be passed a 'singularizeFn' in order to singularize a string");
    });

    test('#deserialize requires pluralizeFn', function (assert) {
      serializer = new StringSerializer({
        serializationOptions: { transforms: ['singularize'] }
      });
      assert.throws(() => {
        serializer.deserialize('cow');
      }, "StringSerializer must be passed a 'pluralizeFn' in order to pluralize a string");
    });
  });

  module(
    "serializationOptions: { transforms: ['pluralize', 'dasherize'] }",
    function (hooks) {
      hooks.beforeEach(function () {
        serializer = new StringSerializer({
          serializationOptions: { transforms: ['pluralize', 'dasherize'] },
          pluralizeFn: (arg) => `${arg}s`,
          singularizeFn: (arg) => arg.substr(0, arg.length - 1)
        });
      });

      test('#serialize pluralizes and dasherizes strings', function (assert) {
        assert.equal(serializer.serialize('brownCow'), 'brown-cows');
      });

      test('#deserialize singularizes and camelizes strings', function (assert) {
        assert.equal(serializer.deserialize('brown-cows'), 'brownCow');
      });
    }
  );

  module("serializationOptions: { tranforms: ['unrecognized'] }", function (
    hooks
  ) {
    test('#serialize throws an error due to unrecognized inflection', function (assert) {
      serializer = new StringSerializer({
        serializationOptions: {
          transforms: ['unrecognized' as StringTransformConst]
        }
      });
      assert.throws(() => {
        serializer.serialize('cow');
      }, "StringSerializer does not recognize inflection 'unrecognized'");
    });
  });
});
