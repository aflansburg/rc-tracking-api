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
        console.log('Writing new tracking information.');
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

exports.update_many = function(req, res){
    return new Promise((resolve, reject)=>{
        Tracking.find({}, (err, data)=>{
            console.log(data[0]);
            let mongoItems = data.map(d=>{
                return {
                    trackingNum: d._doc.trackingNum,
                    orderNum: d._doc.orderNum,
                    shipDate: Number(d._doc.shipDate),
                    lastStatus: Number(d._doc.lastStatus),
                    lastStatusDate: d._doc.lastStatusDate,
                    lastLocation: d._doc.lastLocation,
                    reason: d._doc.reason,
                }
            })
    
            let trackingItems = req;
    
            let newItems = [];
            let existingItems = [];
    
            trackingItems.forEach(t=>{
                if(mongoItems.findIndex(i => i.trackingNum == t.trackingNum) < 0){
                    newItems.push(t);
                }
                else {
                    existingItems.push(t);
                }
            })
            console.log(`Inserting ${newItems.length} new items with no previous tracking entries.`);
            Tracking.insertMany(newItems, {ordered: false})
            existingItems.forEach(e=>{
                Tracking.findOneAndUpdate({"trackingNum": e.trackingNum}, 
                        {
                            lastStatus: e.lastStatus, 
                            lastStatusDate: e.lastStatusDate,
                            lastLocation: e.lastLocation,
                            reason: e.reason,
                        }
                    );
            })
            resolve();
        })
    })
}

exports.delete_tracking = function(req, res){
    Tracking.remove({
        _id: req.params.trackingId
    }, function(err, tracking){
        res.json({message: "Tracking successfully deleted."});
    });
}

exports.prune_records = function(){
    let dateConstraint = new Date();
    dateConstraint.setDate(dateConstraint.getDate()-10);
    Tracking.deleteMany({"shipDate": {$lt: dateConstraint}}, function(){
        console.log('Old tracking records pruned.')
    });
}