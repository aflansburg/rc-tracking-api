const soap = require("soap");
const Bottleneck = require('bottleneck');
const wsdl = "https://s3-us-west-2.amazonaws.com/abeapps/TrackService_v14.wsdl";
const credentials = require('./data/credentials.json');
const fs = require('fs');

const limiter = new Bottleneck({minTime: 1500});
// limiter debugging messages
// limiter.on('debug', function (message, data) {
//     console.log(message);
// })

const auth = {
    key: credentials.webSvcProduction.key,
    password: credentials.webSvcProduction.secret,
    accountNum: credentials.webSvcProduction.acctNum,
    meterNum: credentials.webSvcProduction.meterNum,
    testUrl: credentials.webSvcProduction.url,
}

const chunkArray = (arr, chunk_size) => {
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

const makeRequestPromise = (req) => {
        return limiter.schedule(()=>{
            return new Promise((resolve, reject) =>{
                // createClientAsync was not playing well with the number of requests
                try {
                    soap.createClient(wsdl, {namespaceArrayElements: true}, (err, client)=>{
                        try {
                            // recursively try if error returned in result object
                            const maxRetries = 5;
                            function tryTrack(retries){
                                // console.log('--executing client.track--');
                                client.track(req, (err, result)=>{
                                    if (result === undefined || result.CompletedTrackDetails === undefined){
                                        console.log(`Undefined returned from SOAP request - will retry:\n\t${err}`);
                                        setTimeout(function(){ tryTrack(maxRetries - 1); }, 2000);
                                        return;
                                    }
                                    else {
                                        let results = result.CompletedTrackDetails;
                                        // this is a crutch, but with Fedex Prod there shouldn't be null or undefined
                                        // better validation methods needed
                                        results = results.filter(r=> r !== null);
                                        results = results.filter(r=> r !== undefined);
                                        let trckData = (results ? results.map(t=>{
                                            let shipDate = null;
                                            if (t.TrackDetails !== undefined){
                                                t.TrackDetails[0].DatesOrTimes && t.TrackDetails[0].DatesOrTimes.forEach(d=>{
                                                    if (d.Type === "SHIP"){
                                                        shipDate = d.DateOrTimestamp;
                                                    }
                                                });
                                                return {
                                                    trackingNum: t.TrackDetails[0].TrackingNumber,
                                                    ...(t.TrackDetails && t.TrackDetails[0].StatusDetail
                                                        ? {
                                                            lastStatus: t.TrackDetails[0].StatusDetail.Description
                                                                        ? t.TrackDetails[0].StatusDetail.Description
                                                                        : 'No status information',
                                                            shipDate: shipDate,
                                                            reason: t.TrackDetails[0].StatusDetail.AncillaryDetails
                                                                    ? t.TrackDetails[0].StatusDetail.AncillaryDetails[0].ReasonDescription
                                                                    : 'No exception or no reason data',
                                                        }
                                                        : t.DuplicateWaybill
                                                        ? {lastStatus: 'Duplicate waybills found'}
                                                        : {lastStatus: 'No status information'})
                                                }
                                            }
                                            else {
                                                return null;
                                            }
                                        }) : null);
                                        trckData = trckData.filter(td=> td !== undefined);
                                        trckData = trckData.filter(td=> td !== null);
                                        trckData
                                            ? resolve(trckData)
                                            : reject(trckData) // <-- this needs to be remediated
                                    }
                                })
                            }
                            tryTrack(maxRetries);
                        }
                        catch (err){
                            console.log(`Error making request to Fedex SOAP API:\n${err}`)
                        }
                        
                    })
                }
                catch (e){
                    console.log(`Error creating SOAP Client:\n\t Error Details: ${e}`)
                }
            });
        })
        .then((trackingData)=> {
            return trackingData;
        })
}

async function fedexBatchTrack(trackingNumbers){
    trackingNumbers = trackingNumbers.filter(number => number.startsWith('4'));
    trackingNumbers = trackingNumbers.map(number =>{return Number(number)});
    const tracking = trackingNumbers.length > 30 
                    ? chunkArray(trackingNumbers, 30)
                    : trackingNumbers;
    let promiseArray = [];

    if (Array.isArray(tracking[1])){
        console.log(`There will be ${tracking.length+1} calls to the Fedex Tracking API.`)
        tracking.forEach(batch =>{
            const selDetails = batch.map(trckNo => {
                return {
                    PackageIdentifier: {
                        Type: "TRACKING_NUMBER_OR_DOORTAG",
                        Value: trckNo,
                    }
                }
            });
            const request = {
                WebAuthenticationDetail: {
                    UserCredential: {
                        Key: auth.key,
                        Password: auth.password,
                    },
                },
                ClientDetail: {
                    AccountNumber: auth.accountNum,
                    MeterNumber: auth.meterNum,
                },
                Version: {
                    ServiceId: "trck",
                    Major: "14",
                    Intermediate: "0",
                    Minor: "0",
                },
                SelectionDetails: selDetails,
            }
            promiseArray.push(makeRequestPromise(request));
        })
    }
    else {
        console.log(`There will be 1 call to the Fedex Tracking API.`);

        const selDetails = tracking.map(trckNo => {
            return {
                PackageIdentifier: {
                    Type: "TRACKING_NUMBER_OR_DOORTAG",
                    Value: trckNo,
                }
            }});

        const request = {
            WebAuthenticationDetail: {
                UserCredential: {
                    Key: auth.key,
                    Password: auth.password,
                },
            },
            ClientDetail: {
                AccountNumber: auth.accountNum,
                MeterNumber: auth.meterNum,
            },
            Version: {
                ServiceId: "trck",
                Major: "14",
                Intermediate: "0",
                Minor: "0",
            },
            SelectionDetails: selDetails,
        }
        promiseArray.push(makeRequestPromise(request));
    }
    return await Promise.all(promiseArray);
}

module.exports = {
    fedexBatchTrack,
}
