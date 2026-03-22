const fs = require("fs");
const { polarUnwrap } = require("./unwrap");

(async () => {
  const input = fs.readFileSync("./testImage.jpg"); // your test image
  const out = await polarUnwrap(input);
  fs.writeFileSync("./unwrapped.jpg", out);
  console.log("Saved ./unwrapped.jpg");
})();