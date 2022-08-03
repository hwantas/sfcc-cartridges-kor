'use strict';

module.exports = {
    mobileRegExp: RegExp(/iPhone|iPad|Android/gi),
    version: '1.0',
    spAuthURL: 'https://mobile.inicis.com/smart/payment/',
    spAuthURLStg: 'https://stgmobile.inicis.com/smart/payment/',
    pcAuthScript: 'https://stdpay.inicis.com/stdjs/INIStdPay.js',
    pcAuthScriptStg: 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js',
    pcPopupScript: 'https://stdpay.inicis.com/stdjs/INIStdPay_popup.js',
    pcPopupScriptStg: 'https://stgstdpay.inicis.com/stdjs/INIStdPay_popup.js',
    pcEscrowScript: 'https://stdpay.inicis.com/stdjs/INIStdPay_escrow_conf.js',
    pcEscrowScriptStg: 'https://stgstdpay.inicis.com/stdjs/INIStdPay_escrow_conf.js',
    pcCloseScript: 'https://stdpay.inicis.com/stdjs/INIStdPay_close.js',
    pcCloseScriptStg: 'https://stgstdpay.inicis.com/stdjs/INIStdPay_close.js',
    apiUrl: 'https://iniapi.inicis.com/api/v1/',
    apiUrlStg: 'https://stginiapi.inicis.com/api/v1/',
    currencies: ['KRW', 'USD'],
    telRegExp: RegExp(/^[0-9-]+$/),
    emailRegExp: RegExp(/^[A-Za-z0-9.@~_+]+$/),
    locales: ['ko', 'en', 'cn'],
    attrPrefix: 'inicis_',
    spNetCancelUrlPostfix: '/smart/payNetCancel.ini',
    requestLogMasking: [
        'recvName',
        'recvTel',
        'recvPost',
        'recvAddr'
    ],
    responseLogMasking: [
        'buyerTel',
        'buyerEmail',
        'buyerName',
        'custEmail',
        'P_UNAME'
    ]
};
