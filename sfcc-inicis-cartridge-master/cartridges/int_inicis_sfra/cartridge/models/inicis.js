'use strict';

var Site = require('dw/system/Site').current;
var Constants = require('*/cartridge/scripts/inicisConstants');

/**
 * model for requesting Inicis payment
 * @param {dw.order.Basket} currentBasket : current basket object
 */
function Inicis(currentBasket) {
    this.mobile = Constants.mobileRegExp.test(request.httpUserAgent); // eslint-disable-line

    var formData = {};
    var paramHelper = require('*/cartridge/scripts/inicisParamHelper');
    paramHelper = this.mobile ? new paramHelper.sp(currentBasket, request) : new paramHelper.pc(currentBasket, request); // eslint-disable-line
    Object.keys(paramHelper).forEach(function (key) {
        var value = paramHelper[key]();
        if (value) {
            formData[key] = value;
        }
    });
    this.params = formData;

    if (Site.getCustomPreferenceValue('inicis_testMode')) {
        this.url = this.mobile ? Constants.spAuthURLStg : Constants.pcAuthScriptStg;
    } else {
        this.url = this.mobile ? Constants.spAuthURL : Constants.pcAuthScript;
    }
}

module.exports = Inicis;
