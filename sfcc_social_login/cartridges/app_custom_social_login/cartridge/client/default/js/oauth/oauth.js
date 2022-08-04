'use strict';
var Kakao = require('../kakao/kakao.js');
Kakao.init('b01dd2e231ebe7f48d5b19e8b4b6df6e');

window.setOauthInfo = function (oauthProviderID, oauthUserID, email) {
    $('#registration-oauthProviderID').val(oauthProviderID);
    $('#registration-oauthUserID').val(oauthUserID);
    $('#login-form-email').val(email);
    $('#registration-form-email').val(email);
};

function loginKakao() {
    // console.log(Kakao.isInitialized());
    Kakao.Auth.login({
        success: function (res1) {
            /*
            console.log('--- login success ---');
            console.log('token_type :', res1.token_type);
            console.log('access_token :', res1.access_token);
            console.log('expires_in :', res1.expires_in);
            console.log('refresh_token :', res1.refresh_token);
            console.log('refresh_token_expires_in :', res1.refresh_token_expires_in);
            console.log('scope :', res1.scope);
            */
            Kakao.API.request({
                url: '/v2/user/me',
                success: function (res2) {
                    // console.log('--- request success ---');
                    // console.log('id :', res2.id);
                    // console.log('connected_at :', res2.connected_at);
                    // console.log('properties :', res2.properties);
                    // console.log('kakao_account :', res2.kakao_account);
                    // console.log('kakao_account birthday :', res2.kakao_account.birthday);
                    // console.log('kakao_account birthday_type :', res2.kakao_account.birthday_type);
                    // console.log('kakao_account email:', res2.kakao_account.email);
                    // console.log('kakao_account gender :', res2.kakao_account.gender);
                    // console.log('kakao_account profile nickname :', res2.kakao_account.profile.nickname);

                    var email = res2.kakao_account.email;
                    setOauthInfo('Kakao', res2.id, email);
                },
                fail: function (err1) {
                    console.log('request fail', err1);
                }
            });
        },
        fail: function (err2) {
            console.log('login fail', err2);
        }
    });
}

var naverLoginPopup;

module.exports = {

    loginKakao: function () {
        $('#loginOauthKakao').click(function () {
            $('#btnSocialSubmit').show();
            $('#btnNiceidSubmit').hide();
            $('#registration-form-password').closest('div').hide();
            $('#registration-form-password-confirm').closest('div').hide();
            loginKakao();
        });
    },

    loginNaver: function () {
        $('#loginOauthNaver').click(function () {
            $('#btnSocialSubmit').show();
            $('#btnNiceidSubmit').hide();
            $('#registration-form-password').closest('div').hide();
            $('#registration-form-password-confirm').closest('div').hide();
            naverLoginPopup = window.open('Oauth-NaverLoginPopup', 'naverLoginPopup');
        });
    },

    submitRegistration: function () {
        $('#btnSocialSubmit').on('click', function () {
            var oauthProviderID = $('#registration-oauthProviderID').val();
            var oauthUserID = $('#registration-oauthUserID').val();
            var firstName = $('#registration-form-fname').val();
            var lastName = $('#registration-form-lname').val();
            var phone = $('#registration-form-phone').val();
            var email = $('#registration-form-email').val();
            var emailCfm = $('#registration-form-email-confirm').val();

            if (email !== emailCfm) {
                alert('Please enter the same value again.');
                return;
            } else {
                var socialForm = $('<form></form>');
                socialForm.attr('name', 'socialForm');
                socialForm.attr('method', 'post');
                socialForm.attr('action', 'Oauth-SubmitRegistration');
                socialForm.append($('<input/>', { type: 'hidden', name: 'oauthProviderID', value: oauthProviderID }));
                socialForm.append($('<input/>', { type: 'hidden', name: 'oauthUserID', value: oauthUserID }));
                socialForm.append($('<input/>', { type: 'hidden', name: 'firstName', value: firstName }));
                socialForm.append($('<input/>', { type: 'hidden', name: 'lastName', value: lastName }));
                socialForm.append($('<input/>', { type: 'hidden', name: 'phone', value: phone }));
                socialForm.append($('<input/>', { type: 'hidden', name: 'email', value: email }));
                socialForm.appendTo('body');
                socialForm.submit();
            }
        });
    }

};
