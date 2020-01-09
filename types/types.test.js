const {
  TypeDB,
  TypeProvider,
  TypeFunction,
  TypeRPC,
  TypeArray, TypeInstance,
  TypeString, TypeDefined,
  TypeNumber, TypeBoolean, TypeAddress,
  TypeHex, TypeBigNumber, TypeObject,
} = require('./types');
const { big, emptyAddress } = require('../utils/utils');

// Core
const { test } = require('zora');

// Test verify block header
test('module test', async t => {
  try { TypeString(0); } catch (error) { t.ok(error); }
  try { TypeArray({}); } catch (error) { t.ok(error); }
  try { TypeInstance(new TypeString('s'), 'TypeBoolean'); } catch (error) { t.ok(error); }
  try { TypeBoolean(1); } catch (error) { t.ok(error); }
  try { TypeObject(1); } catch (error) { t.ok(error); }
  try { TypeHex(1); } catch (error) { t.ok(error); }
  try { TypeHex("0x01", 2); } catch (error) { t.ok(error); }
  try { TypeBigNumber(1); } catch (error) { t.ok(error); }
  try { TypeAddress(1); } catch (error) { t.ok(error); }
  try { TypeDefined(undefined); } catch (error) { t.ok(error); }
  try { TypeFunction(undefined); } catch (error) { t.ok(error); }
  try { TypeFunction(undefined); } catch (error) { t.ok(error); }
  try { TypeProvider(undefined); } catch (error) { t.ok(error); }

  try { t.eq(undefined, TypeString("")); } catch (error) { }
  try { t.eq(undefined, TypeArray([])); } catch (error) {}
  try { t.eq(undefined, TypeInstance(new TypeString('s'), 'TypeString')); } catch (error) { }
  try { t.eq(undefined, TypeBoolean(true)); } catch (error) {}
  try { t.eq(undefined, TypeObject({})); } catch (error) {}
  try { t.eq(undefined, TypeHex("0x1")); } catch (error) { }
  try { t.eq(undefined, TypeHex("0x2222", 2)); } catch (error) { }
  try { t.eq(undefined, TypeBigNumber(big(1))); } catch (error) { }
  try { t.eq(undefined, TypeAddress(emptyAddress)); } catch (error) { }
  try { t.eq(undefined, TypeDefined(11)); } catch (error) {  }
  try { t.eq(undefined, TypeFunction(() => {})); } catch (error) {  }
  try { t.eq(undefined, TypeProvider({ sendAsync: () => {} })); } catch (error) { }
});
