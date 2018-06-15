const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const Tracking = require('./api/models/trackingModel');
const OrderShipment = require('./api/models/orderShipmentModel');
const bodyParser = require('body-parser');
const data = require('./src/populateData');
const job = require('./src/jobScheduler');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/Trackingdb');

app.use(function(req,res, next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const routes = require('./api/routes/trackingRoutes');
routes(app);

//this runs upon creation of the job
job.scheduleJob();
// data.loadData();

app.listen(port);

console.log('Fedex SOAP Node RESTful API server started on :' + port);

