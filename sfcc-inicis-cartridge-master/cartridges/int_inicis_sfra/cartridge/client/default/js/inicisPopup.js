window.addEventListener('beforeunload', function () {
    opener.history.back();
    opener.$('body').trigger('checkout:enableButton', '.next-step-button button');
});
