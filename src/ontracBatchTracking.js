const request = require('request-promise-native');
const q = '%0D%0A';
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({minTime: 3000});
// limiter debugging messages
limiter.on('debug', function (message, data) {
    console.log(message);
})

const maxTracking = 15;
// at some point might try using the tracking details page endpoint (see Ontrac tracking lookup) - should provide more info
let requestString = 'https://www.ontrac.com/services/api/TrackingSummaryByTrackingNumbers/V1/?tracking=';

const chunkArray = (arr, chunk_size) =>{
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

async function ontrackBatchTrack(trackingNumbers){
    trackingNumbers = trackingNumbers.filter(num => num.startsWith('C'));
    let promiseArray = [];
    const tracking = trackingNumbers.length > maxTracking
                     ? chunkArray(trackingNumbers, maxTracking)
                     : trackingNumbers;
    if (Array.isArray(tracking[1])){
        console.log(`There will be ${tracking.length+1} calls to the Ontrac Tracking API`);
        tracking.forEach(batch=>{
            promiseArray.push(getOntracTracking(batch));
        })
    }
    else {
        promiseArray.push(getOntracTracking(tracking));
    }
    return await Promise.all(promiseArray);
}

const getOntracTracking = (trackingNumbers) => {
    return limiter.schedule(()=>{
        return new Promise((resolve, reject)=>{
            try {
                // recursively retry if error returned in result
                const maxRetries = 5;
                function tryTrack(retries){
                    console.log(`--executing client.track--`);
                    let requestBody = requestString;
                    // logic here for multiple tracking numbers to build request body
                    Array.isArray(trackingNumbers)
                    ? trackingNumbers.forEach(t=>{
                        if (trackingNumbers.indexOf(t) !== trackingNumbers.length-1){
                            requestBody += `${t}${q}`
                        }
                        else {
                            requestBody += t;
                        }
                    })
                    : requestBody += requestBody + trackingNumbers;

                    request.get({
                        uri: requestBody,
                        forever: true,
                    })
                        .then(response=>{
                            let res = JSON.parse(response);
                            let trackInfo = [];
                            if (res === undefined || !res){
                                console.log(`THIS REQUEST RETURNED NULL:\n\t${requestBody}`);
                            }
                            if (res){
                                res.forEach(tr=>{
                                    trackInfo.push({
                                        id: tr.Tracking,
                                        lastStatus: tr.StatuscodeDisplayText,
                                        reason: tr.StatuscodeDisplayText,
                                    });
                                })
                                trackInfo
                                    ? resolve(trackInfo)
                                    : reject(trackInfo)
                            }
                            else {
                                // this needs to bee remediated
                                resolve();
                            }
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
    ontrackBatchTrack
}