const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackingSchema = new Schema({
    trackingNum: {
        type: String,
    },
    shipDate: {
        type: String,
    },
    lastStatus: {
        type:  String,
    }  ,
    lastStatusDate: {
        type: String,
    },
    lastLocation: {
        type: Object,
    },
});

module.exports = mongoose.model('Tracking', TrackingSchema);