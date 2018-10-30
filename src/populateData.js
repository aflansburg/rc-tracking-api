const getShipmentData = require('./shipmentData').getShipmentData;
const getFedexTracking = require('./fedexBatchTracking').fedexBatchTrack;
const getUspsTracking = require('./uspsBatchTracking').uspsBatchTrack;
const getUpsTracking = require('./upsBatchTracking').upsBatchTrack;
const getOntracTracking =  require('./ontracBatchTracking').ontrackBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');
const orderShipmentCtrl  = require('../api/controllers/orderShipmentController');
const flatten = require('array-flatten');

function loadData (ip) {
    getShipmentData(ip)
        .then(data=>{
            orderShipmentCtrl
                .update_many(data)
                    .then(()=>{
                        let dateConstraint = new Date();
                        // date constraint has to be > 1 or no data will be returned
                        dateConstraint.setDate(dateConstraint.getDate()-10);
                        orderShipmentCtrl.retrieve_records({"ActDelDate": {$gte: dateConstraint}})
                            .then(o=>{

                                // hash table (mutable)
                                const arrayToObject = (accum, item) => {
                                    accum[item.U_PackTracking] = { ...item };
                                    return accum;
                                }
                                const sapDataArr = o.reduce(arrayToObject, {});

                                let tracking = o.map(i=>{
                                    if(i.U_PackTracking)
                                        return i.U_PackTracking
                                });
                                trackingCtrl.get_all()
                                    .then(res => {
                                        let allTracked = res.map(r => r.trackingNum);
                                        trackingCtrl.read_tracking(tracking)
                                    .then(res => {
                                        // build array of everything not marked "delivered"
                                        let filteredTracking = res.map(r => r.trackingNum);
                                        tracking.forEach(t=>{
                                            if(!allTracked.includes(t)){
                                                filteredTracking.push(t);
                                            }
                                        })
                                        getFedexTracking(filteredTracking)
                                            .then(data=>{
                                                if (!Array.isArray(data)){
                                                    return {
                                                        error: 'invalid data returned',
                                                    }
                                                }
                                                data = flatten(data);
                                                data = data.filter(d=> d !== undefined);
                                                let fedexData = [];
                                                for (let i=0; i<data.length; i++){
                                                    let record = {};
                                                    if (data[i].reason){
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: data[i].reason,
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    else {
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: 'No data at this time',
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    fedexData.push(record);
                                                }
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
                                        getUspsTracking(filteredTracking)
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

                                                console.log('\nAll usps requests returned, processing results: \n');
                                                for (let i=0; i<data.length; i++){
                                                    let record = {};
                                                    if (data[i].reason){
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: data[i].reason,
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    else {
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: 'No data at this time',
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    uspsData.push(record);
                                                }
                                                uspsData = uspsData.filter((u, index, self)=>{
                                                    return index === self.findIndex((t) =>{
                                                        return t.trackingNum === u.trackingNum;
                                                    })
                                                });
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
                                        getUpsTracking(filteredTracking)
                                        .then(data=>{
                                            let upsData = [];
                                            if (!Array.isArray(data)){
                                                return {
                                                    error: 'invalid data returned',
                                                }
                                            }
                                            data = flatten(data);
                                            data = data.filter(d=> d !== undefined);
                                            data = data.filter(d=> d !== null);

                                            for (let i=0; i<data.length; i++){
                                                let record = {};
                                                if (data[i].reason){
                                                    record = {
                                                        trackingNum: data[i].id,
                                                        lastStatus: data[i].reason,
                                                        reason: data[i].reason,
                                                        orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                        warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                        shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                    }
                                                }
                                                else {
                                                    record = {
                                                        trackingNum: data[i].id,
                                                        lastStatus: 'No data at this time',
                                                        reason: data[i].reason,
                                                        orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                        warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                        shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                    }
                                                }
                                                upsData.push(record);
                                            }
                                            // this should get rid of any duplicates in the uspsData array
                                            upsData = upsData.filter((u, index, self)=>{
                                                return index === self.findIndex((t) =>{
                                                    return t.trackingNum === u.trackingNum;
                                                });
                                            });
                                            // update trackings collection after usps completes
                                            trackingCtrl.update_many1(upsData)
                                                .then(()=>{
                                                })
                                                .catch (err=>{
                                                    console.log(`error writing during update_many:\n\t${err}`);
                                                });
                                                console.log('\nAll UPS requests completed');
                                        })
                                        .catch(err=>{
                                            console.log(`Some error in getUspsTracking in populateData:\n\t${err}`)
                                        });
                                        getOntracTracking(filteredTracking)
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
                                                console.log('\nAll ontrac requests returned, processing results: \n');
                                                for (let i=0; i<data.length; i++){
                                                    let record = {};
                                                    if (data[i].reason){
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: data[i].lastStatus,
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    else {
                                                        record = {
                                                            trackingNum: data[i].id,
                                                            lastStatus: 'No data at this time',
                                                            reason: data[i].reason,
                                                            orderNum: sapDataArr[data[i].id]._doc.SalesOrderNum,
                                                            warehouse: sapDataArr[data[i].id]._doc.WhsCode,
                                                            shipmentCreated: sapDataArr[data[i].id]._doc.ActDelDate,
                                                        }
                                                    }
                                                    ontracData.push(record);
                                                }
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