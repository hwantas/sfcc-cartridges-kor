'use strict';

/**
 * @namespace CheckoutServices
 */

var server = require('server');
server.extend(module.superModule);

server.append(
    'SubmitPayment',
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line
            var data = res.getViewData();
            if (data.error) {
                return;
            }

            var InicisModel = require('*/cartridge/models/inicis');
            var InicisUtils = require('*/cartridge/scripts/inicisUtils');

            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            if (InicisUtils.isInicis(currentBasket)) {
                try {
                    data.order.inicis = new InicisModel(currentBasket);
                } catch (err) {
                    data.error = true;
                    if (!data.fieldErrors) {
                        data.fieldErrors = []; // fieldErrors and serverErrors is pair.
                    }
                    if (!data.serverErrors) {
                        data.serverErrors = [];
                    }
                    data.serverErrors.push(err.message);
                }
            }
        });
        return next();
    }
);

module.exports = server.exports();
