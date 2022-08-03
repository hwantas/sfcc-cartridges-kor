'use strict';

var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');
var Logger = require('dw/system/Logger');
var MessageDigest = require('dw/crypto/MessageDigest');

/**
 * get logger for Inicis
 * @param {string} type : log type for file name
 * @param {string} category : log category
 * @returns {dw.system.Logger} : logger
 */
function getLogger(type, category) {
    var logger = Logger.getLogger(
        'Inicis' + (type ? '-' + type : ''),
        category || 'Inicis');
    return logger;
}

/**
 * check Inicis payment is used
 * @param {dw.order.LineItemCtnr} lineItemCtnr : basket or order to check
 * @returns {boolean} : true for Inicis used
 */
function isInicis(lineItemCtnr) {
    if (!lineItemCtnr) {
        return false;
    }
    var pis = lineItemCtnr.getPaymentInstruments('INICIS');
    if (pis && pis.length > 0) { // it is Inicis Payment.
        return true;
    }
    return false;
}

/**
 * get hashed string as specific encoding
 * @param {string} src : string to hash
 * @param {string} algorithm : hash algorithm
 * @param {string} encoding : result encoding. if encoding is null, return as Bytes
 * @returns {string} / {dw.util.Bytes} : hashed string / Bytes
 */
function getHash(src, algorithm, encoding) {
    var srcBytes = new Bytes(src);
    var digest = new MessageDigest(algorithm);
    var signBytes = digest.digestBytes(srcBytes);
    var sign;
    switch (encoding) {
        case 'base64':
            sign = Encoding.toBase64(signBytes);
            break;
        case 'hex':
            sign = Encoding.toHex(signBytes);
            break;
        default:
            sign = signBytes;
            break;
    }
    return sign;
}

/**
 * get signature for Inicis
 * @param {Object} data : data object to get signature
 * @returns {string} : signature
 */
function getSignature(data) {
    var dataArr = Object.keys(data).map(function (key) {
        return key + '=' + data[key];
    });

    return getHash(dataArr.join('&'), MessageDigest.DIGEST_SHA_256, 'hex');
}

/**
 * get hashed inicis_signKey from preferences
 * @returns {string} : hashed inicis_signKey
 */
function getHahsedMKey() {
    var Site = require('dw/system/Site').current;
    var signKeyStr = Site.getCustomPreferenceValue('inicis_signKey');
    return getHash(signKeyStr, MessageDigest.DIGEST_SHA_256, 'hex');
}

/**
 * get hash for Inicis mobile payment fake check
 * @param {number} amt : amount of Inicis payment
 * @param {string} oid : order number
 * @param {number} timestamp : timestamp for request time
 * @param {string} hashKey : inicis_mobileHashKey from preference
 * @returns {string} : hashed string (base64)
 */
function getChkFakeHash(amt, oid, timestamp, hashKey) {
    var hashSrc = amt + oid + timestamp + hashKey;
    return getHash(hashSrc, MessageDigest.DIGEST_SHA_512, 'base64');
}

/**
 * convert NVP string to Object
 * @param {string} str : formatted as NVP
 * @returns {Object} : data object
 */
function nvpToObj(str) {
    var pairs = str.split('&');
    var data = {};
    pairs.forEach(function (item) {
        var pair = item.split('=');
        if (pair.length > 1) {
            data[pair[0]] = pair[1];
        }
    });
    return data;
}

module.exports = {
    getLogger: getLogger,
    Logger: getLogger(),
    isInicis: isInicis,
    getHash: getHash,
    getSignature: getSignature,
    getHahsedMKey: getHahsedMKey,
    getChkFakeHash: getChkFakeHash,
    nvpToObj: nvpToObj
};
