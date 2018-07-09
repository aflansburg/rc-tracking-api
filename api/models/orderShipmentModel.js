const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema will need to change to accomodate to data object structure
const OrderShipmentSchema = new Schema({
    U_PackTracking: {
        type: String,
    },
    DocDate: {
        type: Date,
    },
    SalesOrderNum: {
        type:  String,
    }  ,
    PackageNum: {
        type: String,
    },
});

module.exports = mongoose.model('OrderShipment', OrderShipmentSchema);