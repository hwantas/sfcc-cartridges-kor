'use strict';

var server = require('server');
var Logger = require('dw/system/Logger');

server.get('NaverLoginPopup',
    function (req, res, next) {
        res.render('/account/components/naverLoginPopup');
        next();
    }
);

server.post('SubmitRegistration', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    var oauthProviderID = req.form.oauthProviderID;
    var oauthUserID = req.form.oauthUserID;

    var firstName = req.form.firstName;
    var lastName = req.form.lastName;
    var phone = req.form.phone;
    var email = req.form.email;

    Logger.warn('oauthProviderID = ' + oauthProviderID);
    Logger.warn('oauthUserID = ' + oauthUserID);
    Logger.warn('firstName = ' + firstName);
    Logger.warn('lastName = ' + lastName);
    Logger.warn('phone = ' + phone);
    Logger.warn('email = ' + email);

    var authenticatedCustomerProfile;
    Transaction.wrap(function () {
        var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
            oauthProviderID,
            oauthUserID
        );

        authenticatedCustomerProfile = newCustomer.getProfile();
        authenticatedCustomerProfile.setFirstName(firstName);
        authenticatedCustomerProfile.setLastName(lastName);
        authenticatedCustomerProfile.setPhoneHome(phone);
        authenticatedCustomerProfile.setEmail(email);
    });

    var credentials = authenticatedCustomerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, oauthUserID, false);
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    req.session.privacyCache.clear();
    res.redirect(URLUtils.url('Account-Show'));

    return next();
});

module.exports = server.exports();
