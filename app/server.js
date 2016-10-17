'use strict';

const express = require('express');
var path    = require("path");

// Constants
const PORT = 8080;

// App
const app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/public/index.html'));
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);