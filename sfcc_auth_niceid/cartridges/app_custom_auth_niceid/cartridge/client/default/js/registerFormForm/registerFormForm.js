'use strict';

$('#btnSocialSubmit').hide();

var authPopup;

window.checkCi = function () {
    var ci = $('#registration-form-ci').val();
    // console.log('ci', ci);
    if (ci) {
        $.ajax({
            url: 'Account-GetCustomerCi',
            type: 'get',
            dataType: 'json',
            data: { ci: ci },
            success: function (data) {
                // console.log('email', data.email);
                if (data.email) {
                    alert('이미 가입된 전화번호입니다.');
                    $('#login-form-email').val(data.email);
                    $('#login-tab').click();
                }
            },
            error: function (err) {
                console.log('error', err);
            }
        });
    }
};

module.exports = {
    phoneAuth: function () {
        $('#btnPhoneAuth').on('click', function () {
            $('#btnSocialSubmit').hide();
            $('#btnNiceidSubmit').show();
            $('#registration-form-password').closest('div').show();
            $('#registration-form-password-confirm').closest('div').show();

            /*
            var java = require('java');
            java.classpath('niceid/NiceIdClient.jar');

            var NiceIdClient = java.import('NiceIdClient');
            var niceIdClient = new NiceIdClient();

            var reqNum = niceIdClient.getReqNum();
            alert(reqNum);
            */

            $.ajax({
                url: 'AccountAuth-GetEncData',
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    var serverData = JSON.parse(data.serverData);

                    authPopup = window.open('', 'authPopup', 'width=500, height=550, top=100, left=100, fullscreen=no, menubar=no, status=no, toolbar=no, titlebar=yes, location=no, scrollbar=no');

                    var authForm = $('<form></form>');
                    authForm.attr('name', 'authForm');
                    authForm.attr('method', 'post');
                    authForm.attr('action', 'https://nice.checkplus.co.kr/CheckPlusSafeModel/checkplus.cb');
                    authForm.attr('target', 'authPopup');
                    authForm.append($('<input />', { type: 'hidden', name: 'm', value: 'checkplusService' }));
                    authForm.append($('<input />', { type: 'hidden', name: 'EncodeData', value: serverData.encData }));
                    authForm.appendTo('body');
                    authForm.submit();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        });
    },

    submitRegistration: function () {
        $('#btnNiceidSubmit').on('click', function () {
            var ci = $('#registration-form-ci').val();
            // console.log('ci', ci);
            if (!ci) {
                alert('휴대폰 인증을 진행해 주세요.');
            } else {
                $.ajax({
                    url: 'Account-GetCustomerCi',
                    type: 'get',
                    dataType: 'json',
                    data: { ci: ci },
                    success: function (data) {
                        // console.log('email', data.email);
                        if (data.email) {
                            alert('이미 가입된 전화번호입니다.');
                            $('#login-form-email').val(data.email);
                            $('#login-tab').click();
                        } else {
                            $('form.registration').submit();
                        }
                    },
                    error: function (err) {
                        console.log('error', err);
                    }
                });
            }
        });
    }

};
