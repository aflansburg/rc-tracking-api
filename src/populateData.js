const tracking = require('./data/sample_tracking.json').tracking;
const getShipmentData = require('./shipmentData').getShipmentData;
const getTracking = require('./fedexBatchTracking').fedexBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');
const trackingMdl = require('../api/models/trackingModel');
const orderShipmentCtrl  = require('../api/controllers/orderShipmentController');
const orderShipmentMdl = require('../api/models/orderShipmentModel')
const flatten = require('array-flatten');

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
                        dateConstraint.setDate(dateConstraint.getDate()-3);
                        orderShipmentCtrl.retrieve_records({"DocDate": {$gte: dateConstraint}})
                            .then(o=>{
                                const tracking = o.map(i=>{
                                    if (i !== undefined && i.U_PackTracking !== undefined){
                                        return i.U_PackTracking;
                                    }
                                });
                                getTracking(tracking)
                                    .then(data=>{
                                        if (!Array.isArray(data)){
                                            return {
                                                error: 'invalid data returned',
                                            }
                                        }
                                        data = flatten(data);
                                        data = data.filter(d=> d !== undefined);
                                        // should work with all carriers? Maybe? Maybe Not??? need to ensure o is array (should be???)
                                        let completeData = data.map(d=>{
                                            let record = {
                                                trackingNum: d.trackingNum,
                                                lastStatus: d.lastStatus,
                                                lastStatusDate: d.lastStatusDate,
                                                lastLocation: d.lastLocation,
                                                actualShipDate: d.actualShipDate,
                                                reason: d.reason,
                                                orderNum: '',
                                            }
                                            o.forEach(t=>{
                                                if (String(d.trackingNum) === String(t.U_PackTracking)){
                                                    record.orderNum = t.SalesOrderNum;
                                                    record.shipDate = t.DocDate;
                                                }
                                            })
                                            return record;
                                        })

                                        trackingCtrl.update_many(completeData);
                                    })
                                    .catch(err=>{
                                        console.log(`Error retrieving tracking using getTracking(tracking) method:\n\tError details: ${err}`);
                                    });
                            })
                            .catch(err=>{
                                console.log(`Error retrieving records from orderShipment collection using .retrieve_records:\n\tError details:${err}`);
                            })
                        })
                    })
                    .catch(err=>{
                        console.log('this error caused by existing key in db');
                    })
        .catch(err =>{console.log(`Error with getShipmentData method:\n\t${err}`);})
}

module.exports = {
    loadData,
}