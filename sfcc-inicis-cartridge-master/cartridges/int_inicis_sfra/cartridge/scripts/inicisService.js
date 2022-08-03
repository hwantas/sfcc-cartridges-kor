'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Encoding = require('dw/crypto/Encoding');

var Constants = require('*/cartridge/scripts/inicisConstants');
var InicisUtils = require('*/cartridge/scripts/inicisUtils');

// define Inicis services. NVP type response.
var inicisServiceNVP = LocalServiceRegistry.createService('Inicis', {
    createRequest: function (svc, url, data) {
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.setURL(url);
        var reqArr = [];
        Object.keys(data).forEach(function (key) {
            reqArr.push(
                Encoding.toURI(key) + '=' +
                Encoding.toURI(data[key])
                );
        });

        return reqArr.join('&');
    },
    parseResponse: function (svc, res) {
        var body = res.getText();
        return InicisUtils.nvpToObj(body);
    },
    getRequestLogMessage: function (msg) {
        var data = InicisUtils.nvpToObj(msg);
        Constants.requestLogMasking.forEach(function (key) {
            if (data[key]) {
                data[key] = '*****';
            }
        });
        return JSON.stringify(data, null, 4);
    },
    getResponseLogMessage: function (res) {
        var data = InicisUtils.nvpToObj(res.getText());
        Constants.responseLogMasking.forEach(function (key) {
            if (data[key]) {
                data[key] = '*****';
            }
        });
        return JSON.stringify(data, null, 4);
    }
});

// define Inicis services. JSON type response.
var inicisServiceJson = LocalServiceRegistry.createService('Inicis', {
    createRequest: function (svc, url, data) {
        svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
        svc.setURL(url);
        var reqArr = [];
        Object.keys(data).forEach(function (key) {
            reqArr.push(
                Encoding.toURI(key) + '=' +
                Encoding.toURI(data[key])
                );
        });

        return reqArr.join('&');
    },
    parseResponse: function (svc, res) {
        var body = res.getText();
        return JSON.parse(body);
    },
    getRequestLogMessage: function (msg) {
        var data = InicisUtils.nvpToObj(msg);
        Constants.requestLogMasking.forEach(function (key) {
            if (data[key]) {
                data[key] = '*****';
            }
        });
        return JSON.stringify(data, null, 4);
    },
    getResponseLogMessage: function (res) {
        var data = JSON.parse(res.getText());
        Constants.responseLogMasking.forEach(function (key) {
            if (data[key]) {
                data[key] = '*****';
            }
        });
        return JSON.stringify(data, null, 4);
    }
});

module.exports = {
    NVP: inicisServiceNVP,
    JSON: inicisServiceJson
};
