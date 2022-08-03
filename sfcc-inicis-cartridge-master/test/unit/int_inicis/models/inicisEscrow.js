var assert = require('chai').assert;
var sinon = require('sinon');
var SandboxedModule = require('@log4js-node/sandboxed-module');

var Site = {
    current: {
        getCustomPreferenceValue: function (id) {
            switch (id) {
                case 'inicis_testMode':
                    return true;
                case 'inicis_signKey':
                    return 'inicis_signKey';
                case 'inicis_merchantID':
                    return 'inicis_merchantID';
                case 'inicis_payViewType':
                    return {
                        value: 'overlay'
                    };
                default:
                    return undefined;
            }
        }
    }
};

var InicisUtils = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/scripts/inicisUtils.js',
    {
        requires: {
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {}
                    };
                }
            },
            'dw/util/Bytes': function (src) {
                this.testStr = src + ':bytes';
            },
            'dw/crypto/Encoding': {
                toHex: function (src) {
                    return src.testStr + ':hexed';
                },
                toBase64: function (src) {
                    return src.testStr + ':base64';
                }
            },
            'dw/crypto/MessageDigest': function () {
                this.digestBytes = function (src) {
                    var res = src;
                    res.testStr += ':digested';
                    return res;
                };
            },
            'dw/system/Site': Site
        },
        ignoreMissing: true
    }
);

var InicisConstants = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/scripts/inicisConstants.js'
);

var clock = sinon.useFakeTimers(1234567890123);

var InicisEscrowParamHelper = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/scripts/inicisEscrowParamHelper.js',
    {
        requires: {
            'dw/system/Site': Site,
            'dw/web/URLUtils': {
                url: function (id) {
                    return {
                        abs: function () {
                            return 'absolute url : ' + id;
                        }
                    };
                }
            },
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            '*/cartridge/scripts/inicisUtils': InicisUtils
        },
        ignoreMissing: true
    }
);

var InicisEscrowModelPC = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/models/inicisEscrow.js',
    {
        requires: {
            '*/cartridge/scripts/inicisUtils': InicisUtils,
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            'dw/system/Site': Site,
            '*/cartridge/scripts/inicisEscrowParamHelper': InicisEscrowParamHelper
        },
        globals: {
            request: {
                httpUserAgent: 'Some PC agent',
                locale: 'ko_KR'
            }
        },
        ignoreMissing: true
    }
);

var InicisEscrowModelSP = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/models/inicisEscrow.js',
    {
        requires: {
            '*/cartridge/scripts/inicisUtils': InicisUtils,
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            'dw/system/Site': Site,
            '*/cartridge/scripts/inicisEscrowParamHelper': InicisEscrowParamHelper
        },
        globals: {
            request: {
                httpUserAgent: 'iPhone',
                locale: 'ko_KR'
            }
        },
        ignoreMissing: true
    }
);
clock.restore();

describe('inicisEscrow.js', function () {
    it('should be InicisEscrowModel contains inicis request data for PC', function () {
        var inicis = new InicisEscrowModelPC({
            getPaymentInstruments: function (methodID) {
                if (methodID === 'INICIS') {
                    return [
                        {
                            paymentTransaction: {
                                transactionID: '1234567890'
                            }
                        }
                    ];
                }
                return [];
            },
            currencyCode: 'KRW'
        });

        assert.equal(inicis.mobile, false);
        assert.equal(inicis.url, 'https://stgstdpay.inicis.com/stdjs/INIStdPay_escrow_conf.js');
        assert.equal(inicis.params.version, '1.0');
        assert.equal(inicis.params.mid, 'inicis_merchantID');
        assert.equal(inicis.params.tid, '1234567890');
        assert.equal(inicis.params.mKey, 'inicis_signKey:bytes:digested:hexed');
        assert.equal(inicis.params.currency, 'WON');
        assert.equal(inicis.params.returnUrl, 'absolute url : Inicis-PCEscrowReturn');
        assert.equal(inicis.params.closeUrl, 'absolute url : Inicis-PCEscrowClose');
        assert.equal(inicis.params.payViewType, 'overlay');
        assert.equal(inicis.params.charset, 'UTF-8');
        assert.equal(inicis.params.popupUrl, 'absolute url : Inicis-PCEscrowPopup');
    });

    it('should be InicisEscrowModel contains inicis request data for SP', function () {
        var inicis = new InicisEscrowModelSP({
            getPaymentInstruments: function (methodID) {
                if (methodID === 'INICIS') {
                    return [
                        {
                            paymentTransaction: {
                                transactionID: '1234567890'
                            }
                        }
                    ];
                }
                return [];
            },
            currencyCode: 'KRW',
            productLineItems: [
                {
                    productName: 'test product name'
                }
            ]
        });

        assert.equal(inicis.mobile, true);
        assert.equal(inicis.url, 'https://stgmobile.inicis.com/smart/payment/');
        assert.equal(inicis.params.P_INI_PAYMENT, 'ESCROWCONFIRM');
        assert.equal(inicis.params.P_MID, 'inicis_merchantID');
        assert.equal(inicis.params.P_ESCROW_TID, '1234567890');
        assert.equal(inicis.params.P_NEXT_URL, 'absolute url : Inicis-SPEscrowNext');
        assert.equal(inicis.params.P_NEXT_URL_TARGET, 'post');
        assert.equal(inicis.params.P_GOODS, 'test product name');
    });
});
