'use strict'
const Util = require('util');
const Request = require('request');
const Other = require('./otherutils.js');
const https = require('https');
const debug = false;
const winston = require('winston');
const { error } = require('winston');
const { splat, combine, timestamp, printf } = winston.format;
const logger = require('./logutils')(__filename);


const httpsOptions = {
    hostname: 'testnet.czer.fr',
    port: 443,
    path: '/api/v3/doSomething/item?id=1234',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        //'Content-Length': data.length,
        'Accept': '*/*',
        //'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
    }
};

/**
 * Interface for async https request, call back to return data. GET/POST/DELETE, url, headers, etc managed in anHttpOptions.
 * @param {*} anHttpOptions 
 * @param {uint} maxNbRetry a uint number of retry. default=0
 * @param {uint} retryDelay a number in milliseconds to wait before next retry. Default = 1000 ms
 * @returns {headers: Object, data: Object}        data= {headers, body} /!\ no need to JSON.parse
 */
async function callHttpsRequestInterface(anHttpOptions, maxNbRetry, retryDelay) {
    var respdat;
    try {
        respdat = await callImplemHttpsRequest(anHttpOptions, maxNbRetry, retryDelay);
        return respdat;
    } catch (error) {
        logger.error('[API] Error | ' + error)
        throw error;
    }
}

/**
 * Implementation of a promise for async https request. GET/POST/DELETE, url, headers, etc managed in anHttpOptions
 * @param {String} anHttpOptions a JSON data representing http options, see const apiutils.httpsOptions
 * @param {uint} maxNbRetry a uint number of retry. default=0
 * @param {uint} retryDelay a number in milliseconds to wait before next retry. Default = 1000 ms
 * @returns {headers: Object, data: Object}        data= {headers, body} /!\ no need to JSON.parse
 */
async function callImplemHttpsRequest(anHttpOptions, maxNbRetry, retryDelay) {
    if (maxNbRetry == undefined) maxNbRetry = 3;
    if (retryDelay == undefined) retryDelay = 3000;
    return new Promise((resolve, reject) => {
        let ctrl = 0;

        if (debug) {
            console.info('[API] Call[' + ctrl + '/' + maxNbRetry + ']: ' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path);
        }

        function run() {
            var req = https.request(anHttpOptions, (response) => {
                let data = '';

                // A chunk of data has been received.
                response.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                response.on('end', () => {
                    if (typeof response == 'undefined' || response == null) {
                        if (ctrl > maxNbRetry) {
                            logger.warn('API error: undefined | max retry(' + maxNbRetry + ') | tried' + '[' + ctrl + '/' + eval(maxNbRetry + 1) + ']+[httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                            reject(new Error('API error: undefined | max retry(' + maxNbRetry + ') | tried' + '[' + ctrl + '/' + eval(maxNbRetry + 1) + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data));
                        } else {
                            // (ctrl <= maxNbRetry)
                            console.warn('API error: undefined | will RETRY in ' + retryDelay + 'ms | retry' + '[' + ctrl + '/' + maxNbRetry + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                            setTimeout(run, retryDelay);
                        }
                    } else if (response.statusCode != 200) {
                        reject('Invalid status code <' + response.statusCode + '> [' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                    } else if (data.includes('<!DOCTYPE html PUBLIC') && ctrl > maxNbRetry) {
                        logger.warn('API response error containing "<!DOCTYPE html PUBLIC" | max retry(' + maxNbRetry + ') | tried' + '[' + ctrl + '/' + eval(maxNbRetry + 1) + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                        reject(error);
                    } else if (data.includes('<!DOCTYPE html PUBLIC') && ctrl <= maxNbRetry) {
                        logger.warn('API response error containing "<!DOCTYPE html PUBLIC" | will RETRY in ' + retryDelay + 'ms | retry' + '[' + ctrl + '/' + maxNbRetry + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                        setTimeout(run, retryDelay);
                    } else if (data.includes('Invalid') && ctrl <= maxNbRetry) {
                        logger.warn('API response error containing "Invalid " | ' + JSON.parse(data) + ' | will RETRY in ' + retryDelay + 'ms | retry' + '[' + ctrl + '/' + maxNbRetry + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'data: ' + data);
                        setTimeout(run, retryDelay);
                    } else {
                        //console.info(JSON.parse(data));
                        //console.log(response.headers);
                        let data2 = (data == '' || data == undefined) ? {} :  JSON.parse(data);
                        let result = {
                            headers: response.headers,
                            data: data2
                        }
                        resolve(result);
                    }
                });

            }).on("error", (err) => {
                if (ctrl > maxNbRetry) {
                    logger.warn('API error | ' + err.message + ' | max retry(' + maxNbRetry + ') | tried' + '[' + ctrl + '/' + eval(maxNbRetry + 1) + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']' + 'error: ' + err + ' ' + err.stack);
                    reject(error);
                } else {
                    // (ctrl <= maxNbRetry)
                    logger.warn('API error: | ' + err.message + ' | will RETRY in ' + retryDelay + 'ms | retry' + '[' + ctrl + '/' + maxNbRetry + ']+httpsOptions:' + anHttpOptions.hostname + ':' + anHttpOptions.port + anHttpOptions.path + ']');
                    setTimeout(run, retryDelay);
                }
            });
            req.end();
            ctrl++;
        }
        run();
    });
}



module.exports = {
    callHttpsRequestInterface
};