const getShipmentData = require('./shipmentData').getShipmentData;
const getFedexTracking = require('./fedexBatchTracking').fedexBatchTrack;
const getUspsTracking = require('./uspsBatchTracking').uspsBatchTrack;
const getOntracTracking =  require('./ontracBatchTracking').ontrackBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');
const orderShipmentCtrl  = require('../api/controllers/orderShipmentController');
const flatten = require('array-flatten');
const parseUspsStatus = require('./uspsStatus').parseStatus;

function loadData () {

    getShipmentData()
        .then(data=>{
            orderShipmentCtrl
                .update_many(data)
                    .then(()=>{
                        let dateConstraint = new Date();
                        // date constraint has to be > 1 or no data will be returned
                        dateConstraint.setDate(dateConstraint.getDate()-5);
                        orderShipmentCtrl.retrieve_records({"DocDate": {$gte: dateConstraint}})
                            .then(o=>{
                                const tracking = o.map(i=>{
                                    if (i !== undefined && i.U_PackTracking !== undefined){
                                        return i.U_PackTracking;
                                    }
                                });
                                getFedexTracking(tracking)
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
                                        // run usps after fedex
                                        getUspsTracking(tracking)
                                            .then(data=>{
                                                if (!Array.isArray(data)){
                                                    return {
                                                        error: 'invalid data returned',
                                                    }
                                                }
                                                data = flatten(data);
                                                data = data.filter(d=> d !== undefined);
                                                data = data.filter(d=> d !== null);
                                                data.forEach(d=>{
                                                    let record = {};
                                                    if (d.reason){
                                                        let statusData = parseUspsStatus(d.reason);
                                                        record = {
                                                            trackingNum: d.id,
                                                            lastStatus: statusData.lastStatus,
                                                            lastStatusDate: statusData.timestampStr,
                                                            lastLocation: statusData.location,
                                                            reason: d.reason
                                                        }
                                                    }
                                                    else {
                                                        record = {
                                                            trackingNum: d.id,
                                                            lastStatus: 'No data at this time',
                                                            reason: d.reason,
                                                        }
                                                    }
                                                    o.forEach(t=>{
                                                        if (String(record.trackingNum) === String(t.U_PackTracking)){
                                                            record.orderNum = t.SalesOrderNum;
                                                            record.shipDate = t.DocDate;
                                                        }
                                                    })
                                                    completeData.push(record);
                                                })
                                                // update trackings collection after usps completes
                                                trackingCtrl.update_many(completeData)
                                                    .then(()=>{
                                                        console.log('Tracking collection updated.');
                                                    })
                                                    .catch (err=>{
                                                        console.log(`error writing during update_many:\n\t${err}`);
                                                    });
                                            })
                                            .catch(err=>{
                                                console.log(`Some error in getUspsTracking in populateData:\n\t${err}`)
                                            })
                                        getOntracTracking(tracking)
                                            .then(data=>{
                                                if (!Array.isArray(data)){
                                                    return {
                                                        error: 'invalid data returned',
                                                    }
                                                }
                                                data = flatten(data);
                                                data = data.filter(d=> d !== undefined);
                                                data = data.filter(d=> d !== null);
                                                data.forEach(d=>{
                                                    let record = {};
                                                    if (d.reason){
                                                        // let statusData = parseUspsStatus(d.reason);
                                                        record = {
                                                            trackingNum: d.id,
                                                            lastStatus: d.lastStatus,
                                                            reason: d.reason
                                                        }
                                                    }
                                                    else {
                                                        record = {
                                                            trackingNum: d.id,
                                                            lastStatus: 'No data at this time',
                                                            reason: d.reason,
                                                        }
                                                    }
                                                    o.forEach(t=>{
                                                        if (String(record.trackingNum) === String(t.U_PackTracking)){
                                                            record.orderNum = t.SalesOrderNum;
                                                            record.shipDate = t.DocDate;
                                                        }
                                                    })
                                                    completeData.push(record);
                                                })
                                                // update trackings collection after usps completes
                                                trackingCtrl.update_many(completeData)
                                                    .then(()=>{
                                                        console.log('Tracking collection updated.');
                                                    })
                                                    .catch (err=>{
                                                        console.log(`error writing during update_many:\n\t${err}`);
                                                    });
                                            })
                                            .catch(err=>{
                                                console.log(`Error in getOntracTracking:\n${err}`);
                                            })
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