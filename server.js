const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const Tracking = require('./api/models/trackingModel');
const bodyParser = require('body-parser');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Trackingdb');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const routes = require('./api/routes/trackingRoutes');
routes(app);

app.listen(port);

console.log('Fedex SOAP Node RESTful API server started on :' + port);

