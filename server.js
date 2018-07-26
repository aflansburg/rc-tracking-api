const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');

// declared but unused just to register the schemas
const Tracking = require('./api/models/trackingModel')
const OrderShipment = require('./api/models/orderShipmentModel');

const TrackingCtrl = require('./api/controllers/trackingController');
const OrderShipmentCtrl = require('./api/controllers/orderShipmentController');
const bodyParser = require('body-parser');
const data = require('./src/populateData');
const scheduler = require('node-schedule');

// run on save/start
// data.loadData();

let job = scheduler.scheduleJob('0 * * * *', function(){
  console.log('\nRunning hourly job\n');
  data.loadData();
});

// drop off old records from db
let pruneJob = scheduler.scheduleJob('30 7 * * *', function(){
  OrderShipmentCtrl.prune_records();
  TrackingCtrl.prune_records();
});

// drop off old records from db
let pruneJob2 = scheduler.scheduleJob('0 23 * * *', function(){
  OrderShipmentCtrl.prune_records();
  TrackingCtrl.prune_records();
});

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

app.listen(port);

console.log('RC Tracking Node.js RESTful API server started on :' + port);

