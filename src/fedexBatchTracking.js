// const TRACK_PATH = "http://fedex.com/ws/track/v14";

const soap = require("soap");
const fs = require("fs");
const wsdl = "https://s3-us-west-2.amazonaws.com/abeapps/TrackService_v14.wsdl";
const credentials = require('./data/credentials.json');

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

const makeRequestPromise = (req) => {
    return new Promise((resolve, reject) =>{
        soap.createClientAsync(wsdl , {namespaceArrayElements: true})
            .then((client) => {
                return client.trackAsync(req);
            })
            .then((result) => {
                /* Unexpected behavior:
                result with async method returns an array that contains JSON [0] and the SOAP XML
                */
                const results = result[0].CompletedTrackDetails;
                const trckData = (results ? results.map(t=>{
                    return {
                        trackingNum: t.TrackDetails[0].TrackingNumber,
                        ...(t.TrackDetails[0].StatusDetail
                            ? {
                                lastStatus: t.TrackDetails[0].StatusDetail.Description,
                                lastStatusDate: t.TrackDetails[0].StatusDetail.CreationTime,
                                lastLocation: t.TrackDetails[0].StatusDetail.Location,
                                shipDate: t.TrackDetails[0].DatesOrTimes.filter(obj=>{
                                    return obj.Type === "SHIP"
                                })[0].DateOrTimestamp,
                            }
                            : {status: 'No status'})
                    }
                }) : null);
                trckData
                    ? resolve(trckData)
                    : reject(trckData)
                return;
            });
    });
}

async function fedexBatchTrack(trackingNumbers){

    // TO DO: type check parameter here Array.isArray() ?

    const tracking = trackingNumbers.length > 30 
                    ? chunkArray(trackingNumbers, 30)
                    : trackingNumbers;

    let promiseArray = [];

    // type checking line 26 will assure 'tracking' is an Array
    if (Array.isArray(tracking[1])){
        console.log(`There will be ${tracking.length} calls to the Fedex Tracking API.`)
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
