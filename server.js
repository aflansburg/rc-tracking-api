const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const Tracking = require('./api/models/trackingModel')
const TrackingCtrl = require('./api/controllers/trackingController');
const OrderShipment = require('./api/models/orderShipmentModel');
const OrderShipmentCtrl = require('./api/controllers/orderShipmentController');
const bodyParser = require('body-parser');
const data = require('./src/populateData');
const scheduler = require('node-schedule');

data.loadData();

let job = scheduler.scheduleJob('0 * * * *', function(){
  data.loadData()
});

let pruneJob = scheduler.scheduleJob('0 23 * * *', function(){
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

console.log('Fedex SOAP Node RESTful API server started on :' + port);

