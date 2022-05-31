const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send("I'm inside the server, the api is being called!");
});

const port = 3000;
app.listen(port, () => {
  console.log(`Express server listening at http://0.0.0.0:${port}`);
});
