'use strict';

var server = require('server');

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisService = require('*/cartridge/scripts/inicisService');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');
var collections = require('*/cartridge/scripts/util/collections');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/**
 * make error message from Result object
 * @param {dw.svc.Result} result : result from Inicis authorize request
 * @returns {string} : error message
 */
function errorMsgFromServiceResult(result) {
    // make error message from Service Result
    var StrUtils = require('dw/util/StringUtils');
    var errorMessage = '';
    if (result.status === 'SERVICE_UNAVAILABLE') {
        errorMessage = StrUtils.format(
            'SERVICE_UNAVAILABLE\nReason: {0}',
            result.unavailableReason);
    } else {
        errorMessage = StrUtils.format('{0}'
            + 'Code:\t{1}\n'
            + 'Error:\t{2}\n'
            + 'Message:\t{3}\n'
            + 'Body:\t{4}',
            result.status,
            result.error,
            result.errorMessage,
            result.msg,
            result.object && JSON.stringify(result.object, null, 4));
    }

    return errorMessage;
}

/**
 * leave note to order for error log
 * @param {string} orderNumber : order number
 * @param {string} title : title for note
 * @param {string} message : message for note
 */
function errorNote(orderNumber, title, message) {
    // leave error message
    var order = OrderMgr.getOrder(orderNumber);
    if (!order) {
        InicisUtils.Logger.error(
            'Can not find order {0}\nError : {1}\n{2}',
            orderNumber, title, message);
        return;
    }
    Transaction.wrap(function () {
        order.addNote(title, message);
    });
}

/**
 * Verifies that payment information, if it is valid Inicis payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) { // eslint-disable-line
    var serverErrors = [];
    var error = false;

    if (Constants.currencies.indexOf(basket.totalGrossPrice.currencyCode) < 0) { // KRW, USD only
        serverErrors.push(Resource.msg('error.invalid.currency', 'inicis', null));
        error = true;
    }

    Transaction.wrap(function () {
        var paymentInstruments = basket.getPaymentInstruments('INICIS');

        collections.forEach(paymentInstruments, function (item) {
            basket.removePaymentInstrument(item);
        });

        basket.createPaymentInstrument(
            'INICIS', basket.totalGrossPrice
        );
    });

    return { fieldErrors: [], serverErrors: serverErrors, error: error };
}

/**
 * Authorizes a payment using Inicis.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var inicisForm = server.forms.getForm('inicis');
    var isMobile = inicisForm.inicis_isMobile.value;

    var data;
    try {
        // check orderNumber same with in form
        if (inicisForm.inicis_oid.value !== orderNumber) {
            var err4 = Error("'oid' is not matched.");
            err4.name = 'Error.Inicis.Authorize.Different.oid';
            throw err4;
        }

        var Site = require('dw/system/Site').current;
        var result;
        if (isMobile) { // use API for mobile
            if (inicisForm.inicis_P_AMT.value !== paymentInstrument.paymentTransaction.amount.value) {
                var err5 = Error('amount is not matched.');
                err5.name = 'Error.Inicis.Authorize.Different.amount';
                throw err5;
            }
            var reqUrl = inicisForm.inicis_P_REQ_URL.value;
            result = InicisService.NVP.call(reqUrl, {
                P_MID: Site.getCustomPreferenceValue('inicis_merchantID'),
                P_TID: inicisForm.inicis_P_TID.value
            });
        } else { // use API for PC
            // get encrypted Inicis order data from Inicis form.
            var authToken = inicisForm.inicis_authToken.value;
            var authUrl = inicisForm.inicis_authUrl.value;
            var now = Date.now();
            var sign = InicisUtils.getSignature({
                authToken: authToken,
                timestamp: now
            });

            if (!authToken) {
                var err1 = Error("'authToken' does not exist.");
                err1.name = 'Error.Inicis.Authorize.No.authToken';
                throw err1;
            }

            // request approval
            result = InicisService.JSON.call(authUrl, {
                mid: Site.getCustomPreferenceValue('inicis_merchantID'),
                authToken: authToken,
                timestamp: now,
                signature: sign,
                format: 'JSON',
                price: paymentInstrument.paymentTransaction.amount.value
            });
        }

        // approval failed
        if (!result.ok) {
            var err2 = new Error(errorMsgFromServiceResult(result));
            err2.name = 'Error.Inicis.Authorize.' + result.status;
            throw err2;
        }

        // check result data
        data = result.object;
        if ((isMobile && data.P_STATUS !== '00')
        || (!isMobile && data.resultCode !== '0000')) {
            var err3 = new Error(errorMsgFromServiceResult(result));
            err3.name = 'Error.Inicis.Authorize.' + data.reply_cd;
            throw err3;
        }

        var order = OrderMgr.getOrder(orderNumber);
        Transaction.wrap(function () {
            if (inicisForm.inicis_useEscrow.value) {
                order.custom.inicis_escrowTid = data.tid || data.P_TID;
                order.custom.inicis_escrowStatus = '1';
            }
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            paymentInstrument.paymentTransaction.setTransactionID(data.tid || data.P_TID);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            // save inicis payment info.
            Object.keys(data).forEach(function (key) {
                var attrKey = Constants.attrPrefix + key;
                if (data[key] &&
                    paymentInstrument.paymentTransaction.describe().getCustomAttributeDefinition(attrKey)
                ) {
                    paymentInstrument.paymentTransaction.custom[attrKey] = data[key]; // eslint-disable-line
                }
            });
        });
    } catch (e) {
        errorNote(orderNumber, e.name || 'Error.Inicis.Authorize.Etc', e.message);
        error = true;

        serverErrors.push(
            e.message
        );

        if (isMobile) {
            var origReqUrl = inicisForm.inicis_P_REQ_URL.value;
            if (data && data.P_STATUS === '00' && origReqUrl) {
                var reqHost = origReqUrl.substr(0, origReqUrl.indexOf('/', 8));
                var spCancelUrl = reqHost + Constants.spNetCancelUrlPostfix;
                var spTid = inicisForm.inicis_P_TID.value;
                netCancelSP(spCancelUrl, spTid, orderNumber,
                    paymentInstrument.paymentTransaction.amount.value);
            }
        } else {
            var netCancelUrl = inicisForm.inicis_netCancelUrl.value;
            if (data && data.resultCode === '0000' && netCancelUrl) {
                var cancelAuthToken = inicisForm.inicis_authToken.value;
                var cancelPrice = paymentInstrument.paymentTransaction.amount.value;
                netCancelPC(netCancelUrl, cancelAuthToken, cancelPrice);
            }
        }
    }

    // clear form data for Inicis
    inicisForm.clear();

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * cancel authorized payment, if only some error is occured.
 * @param {string} cancelUrl : url for net cancel request
 * @param {*} authToken : Inicis authtoken data
 * @param {*} price : authorized amount
 */
function netCancelPC(cancelUrl, authToken, price) {
    var now = Date.now();
    var sign = InicisUtils.getSignature({
        authToken: authToken,
        timestamp: now
    });

    var Site = require('dw/system/Site').current;
    var result = InicisService.JSON.call(cancelUrl, {
        mid: Site.getCustomPreferenceValue('inicis_merchantID'),
        authToken: authToken,
        timestamp: now,
        signature: sign,
        format: 'JSON',
        price: price
    });

    if (!result.ok) {
        InicisUtils.Logger.error('Inicis Net Cancel Failed.\n{0}',
            errorMsgFromServiceResult(result));
    }
}

/**
 * cancel authorized payment, if only some error is occured.
 * @param {string} cancelUrl : url for net cancel request
 * @param {string} tid : transaction id
 * @param {string} oid : order id
 * @param {number} amt : authorized amount
 */
function netCancelSP(cancelUrl, tid, oid, amt) {
    var Site = require('dw/system/Site').current;
    var reqData = {
        P_TID: tid,
        P_MID: Site.getCustomPreferenceValue('inicis_merchantID'),
        P_AMT: amt,
        P_OID: oid
    };
    var hashKey = Site.getCustomPreferenceValue('inicis_mobileHashKey');
    if (hashKey) { // if there is hash key, set tamper-proof HASH value
        var now = Date.now();
        var hashed = InicisUtils.getChkFakeHash(amt, oid, now, hashKey);
        reqData.P_CHKFAKE = hashed;
        reqData.P_TIMESTAMP = now;
    }
    var result = InicisService.NVP.call(cancelUrl, reqData);

    if (!result.ok) {
        InicisUtils.Logger.error('Inicis Net Cancel Failed.\n{0}',
            errorMsgFromServiceResult(result));
    }
}

exports.Handle = Handle;
exports.Authorize = Authorize;
