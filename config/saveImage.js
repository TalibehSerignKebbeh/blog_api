const fs = require("fs");

function convertBase64ToFile(base64String, filePath) {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  fs.writeFileSync(filePath, buffer, "binary");

  return filePath;
}


module.exports = {convertBase64ToFile}