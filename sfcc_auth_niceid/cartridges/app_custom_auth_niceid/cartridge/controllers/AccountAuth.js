'use strict';

/**
 * @namespace AccountAuth
 */

var server = require('server');

var HTTPClient = require('dw/net/HTTPClient');
var Logger = require('dw/system/Logger');

server.get(
    'GetEncData',
    function (req, res, next) {
        var serverData = '';

        var url = 'http://115.68.185.220/niceid_client_relay/getEncData';

        var httpClient = new HTTPClient();
        httpClient.setTimeout(2000);
        httpClient.open('GET', url);
        httpClient.send();

        if (httpClient.statusCode === 200) {
            Logger.getLogger('shop').info(
                httpClient.text
            );
            serverData = httpClient.text;
        } else {
            Logger.getLogger('shop').error(
                'An error occured with status code ' + httpClient.statusCode
            );
        }

        res.json({
            success: true,
            serverData: serverData
        });

        return next();
    }
);

server.get(
    'Success',
    function (req, res, next) {
        var EncodeData = req.querystring.EncodeData;

        var serverData = '';

        var url = 'http://115.68.185.220/niceid_client_relay/getDecData';

        var httpClient = new HTTPClient();
        httpClient.setTimeout(2000);
        httpClient.open('POST', url);
        httpClient.send(JSON.stringify({ EncodeData: EncodeData }));

        if (httpClient.statusCode === 200) {
            Logger.getLogger('shop').info(
                httpClient.text
            );
            serverData = httpClient.text;
        } else {
            Logger.getLogger('shop').error(
                'An error occured with status code ' + httpClient.statusCode
            );
        }

        var niceidObj = JSON.parse(serverData);

        res.render('/account/components/niceidPopup', {
            serverData: serverData,
            niceidObj: niceidObj
        });

        next();
    }
);

server.get(
    'Fail',
    function (req, res, next) {

        res.render('/account/components/niceidPopup', {
            serverData: 'Fail'
        });

        next();
    }
);

module.exports = server.exports();
