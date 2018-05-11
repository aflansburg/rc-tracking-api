'use strict';

const mongoose = require('mongoose');
const Tracking = mongoose.model('Tracking');

exports.retrieve_tracking = function(req, res){
    Tracking.find({}, (err, tracking)=>{
        if (err)
            res.send(err);
        res.json(tracking);
    });
}

exports.create_tracking = function(req, res){
    const new_tracking = new Tracking(req.body);
    new_tracking.save((err, tracking)=>{
        if(err)
            res.send(err);
        res.json(tracking);
    });
}

exports.read_tracking = function(req, res){
    Tracking.findById(req.params.trackingId, (err, tracking)=>{
        if (err)
            res.send(err);
        res.json(tracking);
    });
}

exports.update_tracking = function(req, res){
    Tracking.findOneAndUpdate({_id: req.params.trackingId}, req.body, {new: true}, (err, tracking)=>{
        if (err)
            res.send(err);
        res.json(tracking);
    });
}

exports.delete_tracking = function(req, res){
    Tracking.remove({
        _id: req.params.trackingId
    }, function(err, tracking){
        if (err)
            res.send(err);
        res.json({message: "Tracking successfully deleted."});
    });
}