'use strict';

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisService = require('*/cartridge/scripts/inicisService');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

var MessageDigest = require('dw/crypto/MessageDigest');
var Calendar = require('dw/util/Calendar');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site').current;
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');

/**
 * cancle the Inicis payment
 * @param {dw.order.Order} order : order data
 * @param {Object} data : custom request data. refer to Inicis document.
 * @returns {boolean} : true for success
 */
function cancelOrder(order, data) {
    if (!InicisUtils.isInicis(order)) {
        return false;
    }
    var now = new Calendar();
    var pis = order.getPaymentInstruments('INICIS');

    var formData = Object.assign({}, data);
    formData.type = formData.type || 'Refund';
    formData.mid = formData.mid || Site.getCustomPreferenceValue('inicis_merchantID');
    formData.clientIp = formData.clientIp || Site.getCustomPreferenceValue('inicis_clientIp');
    formData.timestamp = formData.timestamp || StringUtils.formatCalendar(now, 'YYYYMMddHHmmss');
    formData.tid = formData.tid || pis[0].paymentTransaction.transactionID;
    formData.paymethod = formData.paymethod || 'Card';
    formData.msg = formData.msg || '-';
    var apiKey = Site.getCustomPreferenceValue('inicis_apiKey');
    var src = apiKey
        + formData.type
        + formData.paymethod
        + formData.timestamp
        + formData.clientIp
        + formData.mid
        + formData.tid;
    formData.hashData = InicisUtils.getHash(src, MessageDigest.DIGEST_SHA_512, 'hex');

    var testMode = Site.getCustomPreferenceValue('inicis_testMode');
    var apiUrl = testMode ? Constants.apiUrlStg : Constants.apiUrl;
    var result = InicisService.JSON.call(apiUrl + 'refund', formData);

    if (!result.ok) {
        Transaction.wrap(function () {
            order.addNote('Error.Inicis.Cancel',
                result.error + '\n'
                + result.errorMessage);
        });
        return false;
    }

    var resData = result.object;
    if (resData.resultCode !== '00') {
        Transaction.wrap(function () {
            order.addNote('Error.Inicis.Cancel',
                JSON.stringify(resData, null, 4));
        });
        return false;
    }

    return Transaction.wrap(function () {
        var cancelRes = OrderMgr.cancelOrder(order);
        if (cancelRes.error) {
            order.addNote('Error.Cancel',
                'Code: ' + cancelRes.code + '\n'
                + 'Message: ' + cancelRes.message + '\n'
                + 'Details: ' + JSON.stringify(cancelRes.details, null, 4) + '\n'
                + 'Parameters: ' + JSON.stringify(cancelRes.parameters, null, 4));
            return false;
        }
        if (order.custom.inicis_escrowStatus.value > 0) {
            // eslint-disable-next-line
            order.custom.inicis_escrowStatus = '8'; // transaction cancellation(거래취소)
        }
        return true;
    });
}

module.exports = {
    cancelOrder: cancelOrder
};
