'use strict';

/**
 * @namespace Login
 */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var naverIdLoginService = require('app_custom_social_login/cartridge/services/NaverIdLoginService');

var Logger = require('dw/system/Logger');

/**
 * Login-Show : This endpoint is called to load the login page
 * @name Base/Login-Show
 * @function
 * @memberof Login
 * @param {middleware} - consentTracking.consent
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.generateToken
 * @param {querystringparameter} - rurl - Redirect URL
 * @param {querystringparameter} - action - Action on submit of Login Form
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.get(
    'Show',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var Resource = require('dw/web/Resource');

        var target = req.querystring.rurl || 1;

        var rememberMe = false;
        var userName = '';
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
        var navTabValue = req.querystring.action;

        if (req.currentCustomer.credentials) {
            rememberMe = true;
            userName = req.currentCustomer.credentials.username;
        }

        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ];

        var profileForm = server.forms.getForm('profile');
        profileForm.clear();

        res.render('/account/login', {
            navTabValue: navTabValue || 'login',
            rememberMe: rememberMe,
            userName: userName,
            actionUrl: actionUrl,
            profileForm: profileForm,
            breadcrumbs: breadcrumbs,
            oAuthReentryEndpoint: 1,
            createAccountUrl: createAccountUrl
        });

        next();
    }
);

/**
 * Login-Logout : This endpoint is called to log shopper out of the session
 * @name Base/Login-Logout
 * @function
 * @memberof Login
 * @param {category} - sensitive
 * @param {serverfunction} - get
 */
server.get('Logout', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');

    CustomerMgr.logoutCustomer(false);
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

/**
 * Login-OAuthLogin : This endpoint invokes the External OAuth Providers Login
 * @name Base/Login-OAuthLogin
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - oauthProvider - ID of the OAuth Provider. e.g. Facebook, Google
 * @param {querystringparameter} - oauthLoginTargetEndPoint - Valid values for this parameter are 1 or 2. These values are mapped in oAuthRenentryRedirectEndpoints.js
 * @param {category} - sensitive
 * @param {renders} - isml if there is an error
 * @param {serverfunction} - get
 */
server.get('OAuthLogin', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var Resource = require('dw/web/Resource');
    var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');

    var targetEndPoint = req.querystring.oauthLoginTargetEndPoint
        ? parseInt(req.querystring.oauthLoginTargetEndPoint, 10)
        : null;

    if (targetEndPoint && endpoints[targetEndPoint]) {
        req.session.privacyCache.set(
            'oauthLoginTargetEndPoint',
            endpoints[targetEndPoint]
        );
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (req.querystring.oauthProvider) {
        var oauthProvider = req.querystring.oauthProvider;
        req.session.privacyCache.set(
            'oauthProvider',
            oauthProvider
        );
        var result = oauthLoginFlowMgr.initiateOAuthLogin(oauthProvider);

        if (result) {
            res.redirect(result.location);
        } else {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });

            return next();
        }
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    return next();
});

/**
 * Login-OAuthReentry : This endpoint is called by the External OAuth Login Provider (Facebook, Google etc. to re-enter storefront after shopper logs in using their service
 * @name Base/Login-OAuthReentry
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - code - given by facebook
 * @param {querystringparameter} - state - given by facebook
 * @param {category} - sensitive
 * @param {renders} - isml only if there is a error
 * @param {serverfunction} - get
 */
server.get('OAuthReentry', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;
    
    var oauthProvider = req.session.privacyCache.store.oauthProvider;
    
    var oauthProviderID;
    var externalProfile;
    var userID;
    if (oauthProvider === 'Naver') {
        oauthProviderID = oauthProvider;
        var tokenResult = naverIdLoginService.tokenService.addParam('client_id', 'gdkPNmKsmm9KXgPxEap3').addParam('client_secret', 'REByDQRqY9').addParam('grant_type', 'authorization_code').addParam('state', req.querystring.state).addParam('code', req.querystring.code).call();
        if (tokenResult.status === 'OK') {
            var profileResult = naverIdLoginService.profileService.addHeader('Authorization', 'Bearer ' + tokenResult.object.access_token).call();
            if (profileResult.status === 'OK') {
                /*
                var firstName = profileResult.object.response.name.slice(-2);
                var lastName = profileResult.object.response.name.replace(firstName, '');

                externalProfile = profileResult.object.response;
                externalProfile['first-name'] = firstName;
                externalProfile['last-name'] = lastName;
                */
                userID = profileResult.object.response.id;
                if (!userID) {
                    res.render('/error', {
                        message: Resource.msg('error.oauth.login.failure', 'login', null)
                    });
                    return next();
                }
            }
        }
    } else {
        var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
        if (!finalizeOAuthLoginResult) {
            res.redirect(URLUtils.url('Login-Show'));
            return next();
        }

        oauthProviderID = finalizeOAuthLoginResult.accessTokenResponse.oauthProviderId;
        if (!oauthProviderID) {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });
            return next();
        }

        var response = finalizeOAuthLoginResult.userInfoResponse.userInfo;
        if (!response) {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });
            return next();
        }

        externalProfile = JSON.parse(response);
        if (oauthProviderID == 'Kakao') {
            /*
            Logger.info('email = ' + externalProfile.kakao_account.email);
            externalProfile['email-address'] = externalProfile.kakao_account.email;
            externalProfile['last-name'] = externalProfile.properties.nickname;
            */
        }
        
        if (!externalProfile) {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });
            return next();
        }

        userID = externalProfile.id || externalProfile.uid;
        if (!userID) {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });
            return next();
        }
    }

    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        oauthProviderID,
        userID
    );
    
    if (!authenticatedCustomerProfile) {
        // Resource.msg('error.message.login.form', 'login', null)
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });
        return next();
    } else {
        var credentials = authenticatedCustomerProfile.getCredentials();
        if (credentials.isEnabled()) {
            Transaction.wrap(function () {
                CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, false);
            });
        } else {
            res.render('/error', {
                message: Resource.msg('error.oauth.login.failure', 'login', null)
            });

            return next();
        }

        req.session.privacyCache.clear();
        res.redirect(URLUtils.url(destination));
    }

    return next();
});

module.exports = server.exports();
