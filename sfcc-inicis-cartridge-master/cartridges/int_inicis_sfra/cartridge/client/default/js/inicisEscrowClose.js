document.addEventListener('DOMContentLoaded', function () {
    var message = document.getElementById('inicis-message').value;
    if (message) {
        alert(message);
    }
    if (parent && parent.INIStdPay) {
        parent.INIStdPay.viewOff();
    } else if (opener) {
        window.close();
    }
});
