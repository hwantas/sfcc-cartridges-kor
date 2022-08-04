'use strict';

/*
var https = require('https');
var vm = require('vm');
var concat = require('concat-stream'); // this is just a helper to receive the
                                       // http payload in a single callback
                                       // see https://www.npmjs.com/package/concat-stream

// https://developers.kakao.com/sdk/js/kakao.js
https.get({
    host: 'developers.kakao.com',
    port: 443,
    path: '/sdk/js/kakao.js'
},
function (res) {
    res.setEncoding('utf8');
    res.pipe(concat({ encoding: 'string' },
    function (remoteSrc) {
        vm.runInThisContext(remoteSrc, 'remote_modules/kakao.js');
    }));
});
*/

var Kakao = require('../kakao/kakao.js');
Kakao.init('b01dd2e231ebe7f48d5b19e8b4b6df6e');

module.exports = {

    shareKakaoTalk: function () {
        $('body').on('click', '#fa-kakao-talk', function (e) {
            e.preventDefault();

            var productName = $(this).data('productName');
            var productUrl = $(this).data('productUrl');
            var longDescription = $(this).data('longDescription');
            var imageUrl = $(this).data('imageUrl');

            Kakao.Link.sendDefault({
                objectType: 'feed',
                content: {
                    title: productName,
                    description: longDescription,
                    imageUrl: imageUrl,
                    link: {
                        mobileWebUrl: productUrl,
                        webUrl: productUrl
                    }
                },
                buttons: [
                    {
                        title: 'View in DMSCC',
                        link: {
                            mobileWebUrl: productUrl,
                            webUrl: productUrl
                        }
                    }
                ]
            });
        });
    }

};
