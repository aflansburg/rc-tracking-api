const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// this schema will need to change to accomodate to data object structure
const TrackingSchema = new Schema({
    trackingNum: {
        type: String,
        index: { unique: true }
    },
    orderNum: {
        type: String,
    },
    lastStatus: {	
        type:  String,	
    },
    reason: {
        type: String,
    },
    warehouse: {
        type: String,
    },
    shipmentCreated: {
        type: Date,
    },
});

module.exports = mongoose.model('Tracking', TrackingSchema);