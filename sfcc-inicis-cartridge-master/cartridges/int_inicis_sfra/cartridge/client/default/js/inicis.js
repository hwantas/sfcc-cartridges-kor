'use strict';

$(function () {
    if (!$) {
        alert('JQuery is not loaded!');
        return;
    }
    var formID = 'InicisForm';
    var popupID = 'InicisPopup';
    var popupChkInterval = null;
    var regPopupChkTimeout = null;

    /**
     * when failed to load Inicis module
     */
    function loadScriptFailed() {
        alert('Inicis is not loaded!');
        window.history.back();

        $('body').trigger('checkout:enableButton', '.next-step-button button');
    }

    /**
     * make form element with params.
     * @param {Object} params : input values for form
     * @returns {FormElement} : form element
     */
    function makeForm(params) {
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

    /**
     * checking popup window is closed
     * @param {Window} popup : Popup Window Element
     * @returns {boolean} : success to start checking
     */
    function checkPopup(popup) {
        clearInterval(popupChkInterval);
        if (!popup) {
            return false;
        }
        popupChkInterval = setInterval(function () {
            if (!popup || popup.closed) {
                var $inicisForm = $('form#' + formID);
                if ($inicisForm.length > 0) { // popup is closed unexpectly.
                    $inicisForm.remove();
                    window.history.back();
                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                }
                clearInterval(popupChkInterval);
            }
        }, 5000);
        return true;
    }

    /**
     * set Inicis Popup to checkPopup.
     * because Inicis Popup is not created promptly.
     */
    function regInicisPopupCheck() {
        if (!checkPopup(window.INIStdPay.$stdPopup)) {
            clearTimeout(regPopupChkTimeout);
            regPopupChkTimeout = setTimeout(regInicisPopupCheck, 500);
        }
    }

    /**
     * show inicis payment window
     * @param {Object} order : order data
     */
    function showInicis(order) {
        // disable the next:Place Order button here
        $('body').trigger('checkout:disableButton', '.next-step-button button');

        var $form = makeForm(order.inicis.params);
        if (order.inicis.mobile) { // mobile device used
            $form.prop('action', order.inicis.url);
            $form.attr('accept-charset', 'euc-kr');
            $form.prop('target', popupID);
            var inicisPopup = window.open('about:blank', popupID);
            $form.submit();
            checkPopup(inicisPopup);
        } else {
            $.getScript(order.inicis.url)
            .done(function () {
                if (window.INIStdPay) {
                    if (window.INIStdPay.pay(formID) === false) {
                        window.history.back();
                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                    } else if (order.inicis.params.payViewType === 'popup') {
                        regInicisPopupCheck();
                    }
                } else {
                    loadScriptFailed();
                }
            })
            .fail(loadScriptFailed.bind(this));
        }
    }

    /**
     * check the order use Inicis payment
     * @param {Object} order : order data
     * @returns {boolean} : true for Inicis payment
     */
    function isInicis(order) {
        // check is Inicis payment selected.
        var isInicisPay = false;
        var selectedPayments = order.billing.payment &&
            order.billing.payment.selectedPaymentInstruments;
        if (selectedPayments) {
            selectedPayments.forEach(function (payment) {
                if (payment.paymentMethod === 'INICIS') {
                    isInicisPay = true;
                }
            });
        }
        return isInicisPay;
    }

    /**
     * show Inicis payment info
     * @param {Object} order : order data
     */
    function updatePaymentInformation(order) {
        // update payment details
        var $paymentSummary = $('.payment-details');
        var htmlToAppend = '';

        var paymentMethod = order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
        var paymentMethodName = paymentMethod;
        order.billing.payment.applicablePaymentMethods.forEach(function (method) {
            if (method.ID === paymentMethod) {
                paymentMethodName = method.name;
            }
        });

        htmlToAppend += '<span>'
            + paymentMethodName
            + '</span>';

        $paymentSummary.empty().append(htmlToAppend);
    }

    $('body').on('checkout:updateCheckoutView', function (e, data) {
        var stage = $('.data-checkout-stage').attr('data-checkout-stage');
        if (stage === 'payment' && isInicis(data.order)) {
            updatePaymentInformation(data.order);
            showInicis(data.order);
        }
    });
});
