'use strict';

/**
 * @namespace Inicis
 */

var server = require('server');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

server.post(
    'PCReturn',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        if (req.form.resultCode === '0000') { // OK
            var inicisForm = server.forms.getForm('inicis');

            inicisForm.inicis_isMobile.value = false;
            inicisForm.inicis_authToken.value = req.form.authToken;
            inicisForm.inicis_authUrl.value = req.form.authUrl;
            inicisForm.inicis_netCancelUrl.value = req.form.netCancelUrl;

            res.render('inicis/inicisScriptLoad', {
                url: URLUtils.staticURL('/js/inicisReturn.js'),
                message: req.form.resultMsg
            });
        } else {
            InicisUtils.Logger.error('[Authorize Failed]\n{0}', JSON.stringify(req.form, null, 4));
            res.render('inicis/inicisScriptLoad', {
                url: URLUtils.staticURL('/js/inicisClose.js'),
                message: req.form.resultMsg
            });
        }
        next();
    }
);

server.get(
    'PCClose',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        res.render('inicis/inicisScriptLoad', {
            url: URLUtils.staticURL('/js/inicisClose.js')
        });
        next();
    }
);

server.get(
    'PCPopup',
    server.middleware.https,
    function (req, res, next) {
        res.render('inicis/inicisPopup');
        next();
    }
);

server.post(
    'SPNext',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');
        if (req.form.P_STATUS === '00') { // OK
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            var amount = parseFloat(req.form.P_AMT);
            if (currentBasket
                && amount === currentBasket.getTotalGrossPrice().value) {
                var inicisForm = server.forms.getForm('inicis');

                inicisForm.inicis_isMobile.value = true;
                inicisForm.inicis_P_TID.value = req.form.P_TID;
                inicisForm.inicis_P_REQ_URL.value = req.form.P_REQ_URL;
                inicisForm.inicis_P_AMT.value = amount;

                res.render('inicis/inicisScriptLoad', {
                    url: URLUtils.staticURL('/js/inicisReturn.js'),
                    message: req.form.resultMsg
                });
            } else { // payment amount is not matched.
                InicisUtils.Logger.error('[Authorize Failed]\n{0}', JSON.stringify(req.form, null, 4));
                res.render('inicis/inicisScriptLoad', {
                    url: URLUtils.staticURL('/js/inicisClose.js'),
                    message: Resource.msg('error.invalid.amount', 'inicis', null)
                });
            }
        } else {
            InicisUtils.Logger.error('[Authorize Failed]\n{0}', JSON.stringify(req.form, null, 4));
            res.render('inicis/inicisScriptLoad', {
                url: URLUtils.staticURL('/js/inicisClose.js'),
                message: req.form.P_RMESG1
            });
        }
        next();
    }
);

server.post(
    'EscrowConfirm',
    server.middleware.https,
    function (req, res, next) {
        var Resource = require('dw/web/Resource');
        var orderNo = req.form.orderNo;
        var orderToken = req.form.orderToken;
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

        var OrderMgr = require('dw/order/OrderMgr');
        var order;
        if (orderToken) {
            order = OrderMgr.getOrder(orderNo, orderToken);
        } else {
            order = OrderMgr.getOrder(orderNo);
        }
        if (!order || !InicisUtils.isInicis(order)) {
            res.json({
                error: true,
                message: Resource.msg('error.no.orderno', 'inicis', null)
            });
            return next();
        }

        var InicisEscrow = require('*/cartridge/models/inicisEscrow');
        res.json(new InicisEscrow(order));

        return next();
    }
);

server.post(
    'PCEscrowReturn',
    server.middleware.https,
    function (req, res, next) {
        var orderNo = req.querystring.orderNo;
        var orderToken = req.querystring.orderToken;
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var Escrow = require('*/cartridge/scripts/inicisEscrow');
        var order = OrderMgr.getOrder(orderNo, orderToken);
        var message = '';
        if (!order || !InicisUtils.isInicis(order)) {
            res.print('');
            res.setStatusCode(404);
            return next();
        } else if (req.form.ResultCode === '00') { // OK
            var cnf = req.form.CNF_Date + req.form.CNF_Time;
            var dny = req.form.DNY_Date + req.form.DNY_Time;
            if (cnf) {
                Escrow.confirmedPurchase(order);
            } else if (dny) {
                Escrow.rejectedPurchase(order);
            }
        } else {
            Transaction.wrap(function () {
                order.addNote('Inicis.Escrow.Error', JSON.stringify(req.form, null, 4));
            });
            message = req.form.ResultMsg;
        }
        res.render('inicis/inicisScriptLoad', {
            url: URLUtils.staticURL('/js/inicisEscrowClose.js'),
            message: message
        });
        return next();
    }
);

server.get(
    'PCEscrowPopup',
    server.middleware.https,
    function (req, res, next) {
        var Site = require('dw/system/Site').current;
        var Constants = require('*/cartridge/scripts/inicisConstants');
        var testMode = Site.getCustomPreferenceValue('inicis_testMode');
        res.render('inicis/inicisScriptLoad', {
            url: testMode ? Constants.pcPopupScriptStg : Constants.pcPopupScript
        });
        next();
    }
);

server.get(
    'PCEscrowClose',
    server.middleware.https,
    function (req, res, next) {
        var Site = require('dw/system/Site').current;
        var Constants = require('*/cartridge/scripts/inicisConstants');
        var testMode = Site.getCustomPreferenceValue('inicis_testMode');
        res.render('inicis/inicisScriptLoad', {
            url: testMode ? Constants.pcCloseScriptStg : Constants.pcCloseScript
        });
        next();
    }
);

server.use(
    'SPEscrowNext',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        if (req.querystring.P_CANCEL === 'Y') {
            res.render('inicis/inicisScriptLoad', {
                url: URLUtils.staticURL('/js/inicisEscrowClose.js')
            });
            return next();
        }
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var Escrow = require('*/cartridge/scripts/inicisEscrow');
        var tid = req.form.P_ESCROW_TID;
        var clStatus = req.form.P_CL_STATUS;
        var status = req.form.P_STATUS;
        var message = '';

        var order = OrderMgr.searchOrder('custom.inicis_escrowTid={0}', tid);
        if (status === '00') {
            if (clStatus === 'buyComplete') {
                Escrow.confirmedPurchase(order);
            } else if (clStatus === 'denyComplete') {
                Escrow.rejectedPurchase(order);
            }
        } else {
            Transaction.wrap(function () {
                order.addNote('Inicis.Escrow.Error', JSON.stringify(req.form, null, 4));
            });
            message = req.form.P_RMESG1;
        }
        res.render('inicis/inicisScriptLoad', {
            url: URLUtils.staticURL('/js/inicisEscrowClose.js'),
            message: message
        });
        return next();
    }
);

module.exports = server.exports();
