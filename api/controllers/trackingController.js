'use strict';

const mongoose = require('mongoose');
const Tracking = mongoose.model('Tracking');

exports.retrieve_tracking = function(req, res){
    console.log('Request made to retrieve tracking.');
    Tracking.find({}, (err, tracking)=>{
        res.json(tracking);
        console.log('response returned');
    });
}

exports.create_tracking = function(req, res){
        const new_tracking = new Tracking(req);
        new_tracking.save((err, tracking)=>{
            console.log('tracking written to db');
        });
}

exports.create_many = function (req, res){
    return Tracking.insertMany(req);
} 

exports.read_tracking = function(req, res){
    Tracking.findById(req.params.trackingId, (err, tracking)=>{
        res.json(tracking);
    });
}

// this will now be relevant since SAP data is being stored and updated with fedexBatchTracking response props
exports.update_many = function(req, res){
    Tracking.updateMany({_id: req.params.trackingId}, req.body, {upsert: true}, (err, tracking)=>{
        res.json(tracking);
    });
}

exports.delete_tracking = function(req, res){
    Tracking.remove({
        _id: req.params.trackingId
    }, function(err, tracking){
        res.json({message: "Tracking successfully deleted."});
    });
}