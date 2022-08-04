var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var tokenService = LocalServiceRegistry.createService('SocialLoginCartridge.NaverIdLogin.token.Service', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        svc.addHeader('Accept', 'application/json');
        return params;
    },
    parseResponse: function (svc, httpClient) {
        var result;
        try {
            result = JSON.parse(httpClient.text);
        } catch (e) {
            result = httpClient.text;
        }
        return result;
    }
});

var profileService = LocalServiceRegistry.createService('SocialLoginCartridge.NaverIdLogin.profile.Service', {
    createRequest: function (svc, params) {
        svc.setRequestMethod('GET');
        svc.addHeader('Accept', 'application/json');
        return params;
    },
    parseResponse: function (svc, httpClient) {
        var result;
        try {
            result = JSON.parse(httpClient.text);
        } catch (e) {
            result = httpClient.text;
        }
        return result;
    }
});

module.exports = {
    tokenService: tokenService,
    profileService: profileService
};
