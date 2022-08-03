document.addEventListener('DOMContentLoaded', function () {
    var placeOrderBtn;
    if (parent && parent.INIStdPay) {
        placeOrderBtn = parent.$('.place-order');
        parent.$('#InicisForm').remove();
        parent.$('body').trigger('checkout:enableButton', '.next-step-button button');
        parent.INIStdPay.viewOff();
    } else if (opener) {
        placeOrderBtn = opener.$('.place-order');
        opener.$('#InicisForm').remove();
        opener.$('body').trigger('checkout:enableButton', '.next-step-button button');
    }
    placeOrderBtn.click();
    if (opener) {
        window.close();
    }
});
