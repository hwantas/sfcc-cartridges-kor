

function getBytes (string) {
    var utf8 = unescape(encodeURIComponent(string));
    var arr = [];
    for (var i = 0; i < utf8.length; i++) {
        arr.push(utf8.charCodeAt(i));
    }
    console.log('Array ', arr);
    return arr;
}

var str = 'aaaa';
var bbb = getBytes(str);
console.log(bbb);
console.log(bbb.length);

console.log(Buffer.byteLength(str, 'utf8'));

