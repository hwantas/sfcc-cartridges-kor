var assert = require('chai').assert;
var SandboxedModule = require('@log4js-node/sandboxed-module');

var OrderModel = SandboxedModule.require(
    '../../../../cartridges/int_inicis_sfra/cartridge/models/order.js',
    {
        sourceTransformers: {
            superModule: function (src) {
                return src.replace('module.superModule;', 'function(){}');
            }
        },
        ignoreMissing: true
    }
);

describe('order.js', function () {
    it('should be OrderModel contains inicis escrow status', function () {
        var order = new OrderModel({
            custom: {
                inicis_escrowStatus: '2'
            }
        });

        assert.equal(order.inicis_escrowStatus, '2');
    });
});
