const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema will need to change to accomodate to data object structure
const OrderShipmentSchema = new Schema({
    U_PackTracking: {
        type: String,
    },
    ActDelDate: {
        type: Date,
    },
    SalesOrderNum: {
        type:  String,
    }  ,
    PackageNum: {
        type: String,
    },
    WhsCode: {
        type: String,
    },
});

module.exports = mongoose.model('OrderShipment', OrderShipmentSchema);