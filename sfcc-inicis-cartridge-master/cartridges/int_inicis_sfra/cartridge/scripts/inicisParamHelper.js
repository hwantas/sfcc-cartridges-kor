// if you want to set params by different way, customize this module.
'use strict';

var server = require('server');

var Bytes = require('dw/util/Bytes');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site').current;
var URLUtils = require('dw/web/URLUtils');

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

/**
 * define form data for PC authorize
 * @param {dw.order.Basket} basket - current Basket object
 * @param {dw.system.Request} req - current Requ object
 */
function paramHelperPC(basket, req) {
    var inicisForm = server.forms.getForm('inicis');
    var now = Date.now();

    // mandatory
    this.version = function () {
        return Constants.version;
    };

    this.gopaymethod = function () {
        return 'Card';
    };

    this.mid = function () {
        return Site.getCustomPreferenceValue('inicis_merchantID');
    };

    this.oid = function () {
        var orderNo = inicisForm.inicis_oid.value;
        if (!orderNo) {
            var OrderMgr = require('dw/order/OrderMgr');
            orderNo = OrderMgr.createOrderNo();
            inicisForm.clear();
            inicisForm.inicis_oid.value = orderNo;
        }
        if (new Bytes(orderNo).length > 40) { // max 40 bytes.
            var err2 = new Error(
                Resource.msgf('error.param.length', 'inicis', null,
                'oid', 40));
            err2.name = 'Error.Inicis.Param.Length.oid';
            throw err2;
        }
        return orderNo;
    };

    this.price = function () {
        if (Constants.currencies.indexOf(basket.totalGrossPrice.currencyCode) < 0) {
            var err = new Error(Resource.msg('error.invalid.currency', 'inicis', null));
            err.name = 'Error.Inicis.Param.Currency.price';
            throw err;
        }
        return basket.totalGrossPrice.value;
    };

    this.timestamp = function () {
        return now;
    };

    this.signature = function () {
        var sign = InicisUtils.getSignature({
            oid: this.oid(),
            price: this.price(),
            timestamp: now
        });
        return sign;
    };

    this.mKey = function () {
        return InicisUtils.getHahsedMKey();
    };

    this.currency = function () {
        return basket.totalGrossPrice.currencyCode === 'KRW' ? 'WON' : basket.totalGrossPrice.currencyCode;
    };

    this.goodname = function () {
        return basket.productLineItems[0].productName;
    };

    this.buyername = function () {
        var buyerName = basket.billingAddress.lastName + basket.billingAddress.firstName;
        if (!buyerName && basket.customer.profile) {
            buyerName = basket.customer.profile.lastName + basket.customer.profile.firstName;
        }
        if (!buyerName) {
            var err = new Error(Resource.msg('error.param.require.name', 'inicis', null));
            throw err;
        }
        return buyerName;
    };

    this.buyertel = function () {
        var buyerTel = basket.billingAddress.phone ||
            basket.customer.profile.phoneMobile ||
            basket.customer.profile.phoneHome ||
            basket.customer.profile.phoneBusiness;
        if (!buyerTel) {
            var err1 = new Error(Resource.msg('error.param.require.tel', 'inicis', null));
            throw err1;
        } else if (!(Constants.telRegExp.test(buyerTel))) {
            var err2 = new Error(Resource.msg('error.param.format.tel', 'inicis', null));
            throw err2;
        }
        return buyerTel;
    };

    this.buyeremail = function () {
        var email = basket.customerEmail ||
            basket.customer.profile.email;
        if (!email) {
            var err1 = new Error(Resource.msg('error.param.require.email', 'inicis', null));
            throw err1;
        }
        if (!(Constants.emailRegExp.test(email))) {
            var err2 = new Error(Resource.msg('error.param.format.email', 'inicis', null));
            throw err2;
        }
        return email;
    };

    this.returnUrl = function () {
        return URLUtils.url('Inicis-PCReturn').abs().toString();
    };

    this.closeUrl = function () {
        return URLUtils.url('Inicis-PCClose').abs().toString();
    };

    // optional

    this.quotabase = function () {
        var quataBases = Site.getCustomPreferenceValue('inicis_quotabase');
        return quataBases ? quataBases.join(':') : '';
    };

    this.nointerest = function () {
        var nointerest = Site.getCustomPreferenceValue('inicis_nointerest');
        return nointerest ? nointerest.join(',') : '';
    };

    this.tax = function () {
        var taxSetting = Site.getCustomPreferenceValue('inicis_tax');
        if (taxSetting) {
            return basket.totalTax.value;
        }
        return null;
    };

    this.taxfree = function () {
        var taxSetting = Site.getCustomPreferenceValue('inicis_taxfree');
        if (taxSetting) {
            var iter = basket.productLineItems.iterator();
            var taxFree = 0;
            while (iter.hasNext()) {
                var pli = iter.next();
                if (pli.adjustedNetPrice.value > 0 && pli.adjustedTax.value === 0) {
                    taxFree += pli.adjustedNetPrice.value;
                }
            }
            return taxFree;
        }
        return null;
    };

    this.payViewType = function () {
        return Site.getCustomPreferenceValue('inicis_payViewType').value;
    };

    this.languageView = function () {
        var curLocale = req.locale.toLowerCase().substr(0, 2);
        if (curLocale === 'zh') {
            return 'cn';
        }
        if (Constants.locales.indexOf(curLocale) > -1) {
            return curLocale;
        }
        return null;
    };

    this.popupUrl = function () {
        if (this.payViewType() === 'popup') {
            return URLUtils.url('Inicis-PCPopup').abs().toString();
        }
        return null;
    };

    this.ini_ssgpay_mdn = function () {
        return this.buyertel().replace(/\D/g, ''); // only number from buyertel
    };

    this.acceptmethod = function () {
        var options = [];
        var skin = Site.getCustomPreferenceValue('inicis_acceptmethod_SKIN');
        if (skin) {
            options.push('SKIN(' + skin + ')');
        }
        options.push('popreturn');

        if (Site.getCustomPreferenceValue('inicis_card_below1000')) {
            options.push('below1000');
        }
        if (Site.getCustomPreferenceValue('inicis_card_paypopup')) {
            options.push('paypopup');
        }
        if (Site.getCustomPreferenceValue('inicis_card_hidebar')) {
            options.push('hidebar');
        }
        var onlyCardCodes = Site.getCustomPreferenceValue('inicis_onlycardcode');
        if (onlyCardCodes && onlyCardCodes.length > 0) {
            options.push('ini_onlycardcode(' + onlyCardCodes.map(function (obj) {
                return obj.value;
            }).join(':') + ')');
        }
        if (Site.getCustomPreferenceValue('inicis_card_cardpoint')) {
            options.push('cardpoint');
        }
        if (Site.getCustomPreferenceValue('inicis_card_ocb')) {
            options.push('ocb');
        }
        var slimquota = Site.getCustomPreferenceValue('inicis_card_slimquota');
        if (slimquota && slimquota.length > 0) {
            options.push('slimquota(' + slimquota.join(',') + ')');
        }
        var mallpoint = Site.getCustomPreferenceValue('inicis_card_mallpoint');
        if (mallpoint && mallpoint.length > 0) {
            options.push('mallpoint(' + mallpoint.map(function (obj) {
                return obj.value;
            }).join(':') + ')');
        }
        if (Site.getCustomPreferenceValue('inicis_escrow')) {
            options.push('useescrow');
            inicisForm.inicis_useEscrow.value = true;
        }
        return options.join(':');
    };
}

/**
 * define form data for SP authorize
 * @param {dw.order.Basket} basket - current Basket object
 * @param {dw.system.Request} req - current Requ object
 */
// eslint-disable-next-line
function paramHelperSP(basket, req) {
    var inicisForm = server.forms.getForm('inicis');
    var hashKey = Site.getCustomPreferenceValue('inicis_mobileHashKey');
    var now = Date.now();

    // mandatory

    this.P_INI_PAYMENT = function () {
        return 'CARD';
    };

    this.P_MID = function () {
        return Site.getCustomPreferenceValue('inicis_merchantID');
    };

    this.P_OID = function () {
        var orderNo = inicisForm.inicis_oid.value;
        if (!orderNo) {
            var OrderMgr = require('dw/order/OrderMgr');
            orderNo = OrderMgr.createOrderNo();
            inicisForm.clear();
            inicisForm.inicis_oid.value = orderNo;
        }
        if (new Bytes(orderNo).length > 40) { // max 40 bytes.
            var err2 = new Error(
                Resource.msgf('error.param.length', 'inicis', null,
                'oid', 40));
            err2.name = 'Error.Inicis.Param.Length.oid';
            throw err2;
        }
        return orderNo;
    };

    this.P_AMT = function () {
        if (Constants.currencies.indexOf(basket.totalGrossPrice.currencyCode) < 0) {
            var err = new Error(Resource.msg('error.invalid.currency', 'inicis', null));
            err.name = 'Error.Inicis.Param.Currency.price';
            throw err;
        }
        return basket.totalGrossPrice.value;
    };

    this.P_GOODS = function () {
        return basket.productLineItems[0].productName;
    };

    this.P_UNAME = function () {
        var uname = basket.billingAddress.lastName + basket.billingAddress.firstName;
        if (!uname && basket.customer.profile) {
            uname = basket.customer.profile.lastName + basket.customer.profile.firstName;
        }
        if (!uname) {
            var err = new Error(Resource.msg('error.param.require.name', 'inicis', null));
            throw err;
        }
        return uname;
    };

    this.P_NEXT_URL = function () {
        return URLUtils.url('Inicis-SPNext').abs().toString();
    };

    // optional

    this.P_MOBILE = function () {
        var mobile = basket.billingAddress.phone ||
            basket.customer.profile.phoneMobile ||
            basket.customer.profile.phoneHome ||
            basket.customer.profile.phoneBusiness;
        if (!mobile) {
            var err1 = new Error(Resource.msg('error.param.require.tel', 'inicis', null));
            throw err1;
        } else if (!(Constants.telRegExp.test(mobile))) {
            var err2 = new Error(Resource.msg('error.param.format.tel', 'inicis', null));
            throw err2;
        }
        return mobile;
    };

    this.P_EMAIL = function () {
        var email = basket.customerEmail ||
            basket.customer.profile.email;
        if (!email) {
            var err1 = new Error(Resource.msg('error.param.require.email', 'inicis', null));
            throw err1;
        }
        if (!(Constants.emailRegExp.test(email))) {
            var err2 = new Error(Resource.msg('error.param.format.email', 'inicis', null));
            throw err2;
        }
        return email;
    };

    this.P_MNAME = function () {
        return Site.getCustomPreferenceValue('inicis_MNAME');
    };

    this.P_CHARSET = function () {
        return 'utf8';
    };

    this.P_QUOTABASE = function () {
        var quataBases = Site.getCustomPreferenceValue('inicis_quotabase');
        return quataBases ? quataBases.join(':') : '';
    };

    this.P_TAX = function () {
        var taxSetting = Site.getCustomPreferenceValue('inicis_tax');
        if (taxSetting) {
            return basket.totalTax.value;
        }
        return null;
    };

    this.P_TAXFREE = function () {
        var taxSetting = Site.getCustomPreferenceValue('inicis_taxfree');
        if (taxSetting) {
            var iter = basket.productLineItems.iterator();
            var taxFree = 0;
            while (iter.hasNext()) {
                var pli = iter.next();
                if (pli.adjustedNetPrice.value > 0 && pli.adjustedTax.value === 0) {
                    taxFree += pli.adjustedNetPrice.value;
                }
            }
            return taxFree;
        }
        return null;
    };

    this.P_CARD_OPTION = function () {
        return Site.getCustomPreferenceValue('inicis_P_CARD_OPTION').value;
    };

    this.P_ONLY_CARDCODE = function () {
        var onlyCardCodes = Site.getCustomPreferenceValue('inicis_onlycardcode');
        if (onlyCardCodes && onlyCardCodes.length > 0) {
            return onlyCardCodes.map(function (obj) {
                return obj.value;
            }).join(':');
        }
        return null;
    };

    this.P_RESERVED = function () {
        var options = [];
        if (Site.getCustomPreferenceValue('inicis_card_below1000')) {
            options.push('below1000=Y');
        }
        var nointerest = Site.getCustomPreferenceValue('inicis_nointerest');
        if (nointerest && nointerest.length > 0) {
            options.push('merc_noint=Y');
            options.push('noint_quota=' + nointerest.join('^'));
        }

        if (Site.getCustomPreferenceValue('inicis_card_cardpoint')) {
            options.push('cp_yn=Y');
        }

        if (hashKey) {
            options.push('amt_hash=Y');
        }

        if (Site.getCustomPreferenceValue('inicis_escrow')) {
            options.push('useescrow=Y');
            inicisForm.inicis_useEscrow.value = true;
        }

        if (Site.getCustomPreferenceValue('inicis_globalVisa3d')) {
            options.push('global_visa3d=Y');
        }

        return options.join('&');
    };

    this.P_TIMESTAMP = function () {
        if (hashKey) {
            return now;
        }
        return null;
    };

    this.P_CHKFAKE = function () {
        if (hashKey) {
            // eslint-disable-next-line
            return InicisUtils.getChkFakeHash(this.P_AMT(), this.P_OID(), now, hashKey);
        }
        return null;
    };
}

module.exports = {
    pc: paramHelperPC,
    sp: paramHelperSP
};
