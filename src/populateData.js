const tracking = require('./data/small_sample.json').tracking;
const getTracking = require('./fedexBatchTracking').fedexBatchTrack;
const trackingCtrl  = require('../api/controllers/trackingController');

function loadData () {
    getTracking(tracking)
    .then(data=>{
        const _isFlat = false;

        if (!Array.isArray){
            return {
                error: 'invalid data returned',
            }
        }
        
        data.length > 1 && Array.isArray(data[1])
            ? _isflat = false
            : _isflat = true

        _isflat
            ? data[0].forEach(obj => {
                // need to put in some logic to handle duplicates either here or when getting creating the record in the DB
                trackingCtrl.create_tracking(obj);
            })
            : console.log('Data is not flat');
    })
    .catch(err=>{
        console.log(err);
    });
}

module.exports = {
    loadData,
}