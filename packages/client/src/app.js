#!/usr/bin/env node
'use strict';
const logic = require('@fuel-js/logic');
const schema = require('@fuel-js/interface');
const config = require('./config.local');
const { OwnedProxy } = require('@fuel-js/contracts'); 
const utils = require('@fuel-js/utils');
const ethers = require('ethers');
const cli = require('./cli');
const wallet = require('./wallet');
const exit = require('./exit');
const express = require('express');
const bodyParser = require('body-parser');
const oracle = require('./oracle');
const faucet = require('./faucet');
const recover = require('./recover');
const keyToWallet = require('./keyToWallet');
const retrieveBonds = require('./retrieveBonds');
const fetch = require('./fetch');

// Start async loop.
async function app(opts = {}) {
    // Start an express server.
    const app = express();
    const server = require('http').Server(app);

    // help / version / flags from command line
    const cl = cli();

    // Specify the port for RPC.
    const port = parseInt(cl.flags.port || 3000, 10);

    // loop continue var, keep pointer in object
    let loop = { continue: true };

    // loop exit
    exit(() => {
        // If loop still up, echo exit.
        if (loop.continue) {
            console.log('Attempting graceful shutdown...');
        }
        try {
            server.close();
        } catch (serverError) {
        }
        loop.continue = false;
    });

    // Nonce for txs.
    let nonce = 0;

    try {
        // Environment.
        const environment = (cl.flags.environment ? process.env : {});

        // This will convert a private key to a wallet file.
        if (cl.flags.privateKey) {
            // Produce key to wallet.
            await keyToWallet(cl.flags, environment);

            // Process exit.
            process.exit(0);
        }

        // Setup or load a wallet.
        let operator = null; // opts.operator || await wallet(cl.flags, environment);
        try {
            operator = opts.operator || await wallet(cl.flags, environment);
        } catch (error) {
            console.error('Fuel wallet setup error' + error.message);
            return;
        }

        // Special faucet operator.
        let faucetOperator = null;
        if (cl.flags.faucetWallet) {
            // Do the wallet loading for the faucet.
            faucetOperator = await wallet({
                wallet: cl.flags.faucetWallet,
            }, environment);
        }

        // Local dpeloyment
        let localDeploymentOpts = {};
        if (opts.localDeployment) {
            localDeploymentOpts = await opts.localDeployment(cl.flags);
        }

        // Provided network.
        const providedNetwork = opts.network || 'mainnet';

        // If CI flag for RPC is used, we have to do additional setup / checks.
        if (cl.flags.rpc) {
            // Sample provider and networks.
            let detectedNetwork = null;
            let lastConnectionError = null;
            let count = 0;

            // Max connecton attempts to RPC provider.
            const connectionAttempts = 10;

            // Try to connect with network a few times before setup and configuration.
            while (!detectedNetwork && count < connectionAttempts) {
                // Attempt connection and network collection.
                try {
                    // Sample provider.
                    const sampledProvider = new ethers.providers.JsonRpcProvider(
                        cl.flags.rpc,
                        providedNetwork,
                    );

                    // Detect network.
                    detectedNetwork = await sampledProvider.getNetwork();

                    // Network detected.
                    console.log('Network successfully detected: ' + detectedNetwork.name);
                } catch (connectionError) {
                    // Wait 2 seconds.
                    await utils.wait(2000);

                    // Set last error
                    lastConnectionError = connectionError;
                }

                // Count.
                count += 1;
            }

            // Count check.
            if (count >= 10) {
                console.error('Error while connecting to RPC provider: ');
                console.error(lastConnectionError);
            }
        }

        // Settings configuration defaults.
        let settings = config({
            network: providedNetwork,
            ...environment,
            ...cl.flags,
            loop,
            operator,
            faucetOperator,
            ...opts,
            ...localDeploymentOpts,
        });

        // Force clear the database (no command prompt needed.) -- used for CI.
        if (cl.flags.clearAndStop) {
            // Confirm clear. 
            utils.assert(
                await settings.prompt.confirm('Are you sure you want to clear?'), 
                'confirm-clear',
            );

            // clear the database
            await settings.db.clear();
            
            // Close server
            server.close();

            // Close the db.
            await settings.db.close();

            process.exit(0);
        }

        // Force clear the database (no command prompt needed.) -- used for CI.
        if (opts.forceClear) {
            // clear the database
            await settings.db.clear();
        }

        // Recover is used to recover from a del/put dump.
        // This can happen when writting large amounts of data to remote dbs.
        if (cl.flags.recover) {
            await recover(cl.flags.recover, settings);

            // Close the db.
            return await settings.db.close();
        }

        // Determine if there is a proxy involved.
        if (cl.flags.proxy) {
            // Get the operator address (i.e. the proxy address).
            const operatorAddress = await settings.contract.operator();

            // Get the operator.
            let proxy = new ethers.Contract(
                operatorAddress,
                OwnedProxy.abi,
                settings.provider,
            );

            // Connect the proxy and the wallet operator together.
            proxy = proxy.connect(settings.connectedOperator);

            // Check hot operator.
            const HotStorageAddress = 0;
            const hotRaw = await settings.provider.getStorageAt(
                operatorAddress,
                HotStorageAddress,
            );
            const hotSliced = utils.hexDataSlice(hotRaw, 12, 32);
            const hotAddress = utils.hexDataLength(hotRaw) === 20 ? hotRaw : hotSliced;

            // Check the proxy is correctly configured.
            settings.console.log(`Hot Operator: ${hotAddress} | Operator: ${operator.address}`);
            utils.assertHexEqual(hotAddress, operator.address,
                'The operator does not match the proxy hot operator, use --proxy=false to continue.');
        
            // Set the settings up with a proxy as the operator.
            settings = {
                ...settings,
                proxy,
            };
        }

        // Retrieve bonds from a given contract.
        if (cl.flags.retrieveBonds) {
            // Retrieve bonds from a given contract.
            await retrieveBonds(cl.flags.contract, settings);

            // Close the db.
            return await settings.db.close();
        }

        // Start a local faucet.
        if (cl.flags.faucet) {
            await faucet(settings);

            // Close the db.
            await settings.db.close();

            // Exit.
            process.exit(0);
        }

        // Start a price feed instance.
        if (cl.flags.oracle) {
            // Start the price feed oracle (will process.exit(0 at end)).
            await oracle(loop, settings);

            // Close the db.
            await settings.db.close();

            // Stop process.
            process.exit(0);
        }

        // Start RPC server.
        if (cl.flags.serve) {
            const helmet = require('helmet');

            app.use(helmet());
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({ extended: true }));

            app.use((req, res, next) => {
                res.setHeader('Access-Control-Allow-Origin', cl.flags.cors || 'http://localhost:1234');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
                next();
            });

            //pre-flight requests
            app.options('*', function(req, res) {
                res.send(200);
            });

            app.post('/get', async (req, res) => {   
                try {
                        const { key = '0x' } = req.method === 'GET'
                            ? req.query
                            : req.body;

                        res.status(200).json({
                            error: null,
                            result: utils.RLP.encode(await settings.db.get(key, {
                                remote: true,
                            })),
                        });
                        res.end();
                } catch (error) {
                        res.status(400);
                        res.end();
                }
            });

            app.post('/faucet', async (req, res) => {   
                try {
                    // Parse Object
                    const { owner = '0x' } = req.method === 'GET'
                        ? req.query
                        : req.body;

                    // if successful, make stub to prevent overuse
                    const unixhour = utils.unixtime() / 10; // 3600;
                    const ip = utils.ipToHex(req.headers['x-forwarded-for'] || '0.0.0.0');
                    const key = [ schema.db.faucet, utils.unixtime(), nonce++ ];

                    await settings.db.batch([
                        // No limit locally.
                        /*{
                            type: 'put',
                            key: [ schema.db.limit, ip, unixhour ],
                            value: '0x01',
                        },*/
                        {
                            type: 'put',
                            key,
                            value: owner,
                        },
                    ], {
                        remote: true,
                        upsert: false,
                        transact: true,
                    });

                    // faucet success!
                    res.status(200).json({
                        error: null,
                        result: utils.RLP.encode(schema.db.faucet.encode(key.slice(1))),
                    });
                    res.end();
                } catch (error) {
                    res.status(400);
                    res.end();
                }
            });

            app.post('/transact', async (req, res) => {
                try {
                    // Body.
                    const body = req.method === 'GET'
                        ? req.query
                        : req.body;

                    // Parse Object
                    const {
                        unsigned = '0x',
                        witnesses = '0x',
                    } = body;

                    // Fee enforcement.
                    let feeEnforcement = true;

                    // Get the body key if available.
                    const account = body.account
                        ? String(body.account || '0x').toLowerCase()
                        : null;

                    // Special API key.
                    const apiKey = utils.hexDataSlice(
                        utils.keccak256('0xbebebe'),
                        12,
                        32,
                    );

                    // Bypass fee enforcement.
                    if (account === apiKey) {
                        feeEnforcement = false;
                    }

                    // Nonce number which prevents transactions out of order, same lambda, same timestamp
                    nonce += 1;

                    // Produce transaction using remote aggregator.
                    if (settings.remote_production) {
                        await fetch({
                            unsigned: unsigned,
                            witnesses: witnesses,
                        }, {
                            path: '/transact',
                            network: providedNetwork,
                        });
                    }

                    // Transact with the DB.
                    res.status(200).json({
                        error: null,
                        result: utils.RLP.encode(
                            await logic.transact(
                                unsigned,
                                witnesses,
                                nonce,
                                {
                                    ...settings,
                                    account,
                                    feeEnforcement,
                                    nomempool: settings.remote_production ? true : false,
                                },
                            ),
                        ),
                    });
                    res.end();
                } catch (error) {
                    res.status(400);
                    res.end();
                }
            });

            app.post('/account', async (req, res) => {
                try {
                    // Parse Object
                    const {
                        owner = '0x',
                        timeMin = '0x00',
                        timeMax = '0xFFFFFFFFFFFFFFFF',
                        token = null,
                        proof = false,
                    } = req.method === 'GET'
                        ? req.query
                        : req.body;

                    res.status(200).json({
                        error: null,
                        result: utils.RLP.encode(
                            await logic.account(owner, timeMin, timeMax, token, proof, settings)
                        ),
                    });
                    res.end();
                } catch (error) {
                    res.status(400);
                    res.end();
                }
            });

            app.post('/profile', async (req, res) => {
                try {
                    // Parse Object
                    const options = req.method === 'GET'
                        ? req.query
                        : req.body;

                    res.status(200).json({
                        error: null,
                        result: utils.RLP.encode(
                            await logic.profile(options, settings),
                        ),
                    });
                    res.end();
                } catch (error) {
                    res.status(400);
                    res.end();
                }
            });

            app.post('/transactions', async (req, res) => {
                try {
                    // Parse Object
                    const {
                        blockHeight = '0x',
                        rootIndex = '0x',
                    } = req.method === 'GET'
                        ? req.query
                        : req.body;

                    res.status(200).json({
                        error: null,
                        result: utils.RLP.encode(
                            await logic.transactions(blockHeight, rootIndex, settings),
                        ),
                    });
                    res.end();
                } catch (error) {
                    res.status(400);
                    res.end();
                }
            });

            app.post('/stop', async (req, res) => {
                await server.stop();

                // Close the db.
                await settings.db.close();

                // exit process once complete
                process.exit(0);
            });

            // Server is now listening.
            await server.listen(port);

            // Log serve.
            settings.console.log('Serving Fuel RPC on port: ' + port);

            // logical sync for fuel using settings
            if (!cl.flags.nosync) {
                await logic.sync(settings);

                // Close the db.
                await settings.db.close();

                // exit process once complete
                process.exit(0);
            }
        } else {
            // logical sync for fuel using settings
            await logic.sync(settings);

            // Close the db.
            await settings.db.close();

            // exit process once complete
            process.exit(0);
        }
    } catch (clientError) {
        console.error('Client error: ' + clientError.message);
        process.exit(0);
    }
};

module.exports = app;
