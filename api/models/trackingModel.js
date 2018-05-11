const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TrackingSchema = new Schema({
    name: {
        type: String,
        required: 'Enter a name for this tracking',
    },
    Created_date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type:  [{
            type: String,
            enum: ['pending', 'ongoing', 'completed'],
        }],
        default: ['pending'],
    }   
});

module.exports = mongoose.model('Tracking', TrackingSchema);