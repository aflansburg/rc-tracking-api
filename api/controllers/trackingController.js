'use strict';

const mongoose = require('mongoose');
const Tracking = mongoose.model('Tracking');

exports.retrieve_tracking = function(req, res){
    let ip = req.ip;
    ip = ip[0] === ':' ? ip.substr(7): ip;
    // **LOG** info level log event
    console.log(`Request from IP ${ip} for tracking data.`);
    Tracking.find({}, (err, tracking)=>{
        res.json(tracking);
        // **LOG** info level log event
        console.log(`Response returned to IP ${ip}.`);
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
// exports.update_many = function(req, res){
//     Tracking.updateMany({_id: req.params.trackingId}, req.body, {upsert: true}, (err, tracking)=>{
//         res.json(tracking);
//     });
// }

// this will now be relevant since SAP data is being stored and updated with fedexBatchTracking response props
exports.update_many1 = function(req, res){
    return new Promise((resolve, reject)=>{
        req.forEach(record=>{
            Tracking.findOneAndUpdate({trackingNum: record.trackingNum},
                record,
                {upsert: true},
                (err, res)=>{
                    if (err){
                        console.log(err);
                        resolve();
                    }
                    else {
                        resolve();
                    }
            });
        })
    })
}

exports.update_many = function(req, res){
    return new Promise((resolve, reject)=>{
        Tracking.find({}, (err, data)=>{
            if (err)
                console.log(err);
            let mongoItems = data.map(d=>{
                return {
                    trackingNum: d.trackingNum,
                    orderNum: d.orderNum,
                    shipDate: Number(d.shipDate),
                    lastStatus: Number(d.lastStatus),
                    lastStatusDate: d.lastStatusDate,
                    lastLocation: d.lastLocation,
                    reason: d.reason,
                    warehouse: d.warehouse ? d.warehouse : '',
                    shipmentCreated: d.shipmentCreated ? d.shipmentCreated : null,
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
                .then(()=>{
                    existingItems.forEach(e=>{
                        Tracking.findOneAndUpdate({"trackingNum": e.trackingNum}, 
                                {
                                    lastStatus: e.lastStatus, 
                                    lastStatusDate: e.lastStatusDate,
                                    lastLocation: e.lastLocation,
                                    reason: e.reason,
                                    shipDate: e.shipDate,
                                },
                                (err, res)=>{
                                    // this is just here to force query to execute
                                    if (err)
                                        console.log(`findOneAndUpdate Error MongoDB:\n${err}`);
                                }
                            );
                    })
                    resolve();
                })
                .catch(err=>{
                    console.log('Insert Many failure: ' + err);
                })
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
    dateConstraint.setDate(dateConstraint.getDate()-5);
    Tracking.deleteMany({"shipDate": {$lt: dateConstraint}}, function(){
        console.log('Old tracking records pruned by shipDate.')
    });
    Tracking.deleteMany({"lastStatusDate": {$lt: dateConstraint}}, function(){
        console.log('Old tracking records pruned by lastStatusDate.')
    });
}