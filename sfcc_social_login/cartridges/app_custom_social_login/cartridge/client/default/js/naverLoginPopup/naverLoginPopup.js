var Naver = require('../naver/naveridlogin_js_sdk_2.0.2.js');
// Client ID : gdkPNmKsmm9KXgPxEap3
// Client Secret : REByDQRqY9
var naverLogin = new Naver.LoginWithNaverId(
    {
        clientId: 'gdkPNmKsmm9KXgPxEap3',
        callbackUrl: 'https://zyac-001.sandbox.us01.dx.commercecloud.salesforce.com/on/demandware.store/Sites-RefArch-Site/en_US/Oauth-NaverLoginPopup',
        isPopup: false,
        callbackHandle: true
    }
);
naverLogin.init();

window.addEventListener('load', function () {
    naverLogin.getLoginStatus(function (status) {
        console.log(status);
        if (status) {
            console.log(naverLogin.user);
            var email = naverLogin.user.getEmail();
            if (email === undefined || email == null) {
                alert('이메일은 필수정보입니다. 정보제공을 동의해주세요.');
                naverLogin.reprompt();
            } else {
                opener.setOauthInfo('Naver', naverLogin.user.getId(), email);
            }
            window.close();
        } else {
            console.log('callback 처리에 실패하였습니다.');
        }
    });

    document.getElementById('naverIdLogin_loginButton').click();
});

var neverLoginPopup;

/**
 *
 */
function openNeverLoginPopUp() {
    neverLoginPopup = window.open('https://nid.naver.com/nidlogin.logout', '_blank');
}

/**
 *
 */
function closeNeverLoginPopUp() {
    neverLoginPopup.close();
}

/**
 *
 */
function logoutNaver() {
    openNeverLoginPopUp();
    setTimeout(function () {
        closeNeverLoginPopUp();
    }, 1000);
}
