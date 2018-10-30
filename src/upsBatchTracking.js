const creds = require('./data/credentials.json').upsCredentials;
const request = require('request-promise-native');
const endpoint = 'https://onlinetools.ups.com/rest/Track';
const Bottleneck = require('bottleneck');

const limiter = new Bottleneck({minTime: 1500, maxConcurrent: 3});
// limiter.on('debug', (message, data)=>{
//     console.log(message);
// })

const maxTracking = 18;

const requestObject = {
    "UPSSecurity": {
        "UsernameToken": {
            "Username": creds.Username,
            "Password": creds.Password
        },
        "ServiceAccessToken": {
            "AccessLicenseNumber": creds.Memphis.Access_Key
        }
    },
    "TrackRequest": {
        "Request": {
            "RequestOption": "1",
            "TransactionReference": {
                "CustomerContext": "RC Multi Tracking Number Test"
            }
        },
        "InquiryNumber": ""
    },
}

// refactor this and store in a utils.js
const chunkArray = (arr, chunk_size) =>{
    let results = [];
    while (arr.length){
        results.push(arr.splice(0, chunk_size))
    }
    return results;
}

// * TODO * Need to implement the same tryTrack() recursive func from fedexBatchTracking
async function upsBatchTrack(trackingNumbers){
    // filter to UPS tracking numbers
    trackingNumbers = trackingNumbers.filter(num => num.startsWith('1Z'));
    trackingNumbers = trackingNumbers.filter(num => num !== null);
    console.log(`Total UPS tracking Numbers: ${trackingNumbers.length}`);
    // scope and init an empty array for Promise.all
    let promiseArray = [];
    
    // chunk tracking numbers to 10 number arrays
    const tracking = trackingNumbers.length > maxTracking
                     ? chunkArray(trackingNumbers, maxTracking)
                     : trackingNumbers;
    
    if (tracking && Array.isArray(tracking[0])){
        tracking.forEach(batch=>{
            promiseArray.push(limiter.schedule(()=> { return getUpsTracking(batch) }));
        })
    }
    else {
        tracking &&
            promiseArray.push(limiter.schedule(()=> { return getUpsTracking(batch) }));
    }
    return await Promise.all(promiseArray);
}

async function getUpsTracking(trackingNumbers) {
    if (!Array.isArray(trackingNumbers)){
        trackingNumbers = [trackingNumbers]
    }
    return await Promise.all(trackingNumbers.map(tn => {
        return new Promise((resolve, reject) => {
            // request function - recursive if needed
            const maxRetries = 5;
            try {
                function tryTrack(retries){
                    // build request body
                    let requestBody = requestObject;
                    requestBody.TrackRequest.InquiryNumber = tn;

                    request.post({
                        uri: endpoint,
                        body: JSON.stringify(requestBody),
                        forever: true
                    }).then(res => {
                        const response = JSON.parse(res);
                        
                        let shipData = {
                            id: tn,
                            lastStatus: "No data at this time",
                            reason: "No data at this time"
                        };

                        // conditionally format shipData based on response                          

                        // if response is jacked up
                        if (response.Fault || !response){
                            if (response.Fault.detail.Errors.ErrorDetail.PrimaryErrorCode.Description 
                                === "No tracking information available"){
                                    resolve(shipData);
                            }
                            // wait two seconds and retry
                            else {
                                if (retries > 0){
                                    setTimeout(function(){ tryTrack(maxRetries - 1); }, 2250);
                                    return;
                                }
                                else {
                                    shipData.reason =  "An error occurred in the request to UPS.";
                                    resolve(shipData);
                                }
                            }            
                        }
                        else if (response.TrackResponse) {
                            // Case: Single Package Shipment
                            if (!Array.isArray(response.TrackResponse.Shipment.Package) && Array.isArray(response.TrackResponse.Shipment.Package.Activity)){
                                shipData = {
                                    id: tn,
                                    lastStatus: response.TrackResponse.Shipment.Package.Activity[0].Status.Description,
                                    reason: response.TrackResponse.Shipment.Package.Activity[0].Status.Description,
                                }
                                resolve(shipData);
                            }
                            // multiple packages
                            else if (Array.isArray(response.TrackResponse.Shipment.Package)
                            && Array.isArray(response.TrackResponse.Shipment.Package[0].Activity)){
                                shipData = {
                                    id: tn,
                                    lastStatus: response.TrackResponse.Shipment.Package[0].Activity[0].Status.Description,
                                    reason: "Multiple Packages: " + response.TrackResponse.Shipment.Package[0].Activity[0].Status.Description,
                                };
                                resolve(shipData);
                            }
                            // unlikely scenario where single package and single activity
                            else if (response.TrackResponse.Shipment.Package.Activity && response.TrackResponse.Shipment.Package.Activity.Status){
                                shipData = {
                                    id: tn,
                                    lastStatus: response.TrackResponse.Shipment.Package.Activity.Status.Description,
                                    reason: response.TrackResponse.Shipment.Package.Activity.Status.Description,
                                }
                                resolve(shipData);
                            }
                            // catch all - return "No data at this time"
                            else {
                                resolve(shipData); // resolve when all data returns from single tracking request
                            }
                        }
                        //  catch all
                        else {
                            shipData.reason =  "An error occurred in the request to UPS.";
                            resolve(shipData);
                        }
                    })
                    .catch(err => {
                        console.log('Error returned from request, retrying.');
                        console.log('Error Details:\n' + err);
                        setTimeout(function(){ tryTrack(maxRetries - 1); }, 2250);
                    });
                }
                tryTrack();
            }
            catch (error){
                console.log('Try/Catch Block Error:\n' + error);
            }
        });
    }));
}

module.exports = {
    upsBatchTrack
}



