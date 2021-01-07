const utils = require('@fuel-js/utils');

async function fetchRetry(path = '', obj = {}, opts = {}) {
    try {
      const maximumRetries = opts.retries || 10;
      let output = null;
      let error = null;
  
      // manage 502 retries if they occur
      for (var retry = 0; retry < maximumRetries; retry++) {
        try {
          output = await utils.fetch(path, obj);
          break;
        } catch (retryError) {
          // error
          error = retryError;
  
          // the lambda needs to be woken up..
          if (retryError.statusCode !== 502) {
            throw new utils.ByPassError(retryError);
            break;
          }
  
          // wait 1 second than try again..
          await utils.wait(1000);
        }
      }
  
      // if no output after 10 tries, than result the error
      if (!output) {
        throw new utils.ByPassError(error);
      }
  
      return output;
    } catch (fetchError) {
      throw new utils.ByPassError(fetchError);
    }
}

// _fetch, fetch data from the api provider, Returns: Array, RLP Decoded
async function fetch (obj = {}, opts = {}) {
    try {
      const path = opts.path || '/get';
  
      // Root api path
      const root = `https://${opts.network}.api.fuel.sh/v1`;
  
      // fetch
      const {
        error,
        result,
      } = await fetchRetry(`${root}${path}`, obj, opts);
  
      // if any error
      if (error) throw new Error(error);
  
      // Decode RLP
      return utils.RLP.decode(result);
    } catch (error) {
      throw new utils.ByPassError(error);
    }
  }

  module.exports = fetch;