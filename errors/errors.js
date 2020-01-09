const { TypeNumber } = require('../types/types');
const { FuelFraudNames } = require('../interfaces/interfaces');

// ByPassError for throwing a copy..
function ByPassError(error) { return error; }

// Proof Error
function ProofError(proof) {
  this.message = 'ProofError' + (proof.type || proof.kind || '');
  var error = new Error(this.message);
  this.name = 'ProofError';
  error.name = this.name;
  this.proof = proof;
  this.stack = error.stack;
}
ProofError.prototype = Object.create(Error.prototype);

// Fuel Custom Error
function FuelError(msg) {
  this.message = 'FuelError' + (msg || '');
  var error = new Error(this.message);
  this.name = 'FuelError';
  error.name = this.name;
  this.stack = error.stack;
}
FuelError.prototype = Object.create(Error.prototype);

// Fuel Custom Error
function FraudError(fraudCode = 0, message) {
  if (typeof fraudCode !== 'number') { throw new Error(`Invalid fraud code must be number, ${fraudCode}`); }
  this.message = 'FraudError ' + ((FuelFraudNames || {})[fraudCode || 0] || message);
  var error = new Error(this.message);
  error.name = this.name;
  this.fraudCode = fraudCode;
  this.stack = error.stack;
}
FraudError.prototype = Object.create(Error.prototype);

// Strict Typing System
function TypeError(error) {
  this.name = 'TypeError';
  this.message = error.message || '';
  var error = new Error(this.message);
  error.name = this.name;
  this.stack = error.stack;
}
TypeError.prototype = Object.create(Error.prototype);

// Assert or Fraud for Consensus logic
function assertOrFraud(statement, fraudCode, message = null) {
  if (!statement) {
    throw new FraudError(fraudCode, message);
  }
}

// Assert or Fraud for Consensus logic
function assert(statement, message = null) {
  if (!statement) {
    throw new Error(message);
  }
}

module.exports = {
  ByPassError,
  ProofError,
  FuelError,
  FraudError,
  TypeError,
  assertOrFraud,
  assert,
};
