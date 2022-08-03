document.addEventListener('DOMContentLoaded', function () {
    var message = document.getElementById('inicis-message').value;
    if (message) {
        alert(message);
    }
    if (parent && parent.INIStdPay) {
        parent.$('#InicisForm').remove();
        parent.$('body').trigger('checkout:enableButton', '.next-step-button button');
        parent.history.go(-2); // because Inicis page in iframe has one history.
        parent.INIStdPay.viewOff();
    } else if (opener) {
        opener.$('#InicisForm').remove();
        opener.$('body').trigger('checkout:enableButton', '.next-step-button button');
        opener.history.back();
        window.close();
    }
});
