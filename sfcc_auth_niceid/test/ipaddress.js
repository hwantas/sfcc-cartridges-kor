
 let ip = require("ip");
 var2 = ip.address();

let var6 = 16 - var2.length - 1;
if (var6 > 0) {
    for (let var5 = 0; var5 < var6; ++var5) {
        var2 = var2 + " ";
    }
}

console.log(var2.substring(0, 15));