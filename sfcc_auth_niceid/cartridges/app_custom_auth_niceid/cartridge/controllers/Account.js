'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');

server.extend(module.superModule);

server.append('SubmitRegistration', function (req, res, next) {
    Logger.warn('Account-SubmitRegistration');

    var viewData = res.getViewData();
    Logger.warn(JSON.stringify(viewData));

    if (!viewData.email) {
        next();
    } else {
        var ci = req.form.registrationCi;
        Logger.warn('ci = ' + ci);
        var email = viewData.email;
        Logger.warn('email = ' + email);

        // ---------
        // if (ci != null) ...
        var Transaction = require('dw/system/Transaction');
        Transaction.begin();

        try {
            var CustomerCi = CustomObjectMgr.createCustomObject('CustomerCi', ci);
            CustomerCi.custom.email = email;
            Transaction.commit();
        } catch (e) {
            Logger.error(e);
            Transaction.rollback();
        }
        // }

        next();
    }
});

server.get('GetCustomerCi', function (req, res, next) {
    var ci = req.querystring.ci;
    Logger.warn('ci ' + ci);

    /*
    var CustomerCiList = CustomObjectMgr.getAllCustomObjects('CustomerCi');
    Logger.warn('CustomerCiList');
    Logger.warn(CustomerCiList.asList());
    res.json({
        CustomerCiList: CustomerCiList.asList()
    });
    */

    var CustomerCi = CustomObjectMgr.getCustomObject('CustomerCi', ci);
    if (CustomerCi) {
        Logger.warn('CustomerCi');
        Logger.warn(CustomerCi);
        Logger.warn(CustomerCi.custom.email);
        res.json({
            email: CustomerCi.custom.email
        });
    } else {
        res.json({
            email: ''
        });
    }

    return next();
});

module.exports = server.exports();
