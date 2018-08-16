'use strict';

const mongoose = require('mongoose');
const OrderShipment = mongoose.model('OrderShipment');

exports.retrieve_records = function(req, res){
    console.log('Request made to retrieve OrderShipment data: ' + JSON.stringify(req));
    console.log('Returning OrderShipment data');
    return OrderShipment.find(req).exec();
}

exports.create_record = function(req, res){
    console.log(res);
        const new_record = new OrderShipment(req);
        new_record.save((err, orderShipment)=>{
        return orderShipment;
    });
}

exports.create_many = function (req, res){
    return OrderShipment.insertMany(req, {ordered: false});
}

exports.read_record = function(req, res){
    OrderShipment.findById(req.U_PackTracking, (err, orderShipment)=>{
        res.json(orderShipment);
    });
}

// refactor to .add_new
exports.update_many = function(req, res){
    return new Promise((resolve, reject)=>{
        OrderShipment.find({}, (err, data)=>{
            let mongoItems = data.map(d=>{
                return {
                    U_PackTracking: d._doc.U_PackTracking,
                    ActDelDate: d._doc.ActDelDate,
                    PackageNum: Number(d._doc.PackageNum),
                    SalesOrderNum: Number(d._doc.SalesOrderNum),
                    WhsCode: d._doc.WhsCode,
                }
            })
    
            let sapItems = req;
    
            let newItems = [];
    
            sapItems.forEach(s=>{
                if(mongoItems.findIndex(i => i.U_PackTracking == s.U_PackTracking) < 0){
                    newItems.push(s);
                }
            })
            console.log(`Inserting ${newItems.length} new items from SAP.`);
            resolve(OrderShipment.insertMany(newItems, {ordered: false}));
        })
    })
}

exports.delete_record = function(req, res){
    OrderShipment.remove({
        _id: req.params.U_PackTracking
    }, function(err, orderShipment){
        res.json({message: "OrderShipment record successfully deleted."});
    });
}

exports.prune_records = function(){
    let dateConstraint = new Date();
    dateConstraint.setDate(dateConstraint.getDate()-21);
    OrderShipment.deleteMany({"ActDelDate": {$lt: dateConstraint}}, function(){
        console.log('Old order shipment records pruned.')
    });
}