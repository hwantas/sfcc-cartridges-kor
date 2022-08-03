'use strict';

var InicisUtils = require('*/cartridge/scripts/inicisUtils');
var Site = require('dw/system/Site').current;
var Constants = require('*/cartridge/scripts/inicisConstants');

/**
 * model for Inicis Escrow confirm request data
 * @param {dw.order.Order} order : order data
 */
function InicisEscrow(order) {
    if (!order || !InicisUtils.isInicis(order)) {
        return;
    }

    this.mobile = Constants.mobileRegExp.test(request.httpUserAgent); // eslint-disable-line

    var formData = {};
    var paramHelper = require('*/cartridge/scripts/inicisEscrowParamHelper');
    paramHelper = this.mobile ? new paramHelper.sp(order) : new paramHelper.pc(order); // eslint-disable-line
    Object.keys(paramHelper).forEach(function (key) {
        var value = paramHelper[key]();
        if (value) {
            formData[key] = value;
        }
    });
    this.params = formData;

    if (Site.getCustomPreferenceValue('inicis_testMode')) {
        this.url = this.mobile ? Constants.spAuthURLStg : Constants.pcEscrowScriptStg;
    } else {
        this.url = this.mobile ? Constants.spAuthURL : Constants.pcEscrowScript;
    }
}

module.exports = InicisEscrow;
