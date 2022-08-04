'use strict';

var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');

server.get('Registration', function (req, res, next) {
    Logger.debug('CustomObjectPage-Registration');
    Logger.info('CustomObjectPage-Registration');
    Logger.warn('CustomObjectPage-Registration');
    Logger.error('CustomObjectPage-Registration');
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    try {
        var customObjectSampleId = 'NO00000002';
        var NewCustomObjectSample = CustomObjectMgr.createCustomObject('CustomObjectSample', customObjectSampleId);
        NewCustomObjectSample.custom.customerNo = '00000022';
        NewCustomObjectSample.custom.customerName = 'HogeHoge';
        Transaction.commit();
    } catch (e) {
        Logger.error(e);
        Transaction.rollback();
    }
    res.render('customObjectPage');
    return next();
});

server.get('List', function (req, res, next) {
    var CustomObjectSamples = CustomObjectMgr.getAllCustomObjects('CustomObjectSample');
    res.render('customObjectPage', {
        CustomObjectSamples: CustomObjectSamples
    });
    return next();
});

server.get('Update', function (req, res, next) {
    var customObjectSampleId = 'NO00000001';
    var EditCustomObejectSample = CustomObjectMgr.getCustomObject('CustomObjectSample', customObjectSampleId);
    if (EditCustomObejectSample) {
        var Transaction = require('dw/system/Transaction');
        Transaction.begin();
        try {
            EditCustomObejectSample.custom.customerNo = '00000002';
            EditCustomObejectSample.custom.customerName = 'FugaFuga';
            Transaction.commit();
        } catch (e) {
            Logger.error(e);
            Transaction.rollback();
        }
    }
    res.render('customObjectPage');
    return next();
});

server.get('Delete', function (req, res, next) {
    var customObjectSampleId = '00000001';
    var DeleteCustomObjectSample = CustomObjectMgr.getCustomObject('CustomObjectSample', customObjectSampleId);
    if (DeleteCustomObjectSample) {
        var Transaction = require('dw/system/Transaction');
        Transaction.begin();
        try {
            CustomObjectMgr.remove(DeleteCustomObjectSample);
            Transaction.commit();
        } catch (e) {
            Logger.error(e);
            Transaction.rollback();
        }
    }
    res.render('customObjectPage');
    return next();
});

module.exports = server.exports();
