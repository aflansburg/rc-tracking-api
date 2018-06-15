const scheduler = require('node-schedule');
const data = require('./populateData');
const purgeMongoData = '';

exports.scheduleJob = () => {
    let rule = new scheduler.RecurrenceRule();
    rule.minute = 5;
    scheduler.scheduleJob(rule, data.loadData());
}