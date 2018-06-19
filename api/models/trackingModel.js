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
    shipDate: {
        type: Date,
    },
    actualShipDate: {
        type: Date,
    },
    lastStatus: {
        type:  String,
    },
    lastStatusDate: {
        type: Date,
    },
    lastLocation: {
        type: Object,
    },
    reason: {
        type: String,
    }
});

module.exports = mongoose.model('Tracking', TrackingSchema);