'use strict';

var Site = require('dw/system/Site').current;
var URLUtils = require('dw/web/URLUtils');

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

/**
 * make request data for Inicis escrow confirm
 * @param {dw.order.Order} order : order data
 */
function paramHelperPC(order) {
    this.version = function () {
        return Constants.version;
    };

    this.mid = Site.getCustomPreferenceValue.bind(Site, 'inicis_merchantID');

    this.tid = function () {
        var pis = order.getPaymentInstruments('INICIS');
        if (!pis || pis.length === 0) {
            return null;
        }

        return pis[0].paymentTransaction.transactionID;
    };

    this.currency = function () {
        return order.currencyCode === 'KRW' ? 'WON' : order.currencyCode;
    };

    this.timestamp = function () {
        return Date.now().toFixed();
    };

    this.mKey = InicisUtils.getHahsedMKey;

    this.returnUrl = function () {
        return URLUtils.url('Inicis-PCEscrowReturn',
            'orderNo', order.orderNo,
            'orderToken', order.orderToken)
            .abs()
            .toString();
    };

    this.closeUrl = function () {
        return URLUtils.url('Inicis-PCEscrowClose')
            .abs()
            .toString();
    };

    this.popupUrl = function () {
        return URLUtils.url('Inicis-PCEscrowPopup')
            .abs()
            .toString();
    };

    this.payViewType = function () {
        return Site.getCustomPreferenceValue('inicis_payViewType').value;
    };

    this.charset = function () {
        return 'UTF-8';
    };

    this.acceptmethod = function () {
        return '';
    };
}

/**
 * make request data for Inicis escrow confirm
 * @param {dw.order.Order} order : order data
 */
function paramHelperSP(order) {
    this.P_INI_PAYMENT = function () {
        return 'ESCROWCONFIRM';
    };

    this.P_MID = Site.getCustomPreferenceValue.bind(Site, 'inicis_merchantID');

    this.P_ESCROW_TID = function () {
        var pis = order.getPaymentInstruments('INICIS');
        if (!pis || pis.length === 0) {
            return null;
        }

        return pis[0].paymentTransaction.transactionID;
    };

    this.P_NEXT_URL = function () {
        return URLUtils.url('Inicis-SPEscrowNext')
            .abs()
            .toString();
    };

    this.P_NEXT_URL_TARGET = function () {
        return 'post';
    };

    this.P_GOODS = function () {
        return order.productLineItems[0].productName;
    };

    this.P_RESERVED = function () {
        return '';
    };
}

module.exports = {
    pc: paramHelperPC,
    sp: paramHelperSP
};
