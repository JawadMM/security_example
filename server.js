const https = require("https")
const path = require("path");
const express = require("express");

const PORT = 3000;

app = express();

app.get("/secret", (req, res) => {
  return res.send("Secret is 123");
});

app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

https.createServer({}, app).listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  
})