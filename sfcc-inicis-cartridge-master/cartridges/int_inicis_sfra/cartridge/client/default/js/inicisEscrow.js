'use strict';

$(function () {
    /**
     * make form element with params.
     * @param {Object} params : input values for form
     * @param {string} formID : form id
     * @returns {FormElement} : form element
     */
    function makeForm(params, formID) {
        var $form = $(document.createElement('form'));
        $form.prop('id', formID);
        $form.prop('hidden', 'true');
        $form.prop('method', 'POST');
        Object.keys(params).forEach(function (key) {
            var value = params[key];
            var $input = $(document.createElement('input'));
            $input.prop('name', key);
            $input.prop('type', 'hidden');
            $input.val(value);
            $form.append($input);
        });
        $('#' + formID).remove();
        $form.appendTo('body');
        return $form;
    }

    $('.inicis.escrow-confirm-btn').on('click', function () {
        var url = $(this).data('url');
        var orderNo = $(this).data('orderNo');
        var orderToken = $(this).data('orderToken');
        if (url && orderNo) {
            var formData = ['orderNo=' + orderNo];
            if (orderToken) {
                formData.push('orderToken=' + orderToken);
            }
            $.post(url, {
                orderNo: orderNo,
                orderToken: orderToken || ''
            })
            .done(function (data) {
                if (data.error) {
                    alert(data.message);
                    return;
                }

                var formID = 'InicisEscrow-' + orderNo;
                var $form = makeForm(data.params, formID);
                $form.prop('target', '_blank');
                if (data.mobile) {
                    $form.prop('action', data.url);
                    $form.attr('accept-charset', 'euc-kr');
                    $form.submit();
                } else {
                    $.getScript(data.url)
                    .done(function () {
                        if (window.INIStdPay) {
                            window.INIStdPay.pay(formID);
                        } else {
                            alert('Inicis is not loaded!');
                        }
                    })
                    .fail(function () {
                        alert('Inicis is not loaded!');
                    });
                }
            });
        }
    });
});
