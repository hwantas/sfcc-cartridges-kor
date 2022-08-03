'use strict';

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisService = require('*/cartridge/scripts/inicisService');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

var MessageDigest = require('dw/crypto/MessageDigest');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site').current;
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');

/**
 * register delivery data for Inicis escrow payment
 * @param {dw.order.Order} order : order data
 * @param {Object} data : custom request data. refer to Inicis document.
 * @returns {boolean} : true for success
 */
function registerDelivery(order, data) {
    var status = order.custom.inicis_escrowStatus.value;
    if (status !== '1' && status !== '2') {
        return false;
    }
    var now = new Calendar();
    var pis = order.getPaymentInstruments('INICIS');

    var formData = Object.assign({}, data);
    formData.type = 'Dlv';
    formData.mid = formData.mid || Site.getCustomPreferenceValue('inicis_merchantID');
    formData.clientIp = formData.clientIp || Site.getCustomPreferenceValue('inicis_clientIp');
    formData.timestamp = formData.timestamp || StringUtils.formatCalendar(now, 'YYYYMMddHHmmss');
    formData.tid = formData.tid || order.custom.inicis_escrowTid;
    formData.oid = formData.oid || order.orderNo;
    formData.price = formData.price || pis[0].paymentTransaction.amount.value;
    formData.report = formData.report || status === '1' ? 'I' : 'U';
    formData.invoice = formData.invoice || order.defaultShipment.trackingNumber;
    formData.invoiceDay = formData.invoiceDay || StringUtils.formatCalendar(now, 'YYYYMMdd');
    formData.sendName = formData.sendName || Site.getCustomPreferenceValue('inicis_MNAME');
    formData.registName = formData.registName || Site.getCustomPreferenceValue('inicis_MNAME');
    formData.recvName = formData.recvName || order.defaultShipment.shippingAddress.fullName;
    formData.recvTel = formData.recvTel || order.defaultShipment.shippingAddress.phone;
    formData.recvPost = formData.recvPost || order.defaultShipment.shippingAddress.postalCode;
    formData.recvAddr = formData.recvAddr
        || [order.defaultShipment.shippingAddress.city,
            order.defaultShipment.shippingAddress.address1,
            order.defaultShipment.shippingAddress.address2].join(' ');
    // mandatory check
    [
        'type',
        'mid',
        'clientIp',
        'timestamp',
        'tid',
        'oid',
        'price',
        'report',
        'invoice',
        'registName',
        'exCode',
        'exName',
        'charge',
        'invoiceDay',
        'sendName',
        'sendTel',
        'sendPost',
        'sendAddr1',
        'recvName',
        'recvTel',
        'recvPost',
        'recvAddr'
    ].forEach(function (key) {
        if (!formData[key]) {
            throw Error(key + ' is required.');
        }
    });

    var apiKey = Site.getCustomPreferenceValue('inicis_apiKey');
    var src = apiKey
        + formData.type
        + formData.timestamp
        + formData.clientIp
        + formData.mid
        + formData.oid
        + formData.tid
        + formData.price;
    formData.hashData = InicisUtils.getHash(src, MessageDigest.DIGEST_SHA_512, 'hex');

    var testMode = Site.getCustomPreferenceValue('inicis_testMode');
    var apiUrl = testMode ? Constants.apiUrlStg : Constants.apiUrl;
    var result = InicisService.JSON.call(apiUrl + 'escrow', formData);

    if (!result.ok) {
        Transaction.wrap(function () {
            order.addNote('Error.Inicis.Escrow.Delivery',
                result.error + '\n'
                + result.errorMessage);
        });
        return false;
    }

    var resData = result.object;
    if (resData.resultCode !== '00') {
        Transaction.wrap(function () {
            order.addNote('Error.Inicis.Escrow.Delivery',
                JSON.stringify(resData, null, 4));
        });
        return false;
    }

    Transaction.wrap(function () {
        // eslint-disable-next-line
        order.custom.inicis_escrowStatus = '2'; // set to delivered
    });
    return true;
}

/**
 * processing after user confirm the escrow payment
 * @param {dw.order.Order} order : order data
 */
function confirmedPurchase(order) {
    Transaction.wrap(function () {
        // eslint-disable-next-line
        order.custom.inicis_escrowStatus = '3';
        order.trackOrderChange('Inicis : Escrow confirmed');
    });
}

/**
 * processing after user reject the escrow payment
 * @param {dw.order.Order} order : order data
 */
function rejectedPurchase(order) {
    Transaction.wrap(function () {
        // eslint-disable-next-line
        order.custom.inicis_escrowStatus = '4';
        order.trackOrderChange('Inicis : Escrow rejected');
    });
}

module.exports = {
    registerDelivery: registerDelivery,
    confirmedPurchase: confirmedPurchase,
    rejectedPurchase: rejectedPurchase
};
