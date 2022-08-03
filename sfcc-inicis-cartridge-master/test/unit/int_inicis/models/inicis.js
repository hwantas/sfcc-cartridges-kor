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
                case 'inicis_quotabase':
                    return [2, 3, 5, 10];
                case 'inicis_nointerest':
                    return ['11-2:3', '12-4:5'];
                case 'inicis_tax':
                    return true;
                case 'inicis_taxfree':
                    return true;
                case 'inicis_acceptmethod_SKIN':
                    return '#C1272C';
                case 'inicis_card_below1000':
                    return true;
                case 'inicis_card_paypopup':
                    return true;
                case 'inicis_card_hidebar':
                    return true;
                case 'inicis_onlycardcode':
                    return [
                        { value: '11' },
                        { value: '12' }
                    ];
                case 'inicis_card_cardpoint':
                    return true;
                case 'inicis_card_ocb':
                    return true;
                case 'inicis_card_slimquota':
                    return ['13-3:5', '01-5:10'];
                case 'inicis_card_mallpoint':
                    return [
                        { value: '15' },
                        { value: '16' }
                    ];
                case 'inicis_merchantID':
                    return 'inicis_merchantID';
                case 'inicis_payViewType':
                    return {
                        value: 'popup'
                    };
                case 'inicis_P_CARD_OPTION':
                    return {
                        value: '21'
                    };
                case 'inicis_MNAME':
                    return 'Inicis Test Merchant';
                case 'inicis_mobileHashKey':
                    return 'mobileHashKey';
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

var InicisParamHelper = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/scripts/inicisParamHelper.js',
    {
        requires: {
            'server': {
                forms: {
                    getForm: function () {
                        return {
                            clear: function () {},
                            inicis_oid: {
                                value: undefined
                            }
                        };
                    }
                }
            },
            'dw/util/Bytes': function (src) {
                this.testStr = src + ':bytes';
            },
            'dw/crypto/Encoding': {
                toHex: function (src) {
                    return src.testStr + ':hexed';
                }
            },
            'dw/crypto/MessageDigest': function () {
                this.digestBytes = function (src) {
                    var res = src;
                    res.testStr += ':digested';
                    return res;
                };
            },
            'dw/web/Resource': {
                msg: function (id, category, defaultValue) {
                    return category + ' / ' + id + ' / ' + defaultValue;
                },
                msgf: function (id, category, defaultValue) {
                    return category + ' / ' + id + ' / ' + defaultValue;
                }
            },
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
            'dw/order/OrderMgr': {
                createOrderNo: function () {
                    return 'some_order_id';
                }
            },
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            '*/cartridge/scripts/inicisUtils': InicisUtils
        },
        ignoreMissing: true
    }
);

var InicisModelPC = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/models/inicis.js',
    {
        requires: {
            '*/cartridge/scripts/inicisUtils': InicisUtils,
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            'dw/system/Site': Site,
            '*/cartridge/scripts/inicisParamHelper': InicisParamHelper
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

var InicisModelSP = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/models/inicis.js',
    {
        requires: {
            '*/cartridge/scripts/inicisUtils': InicisUtils,
            '*/cartridge/scripts/inicisConstants': InicisConstants,
            'dw/system/Site': Site,
            '*/cartridge/scripts/inicisParamHelper': InicisParamHelper
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

describe('inicis.js', function () {
    it('should be InicisModel contains inicis request data for PC', function () {
        var inicis = new InicisModelPC({
            customer: {
                profile: {
                    firstName: 'name 1',
                    lastName: 'test '
                }
            },
            getPaymentInstruments: function (methodID) {
                if (methodID === 'INICIS') {
                    return [{}];
                }
                return [];
            },
            totalGrossPrice: {
                currencyCode: 'KRW',
                value: 13000
            },
            productLineItems: {
                0: {
                    productName: 'test product'
                },
                length: 2,
                iterator: function () {
                    var idx = 0;
                    var plis = [
                        {
                            adjustedNetPrice: {
                                value: 10000
                            },
                            adjustedTax: {
                                value: 1000
                            }
                        },
                        {
                            adjustedNetPrice: {
                                value: 2000
                            },
                            adjustedTax: {
                                value: 0
                            }
                        }
                    ];
                    return {
                        hasNext: function () {
                            return idx < plis.length;
                        },
                        next: function () {
                            return plis[idx++];
                        }
                    };
                }
            },
            billingAddress: {
                fullName: 'test name 1',
                phone: '010-1111-2222'
            },
            customerName: 'test name 2',
            customerEmail: 'test@rubygroupe.jp',
            totalTax: {
                value: 500
            }
        });

        assert.equal(inicis.mobile, false);
        assert.equal(inicis.url, 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js');
        assert.equal(inicis.params.version, '1.0');
        assert.equal(inicis.params.gopaymethod, 'Card');
        assert.equal(inicis.params.mid, 'inicis_merchantID');
        assert.equal(inicis.params.oid, 'some_order_id');
        assert.equal(inicis.params.price, '13000');
        assert.equal(inicis.params.timestamp, '1234567890123');
        assert.equal(inicis.params.signature, 'oid=some_order_id&price=13000&timestamp=1234567890123:bytes:digested:hexed');
        assert.equal(inicis.params.mKey, 'inicis_signKey:bytes:digested:hexed');
        assert.equal(inicis.params.currency, 'WON');
        assert.equal(inicis.params.goodname, 'test product');
        assert.equal(inicis.params.buyername, 'test name 1');
        assert.equal(inicis.params.buyertel, '010-1111-2222');
        assert.equal(inicis.params.buyeremail, 'test@rubygroupe.jp');
        assert.equal(inicis.params.returnUrl, 'absolute url : Inicis-PCReturn');
        assert.equal(inicis.params.closeUrl, 'absolute url : Inicis-PCClose');
        assert.equal(inicis.params.quotabase, '2:3:5:10');
        assert.equal(inicis.params.nointerest, '11-2:3,12-4:5');
        assert.equal(inicis.params.tax, 500);
        assert.equal(inicis.params.taxfree, 2000);
        assert.equal(inicis.params.payViewType, 'popup');
        assert.equal(inicis.params.languageView, 'ko');
        assert.equal(inicis.params.popupUrl, 'absolute url : Inicis-PCPopup');
        assert.equal(inicis.params.ini_ssgpay_mdn, '01011112222');
        assert.equal(inicis.params.acceptmethod, 'SKIN(#C1272C):popreturn:below1000:paypopup:hidebar:ini_onlycardcode(11:12):cardpoint:ocb:slimquota(13-3:5,01-5:10):mallpoint(15:16)');
    });

    it('should be InicisModel contains inicis request data for SP', function () {
        var inicis = new InicisModelSP({
            customer: {
                profile: {
                    firstName: 'name 1',
                    lastName: 'test '
                }
            },
            getPaymentInstruments: function (methodID) {
                if (methodID === 'INICIS') {
                    return [{}];
                }
                return [];
            },
            totalGrossPrice: {
                currencyCode: 'KRW',
                value: 13000
            },
            productLineItems: {
                0: {
                    productName: 'test product'
                },
                length: 2,
                iterator: function () {
                    var idx = 0;
                    var plis = [
                        {
                            adjustedNetPrice: {
                                value: 10000
                            },
                            adjustedTax: {
                                value: 1000
                            }
                        },
                        {
                            adjustedNetPrice: {
                                value: 2000
                            },
                            adjustedTax: {
                                value: 0
                            }
                        }
                    ];
                    return {
                        hasNext: function () {
                            return idx < plis.length;
                        },
                        next: function () {
                            return plis[idx++];
                        }
                    };
                }
            },
            billingAddress: {
                fullName: 'test name 1',
                phone: '010-1111-2222'
            },
            customerName: 'test name 2',
            customerEmail: 'test@rubygroupe.jp',
            totalTax: {
                value: 500
            }
        });

        assert.equal(inicis.mobile, true);
        assert.equal(inicis.url, 'https://stgmobile.inicis.com/smart/payment/');
        assert.equal(inicis.params.P_INI_PAYMENT, 'CARD');
        assert.equal(inicis.params.P_MID, 'inicis_merchantID');
        assert.equal(inicis.params.P_OID, 'some_order_id');
        assert.equal(inicis.params.P_AMT, '13000');
        assert.equal(inicis.params.P_HPP_METHOD, null);
        assert.equal(inicis.params.P_OFFER_PERIOD, null);
        assert.equal(inicis.params.P_CHARSET, 'utf8');
        assert.equal(inicis.params.P_GOODS, 'test product');
        assert.equal(inicis.params.P_UNAME, 'test name 1');
        assert.equal(inicis.params.P_MOBILE, '010-1111-2222');
        assert.equal(inicis.params.P_EMAIL, 'test@rubygroupe.jp');
        assert.equal(inicis.params.P_NEXT_URL, 'absolute url : Inicis-SPNext');
        assert.equal(inicis.params.P_QUOTABASE, '2:3:5:10');
        assert.equal(inicis.params.P_MNAME, 'Inicis Test Merchant');
        assert.equal(inicis.params.P_TAX, 500);
        assert.equal(inicis.params.P_TAXFREE, 2000);
        assert.equal(inicis.params.P_ONLY_CARDCODE, '11:12');
        assert.equal(inicis.params.P_CARD_OPTION, '21');
        assert.equal(inicis.params.P_RESERVED, 'below1000=Y&merc_noint=Y&noint_quota=11-2:3^12-4:5&cp_yn=Y&amt_hash=Y');
        assert.equal(inicis.params.P_TIMESTAMP, '1234567890123');
        assert.equal(inicis.params.P_CHKFAKE, '13000some_order_id1234567890123mobileHashKey:bytes:digested:base64');
    });
});
