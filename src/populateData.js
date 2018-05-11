const tracking = require('./data/small_sample.json').tracking;
const getTracking = require('./fedexBatchTracking').fedexBatchTrack;

getTracking(tracking)
    .then(data=>{
        // let flatData = [];
        // data.forEach(topChunk=>{
        //     topChunk.forEach(subChunk=>{
        //         flatData.push(subChunk);
        //     });
        // });
        console.log(JSON.stringify(data));
    })
    .catch(err=>{
        console.log(err);
    });

