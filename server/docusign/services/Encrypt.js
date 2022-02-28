const FileSystem = require("fs"),
      Crypto = require("crypto");

class Encrypt {

    constructor(filePath) {
        this.filePath = filePath;
        this.password = global.config.tokenSecret;
    }

    encrypt(data) {
        try {
            let cipher = Crypto.createCipher('aes-256-cbc', this.password);
            let encrypted = Buffer.concat([cipher.update(new Buffer(JSON.stringify(data), "utf8")), cipher.final()]);
            FileSystem.writeFileSync(this.filePath, encrypted);
            return { message: "Encrypted!" };
        } catch (exception) {
            throw new Error(exception.message);
        }
     }

    decrypt() {
        try {
            let data = FileSystem.readFileSync(this.filePath);
            let decipher = Crypto.createDecipher("aes-256-cbc", this.password);
            let decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
            return JSON.parse(decrypted.toString());
        } catch (exception) {
            throw new Error(exception.message);
        }
     }
}

exports.Encrypt = Encrypt;