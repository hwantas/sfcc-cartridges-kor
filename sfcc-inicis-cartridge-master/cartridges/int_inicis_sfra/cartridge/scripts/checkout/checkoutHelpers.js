'use strict';

var server = require('server');
var COHelpers = module.superModule;
var baseCreateOrder = COHelpers.createOrder;

/**
 * Attempts to create an order from the current basket.
 * If it use Inicis payment, use precreated order number.
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket) {
    var InicisUtils = require('*/cartridge/scripts/inicisUtils');
    if (InicisUtils.isInicis(currentBasket)) {
        // If there is orderNo created by Inicis module in session, create order by created orderNo.
        var inicisForm = server.forms.getForm('inicis');
        var orderNo = inicisForm.inicis_oid.value;
        if (!orderNo) {
            InicisUtils.Logger.error('\'inicis_oid\' does not exist in form.');
            return null;
        }

        var order;
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            var Transaction = require('dw/system/Transaction');
            order = Transaction.wrap(function () {
                return OrderMgr.createOrder(currentBasket, orderNo);
            });
        } catch (error) {
            InicisUtils.Logger.error('Failed to create order.');
            return null;
        }
        return order;
    }
    return baseCreateOrder(currentBasket);
}
COHelpers.createOrder = createOrder;

module.exports = COHelpers;
