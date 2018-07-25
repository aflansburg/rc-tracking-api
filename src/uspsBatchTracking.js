const credentials = require('./data/credentials.json').uspsCredentials;
const request = require('request-promise-native');
const endpoint = 'https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=';
const parseResponse = require('xml2js').parseString;
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({minTime: 1750});
// limiter.on('debug', (message, data)=>{
//     console.log(message);
// })

const maxTracking = 10;

// const requestStart = `<TrackRequest USERID="${credentials.user}">`;
const requestStart = `<TrackFieldRequest USERID="${credentials.user}">`;

// refactor this and store in a utils.js
const chunkArray = (arr, chunk_size) =>{
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

// * TODO * Need to implement the same tryTrack() recursive func from fedexBatchTracking
async function uspsBatchTrack(trackingNumbers){
    trackingNumbers = trackingNumbers.filter(num => num.startsWith('9'));
    trackingNumbers = trackingNumbers.filter(num => num !== null)
    let promiseArray = [];
    const tracking = trackingNumbers.length > maxTracking
                     ? chunkArray(trackingNumbers, maxTracking)
                     : trackingNumbers;
    if (tracking && Array.isArray(tracking[0])){
        console.log(`There will be ${tracking.length+1} calls to the USPS Tracking API`);
        tracking.forEach(batch=>{
            promiseArray.push(getUspsTracking(batch));
        })
    }
    else {
        tracking &&
            promiseArray.push(getUspsTracking(tracking));
    }
    return await Promise.all(promiseArray);
}

const getUspsTracking = (trackingNumbers) => {
    return limiter.schedule(()=>{
        return new Promise((resolve, reject)=>{
            try {
                // recursively retry if error returned in result
                const maxRetries = 5;
                function tryTrack(retries){
                    // console.log(`--executing client.track--`);
                    let requestBody = `${requestStart}`;
                    // logic here for multiple tracking numbers to build request body
                    Array.isArray(trackingNumbers)
                    ? trackingNumbers.forEach(tn=>{
                        requestBody += `<TrackID ID="${tn}"></TrackID>`
                    })
                    : requestBody += `<TrackID ID="${trackingNumbers}"></TrackID>`
                    requestBody += '</TrackFieldRequest>';
                    request.get({
                        uri: endpoint + requestBody,
                        forever: true,
                    })
                        .then(response=>{
                            parseResponse(response, (err, res)=>{
                                let tres = {}
                                let trackInfo = [];
                                if(err)
                                    console.log(err);
                                else {
                                    if (res.TrackResponse.TrackInfo !== undefined){
                                        res.TrackResponse.TrackInfo.forEach(tr=>{
                                            let shipData = {}
                                            if(tr.TrackSummary){
                                                shipData = {
                                                    id: tr['$'].ID,
                                                    lastStatus: tr.TrackSummary[0].Event[0],
                                                    reason: tr.TrackSummary[0].Event[0],
                                                }
                                                if (tr.TrackSummary && tr.TrackSummary[0].Event[0] === "Shipping Label Created, USPS Awaiting Item"){
                                                    shipData.shipDate = tr.TrackSummary[0].EventDate[0];
                                                }
                                                trackInfo.push(shipData);
                                            }
                                            else if (tr.TrackSummary === undefined || !tr.TrackSummary){
                                               resolve();
                                            }
                                        })
                                        trackInfo
                                            ? resolve(trackInfo)
                                            : reject(trackInfo)
                                    }
                                    else {
                                        console.log(JSON.stringify(res))
                                    }                                    
                                }
                            })
                        })
                        .catch(err=>{
                            console.log(err);
                        });
                    }
                    tryTrack(maxRetries);
                }
            catch(e) {
                console.log(`Error during request: \n${e}`);
            }
        })
    })
}

module.exports = {
    uspsBatchTrack
}



