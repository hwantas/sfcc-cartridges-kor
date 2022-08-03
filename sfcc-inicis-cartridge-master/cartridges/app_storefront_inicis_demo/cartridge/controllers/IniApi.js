'use strict';

var server = require('server');

server.get(
    'Cancel',
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Resource = require('dw/web/Resource');
        var InicisCancel = require('*/cartridge/scripts/inicisCancel');
        var orderNo = req.querystring.orderNo;
        var orderToken = req.querystring.orderToken;
        if (!orderNo) {
            res.json({
                error: true,
                message: Resource.msg('error.no.orderno', 'inicis', null)
            });
            return next();
        } else if (!req.currentCustomer.profile && !orderToken) {
            // only user logged in or with orderToken. other case to 403 forbidden
            res.json({
                error: true,
                message: Resource.msg('error.not.allowed', 'inicis', null)
            });
            return next();
        }

        var order;
        if (orderToken) {
            order = OrderMgr.getOrder(orderNo, orderToken);
        } else {
            order = OrderMgr.getOrder(orderNo);
        }
        var result = InicisCancel.cancelOrder(order);
        res.print(result ? 'OK' : 'FAILED');
        return next();
    }
);

server.get(
    'DeliveryTest',
    server.middleware.https,
    function (req, res, next) {
        res.render('inicis/deliveryTest');
        next();
    }
);

server.post(
    'SubmitDeliveryTest',
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Resource = require('dw/web/Resource');
        var InicisEscrow = require('*/cartridge/scripts/inicisEscrow');
        var data = Object.assign({}, req.form);
        var orderNo = data.orderNo;
        var order = OrderMgr.getOrder(orderNo);
        if (!order) {
            res.print('Can not find order');
            return next();
        }
        delete data.orderNo;
        data.exName = Resource.msg('excode.' + data.exCode, 'inicis', null);
        var result = InicisEscrow.registerDelivery(order, data);
        res.print(result ? 'OK' : 'FAILED');
        next();
    }
);

module.exports = server.exports();
