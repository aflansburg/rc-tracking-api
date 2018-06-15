// const TRACK_PATH = "http://fedex.com/ws/track/v14";

const soap = require("soap");
// const Throttle = require('promise-parallel-throttle');
const Bottleneck = require('bottleneck');
const fs = require("fs");
const wsdl = "https://s3-us-west-2.amazonaws.com/abeapps/TrackService_v14.wsdl";
const credentials = require('./data/credentials.json');
const pd = require('pretty-data').pd;

const limiter = new Bottleneck({minTime: 555});

const auth = {
    key: credentials.webSvcSandbox.key,
    password: credentials.webSvcSandbox.secret,
    accountNum: credentials.webSvcSandbox.acctNum,
    meterNum: credentials.webSvcSandbox.meterNum,
    testUrl: credentials.webSvcSandbox.url,
}

const chunkArray = (arr, chunk_size) => {
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

// need to throttle each of these
const makeRequestPromise = (req) => {
        return new Promise((resolve, reject) =>{
            // createClientAsync was not playing well with the number of requests
            soap.createClient(wsdl, {namespaceArrayElements: true}, (err, client)=>{
                client.track(req, (err, result)=>{
                    const results = result.CompletedTrackDetails;
                    // GET THE REASON CODE
                    const trckData = (results ? results.map(t=>{
                        let shipDate = null;
                        t.TrackDetails[0].DatesOrTimes && t.TrackDetails[0].DatesOrTimes.forEach(d=>{
                            if (d.Type === "SHIP")
                                shipDate = d.DateOrTimestamp;
                        });
                        return {
                            trackingNum: t.TrackDetails[0].TrackingNumber,
                            ...(t.TrackDetails && t.TrackDetails[0].StatusDetail
                                ? {
                                    lastStatus: t.TrackDetails[0].StatusDetail.Description,
                                    lastStatusDate: t.TrackDetails[0].StatusDetail.CreationTime,
                                    lastLocation: t.TrackDetails[0].StatusDetail.Location,
                                    shipDate: shipDate,
                                    reason: t.TrackDetails[0].StatusDetail.AncillaryDetails
                                            ? t.TrackDetails[0].StatusDetail.AncillaryDetails[0].ReasonDescription
                                            : 'No exception or no reason data',
                                }
                                : {status: 'No status'})
                        }
                    }) : null);
                    trckData
                        ? resolve(trckData)
                        : reject(trckData)
                })
            })
        });
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
