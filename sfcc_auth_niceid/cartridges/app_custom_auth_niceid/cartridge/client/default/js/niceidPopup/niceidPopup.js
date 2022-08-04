'use strict';

window.addEventListener('load', function () {
    var niceidName = $('#niceidName').val();
    var niceidFirstName = niceidName.slice(-2);
    var niceidLastName = niceidName.replace(niceidFirstName, '');
    $('#registration-form-fname', opener.document).val(niceidFirstName);
    $('#registration-form-lname', opener.document).val(niceidLastName);
    $('#registration-form-phone', opener.document).val($('#niceidMobileNo').val());
    $('#registration-form-ci', opener.document).val($('#niceidCi').val());
    // $('#registration-form-gender', opener.document).val($('#niceidGender').val());

    opener.checkCi();
    
    window.close();
});
