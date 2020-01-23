const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

const mongoose = require('mongoose');

app.use(cors());

const mongoDB = 'mongodb://localhost/midi';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

mongoose.connection.on('error', () => console.log('mongodb connection failed'));

app.listen(port, () => console.log('listening on port ' + port));

const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));

// app.use(express.json());

app.use('/v1', require('./routes/v1Router'));

module.exports = app;
