const tracking = require('./data/sample_tracking.json').tracking;
const getShipmentData = require('./shipmentData').getShipmentData;
const getTracking = require('./fedexBatchTracking').fedexBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');
const trackingMdl = require('../api/models/trackingModel');
const orderShipmentCtrl  = require('../api/controllers/orderShipmentController');
const orderShipmentMdl = require('../api/models/orderShipmentModel')


function loadData () {
    
    // this should be in the nightly job (need to check if it exists)
    // orderShipmentMdl.collection.drop();
    // trackingMdl.collection.drop();

    // this should be in the nightly job - it takes a long time to run due to large # of records
    getShipmentData()
        .then(data=>{
            orderShipmentCtrl
                .update_many(data)
                    .then(()=>{
                        let dateConstraint = new Date();
                        dateConstraint.setDate(dateConstraint.getDate()-2);
                        orderShipmentCtrl.retrieve_records({"DocDate": {$gte: dateConstraint}})
                            .then(o=>{
                                const tracking = o.map(i=>{
                                    if (i !== undefined && i.U_PackTracking !== undefined){
                                        return i.U_PackTracking;
                                    }
                                });
                                getTracking(tracking)
                                    .then(data=>{
                                        const _isFlat = false;
                
                                        if (!Array.isArray){
                                            return {
                                                error: 'invalid data returned',
                                            }
                                        }
                                        data.length > 1 && Array.isArray(data[1])
                                            ? _isflat = false
                                            : _isflat = true
                
                                            data.forEach(chunk =>{
                                                chunk &&
                                                trackingCtrl.create_many(chunk);
                                            })
                                    })
                                    .catch(err=>{
                                        console.log(err);
                                    });
                            })
                            .catch(err=>{
                                console.log(err);
                            })
                        })
                    })
                    .catch(err=>{
                        console.log('this error caused by existing key in db');
                    })
        .catch(err =>{console.log(err);})
}

module.exports = {
    loadData,
}