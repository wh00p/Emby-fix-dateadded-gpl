'use strict'
const Util = require('util');

/**
 * Wait for ms milliseconds
 * @param {uint} ms a uint value in milliseconds
 * @returns void
 */
async function sleep(ms) {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Compare Strings case insensitive - useful to compare adress 0x0021DaBF... 0x0021dAbf.
 * Tells if aVar is equal to anotherVar.
 * @param {String} aVar a text
 * @param {String} anotherVar another text
 * @returns true if aVar = anotherVar (case insensitive)
 */
function isStringDif(aVar, anotherVar) {
    if (aVar != null && anotherVar != null && aVar != '' && anotherVar != '') {
        return aVar.toUpperCase() != anotherVar.toUpperCase();
    } else {
        return aVar != anotherVar;
    }
}

/**
 * Compare Strings case insensitive - useful to compare adress 0x0021DaBF... 0x0021dAbf.
 * Tells if aVar is different from anotherVar.
 * @param {String} aVar 
 * @param {String} anotherVar 
 * @returns true if aVar != anotherVar (case insensitive)
 */
function isStringEq(aVar, anotherVar) {
    try {
        if (aVar != null && anotherVar != null && aVar != '' && anotherVar != '') {
            return aVar.toUpperCase() == anotherVar.toUpperCase();
        } else {
            return aVar == anotherVar;
        }
    } catch (error) {
        console.log('aVar=' + aVar + '|anotherVar=' + anotherVar);
        error.message = 'aVar=' + aVar + '|anotherVar=' + anotherVar + ' > ERROR: ' + error.message;
        throw error;
    }

}

module.exports = {
    sleep,
    isStringDif,
    isStringEq
};