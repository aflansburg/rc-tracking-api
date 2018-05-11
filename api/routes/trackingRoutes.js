'use strict';
module.exports = function(app) {
    const tracking  = require('../controllers/trackingController');

    app.route('/tracking')
        .get(tracking.retrieve_tracking)
        .post(tracking.create_tracking);

    app.route('/tracking/:trackingId')
        .get(tracking.read_tracking)
        .put(tracking.update_tracking)
        .delete(tracking.delete_tracking);
};