const express = require('express');
const PORT = 3000;
const app = express();

app.use(express.json());

app.get('/', (req, res, next) => {
  res.send('hello werld');
});

app.listen(PORT, () => {
  console.log('Your server is now listening on port:', PORT);
});