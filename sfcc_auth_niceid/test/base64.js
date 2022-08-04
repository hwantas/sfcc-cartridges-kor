var originText = "This is example text.";
console.log("Original : ", originText);

// Base64 Encoding
base64EncodedText = Buffer.from(originText, "utf8").toString('base64');
console.log("Base64 Encoded Text : ", base64EncodedText);

// Base64 Decoding
base64DecodedText = Buffer.from(base64EncodedText, "base64").toString('utf8');
console.log("Base64 Decoded Text : ", base64DecodedText);