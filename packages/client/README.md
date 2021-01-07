# @fuel-js/client

> Fuel is a stateless "Layer-2" system for ERC20 transfers and swaps designed for interoperable performance, scale and efficiency.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
<a href="https://circleci.com/gh/badges/shields/tree/master"> <img src="https://img.shields.io/circleci/project/github/badges/shields/master" alt="build status"></a>
[![Community](https://img.shields.io/badge/chat%20on-discord-orange?&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/DDWxYY6)

## Usage

Please consult the SDK documentation:

[docs.fuel.sh](https://docs.fuel.sh)

## Build from Source

```bash
git clone https://github.com/FuelLabs/fuel-js
cd fuel-js/packages/client
npm install
npm run build-bin
```

Then select the distro for your environment i.e. `./dist/client-linux --help`

## Running from Source

You may run Fuel with NodeJS vanilla.

```bash
node src/index.js --help
```

## Recommended Go-Ethereum (Geth) Settings

```
geth --http
```

These are the recommended settings for `geth` which by default will host the go-ethereum RPC at `http://localhost:8545`. If you are still having trouble connection, try adjusting your `--http.cors` settings.
