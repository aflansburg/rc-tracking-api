const getShipmentData = require('./shipmentData').getShipmentData;
const getFedexTracking = require('./fedexBatchTracking').fedexBatchTrack;
const getUspsTracking = require('./uspsBatchTracking').uspsBatchTrack;
const getOntracTracking =  require('./ontracBatchTracking').ontrackBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');
const orderShipmentCtrl  = require('../api/controllers/orderShipmentController');
const flatten = require('array-flatten');
const parseUspsStatus = require('./uspsStatus').parseStatus;
const fs = require('fs');
const moment = require('moment');

function loadData (ip) {

    getShipmentData(ip)
        .then(data=>{
            orderShipmentCtrl
                .update_many(data)
                    .then(()=>{
                        let dateConstraint = new Date();
                        // date constraint has to be > 1 or no data will be returned
                        dateConstraint.setDate(dateConstraint.getDate()-15);
                        orderShipmentCtrl.retrieve_records({"ActDelDate": {$gte: dateConstraint}})
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
                                        let fedexData = data.map(d=>{
                                            let record = {
                                                trackingNum: d.trackingNum,
                                                lastStatus: d.lastStatus,
                                                shipDate: d.shipDate, // replacing actualShipDate
                                                reason: d.reason,
                                                orderNum: '',
                                                warehouse: '',
                                                shipmentCreated: '',
                                            }
                                            o.forEach(t=>{
                                                if (String(d.trackingNum) === String(t.U_PackTracking)){
                                                    record.orderNum = t.SalesOrderNum;
                                                    record.warehouse = t.WhsCode;
                                                    record.shipmentCreated = t.ActDelDate;
                                                }
                                            })
                                            return record;
                                        })
                                        trackingCtrl.update_many1(fedexData)
                                            .then(()=>{
                                                console.log('Tracking collection updated.');
                                            })
                                            .catch (err=>{
                                                console.log(`error writing during update_many:\n\t${err}`);
                                            });
                                        console.log('All Fedex requests completed');
                                    })
                                    .catch(err=>{
                                        console.log(`Error retrieving tracking using getTracking(tracking) method:\n\tError details: ${err}`);
                                    });
                                getUspsTracking(tracking)
                                    .then(data=>{
                                        let uspsData = [];
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
                                                // the status parser can probably be removed with usage of USPS TrackFieldRequest
                                                // let statusData = parseUspsStatus(d.reason);
                                                record = {
                                                    trackingNum: d.id,
                                                    lastStatus: d.reason,
                                                    reason: d.reason, // need to get reason only for exception ... **********
                                                    // shipDate: moment(d.shipDate, 'LL').format(),
                                                    orderNum: '',
                                                    warehouse: '',
                                                    shipmentCreated: '',
                                                }
                                            }
                                            else {
                                                record = {
                                                    trackingNum: d.id,
                                                    lastStatus: 'No data at this time',
                                                    reason: d.reason,
                                                    // shipDate: '',
                                                    orderNum: '',
                                                    warehouse: '',
                                                    shipmentCreated: '',
                                                }
                                            }
                                            o.forEach(t=>{
                                                if (String(record.trackingNum) === String(t.U_PackTracking)){
                                                    record.orderNum = t.SalesOrderNum;
                                                    record.warehouse = t.WhsCode;
                                                    record.shipmentCreated = t.ActDelDate;
                                                }
                                            })
                                            uspsData.push(record);
                                            // this should get rid of any duplicates in the uspsData array
                                            uspsData = uspsData.filter((u, index, self)=>{
                                                return index === self.findIndex((t) =>{
                                                    return t.trackingNum === u.trackingNum;
                                                })
                                            })
                                        })
                                        // update trackings collection after usps completes
                                        trackingCtrl.update_many1(uspsData)
                                            .then(()=>{
                                                console.log('Tracking collection updated.');
                                            })
                                            .catch (err=>{
                                                console.log(`error writing during update_many:\n\t${err}`);
                                            });
                                            console.log('All USPS requests completed');
                                    })
                                    .catch(err=>{
                                        console.log(`Some error in getUspsTracking in populateData:\n\t${err}`)
                                    })
                                getOntracTracking(tracking)
                                    .then(data=>{
                                        let ontracData = [];
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
                                                record = {
                                                    trackingNum: d.id,
                                                    lastStatus: d.lastStatus,
                                                    reason: d.reason,
                                                    shipDate: d.shipDate,
                                                    orderNum: '',
                                                    warehouse: '',
                                                    shipmentCreated: '',
                                                }
                                            }
                                            else {
                                                record = {
                                                    trackingNum: d.id,
                                                    lastStatus: 'No data at this time',
                                                    reason: d.reason, // check this
                                                    shipDate: d.shipDate,
                                                    orderNum: '',
                                                    warehouse: '',
                                                    shipmentCreated: '',

                                                }
                                            }
                                            o.forEach(t=>{
                                                if (String(record.trackingNum) === String(t.U_PackTracking)){
                                                    record.orderNum = t.SalesOrderNum;
                                                    record.warehouse = t.WhsCode;
                                                    record.shipmentCreated = t.ActDelDate;
                                                }
                                            })
                                            ontracData.push(record);
                                        })
                                        // update trackings collection after usps completes
                                        trackingCtrl.update_many1(ontracData)
                                            .then(()=>{
                                                console.log('Tracking collection updated.');
                                            })
                                            .catch (err=>{
                                                console.log(`error writing during update_many:\n\t${err}`);
                                            });
                                            console.log('All Ontrac requests completed');
                                    })
                                    .catch(err=>{
                                        console.log(`Error in getOntracTracking:\n${err}`);
                                    })
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