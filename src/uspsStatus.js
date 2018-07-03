function parseStatus(uspsStatus){
    const re = 
        new RegExp([
            '^a shipping label has been prepared for your item at (\\d{1,2}:\\d{2} \\w{2}) on (\\w+ \\d{1,2}, \\d{4}) in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+)|',
            'your item departed our (\\w+,|\\w+ \\w+).*on (\\w+ \\d+, \\d+) at (\\d+:\\d\\d\\s\\w+)|',
            'your item arrived at our\\D+in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+).*on (\\w+ \\d+, \\d+) at (\\d+:\\d\\d\\s\\w+)|',
            'your item was delivered.*(\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+)|',
            'Your item is out for del.* on (\\w+\\s\\d+,\\s\\d+) at (\\d+:\\d+\\s\\w+) in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+)|',
            'usps was unable to deliver.*of (\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+). (.*)|',
            'we attempted.*at (\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+) (?:and|or|but|however) (.*).|',
            'The item is currently in transit to the next facility.*f (\\w+\\s\\d+,\\s\\d+)|',
            'Your item arrived.*on\\s(\\w+\\s\\d+,\\s\\d+) at (\\d+:\\d+\\s\\w+)|',
            'your item arrived at the\\s(\\w+, \\w{2}\\s\\d{5}|\\w+ \\w{2}\\s\\d{5}).*at\\s(\\d{1,2}:\\d{2}\\s\\w{2}) on (\\w+\\s\\d{1,2},\\s\\d{4})|',
            'your item.*at\\s(\\d{1,2}:\\d{2} \\w{2}) on (\\w+ \\d{1,2}, \\d{4})\\sin\\s(\\w+.*,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+)'
        ].join(''), 'i');
        // new RegExp([
        //     '^a shipping label has been prepared for your item at (\\d{1,2}:\\d{2} \\w{2}) on (\\w+ \\d{1,2}, \\d{4}) in (\\w+, \\w+ \\d+)|',
        //     'your item departed our (\\w+,|\\w+ \\w+).*on (\\w+ \\d+, \\d+) at (\\d+:\\d\\d\\s\\w+)|',
        //     'your item arrived at our\\D+in (\\w+, \\w+|\\w+ \\w+).*on (\\w+ \\d+, \\d+) at (\\d+:\\d\\d\\s\\w+)|',
        //     'your item was delivered.*(\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+)|',
        //     'Your item is out for del.* on (\\w+\\s\\d+,\\s\\d+) at (\\d+:\\d+\\s\\w+) in (\\w+,\\s\\w+\\s\\d+|\\w.*\\d{5})|',
        //     'usps was unable to deliver.*of (\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+).',
        //     ' (.*)|we attempted.*at (\\d+:\\d\\d\\s\\w+) on (\\w+ \\d+, \\d+) in (\\w+,\\s\\w+\\s\\d+|\\w+ \\s\\w+\\s\\d+) ',
        //     '(?:and|or|but|however) (.*).|The item is currently in transit to the next facility.*f (\\w+\\s\\d+,\\s\\d+)|',
        //     'Your item arrived.*on\\s(\\w+\\s\\d+,\\s\\d+) at (\\d+:\\d+\\s\\w+)|',
        //     'your item arrived at the\\s(\\w+, \\w{2}\\s\\d{5}|\\w+ \\w{2}\\s\\d{5}).*at\\s(\\d{1,2}:\\d{2}\\s\\w{2}) on (\\w+\\s\\d{1,2},\\s\\d{4})'
        // ].join(''), 'i');
    
    let matches = re.exec(uspsStatus);

    let d = {
        lastStatus: '',
        timestampStr: '',
        location: '',
    }

    // label created
    if (matches[1] && matches[3]){
        // console.log('####### MATCH META GROUP 1 ########');
        d.lastStatus = 'Label created';
        d.timestampStr = `${matches[2]} ${matches[1]}`;
        d.location = matches[3]
    }
    // departed usps facility
    else if (matches[4] && matches[6]){
        // console.log('####### MATCH META GROUP 2 ########');
        d.lastStatus = 'In Transit';
        d.timestampStr = `${matches[5]} ${matches[6]}`;
        d.location = matches[4];
    }
    // arrived at usps facility
    else if (matches[7] && matches[9]){
        // console.log('####### MATCH META GROUP 3 ########');
        d.lastStatus = 'In Transit';
        d.timestampStr = `${matches[9]} ${matches[8]}`;
        d.location = matches[7];

    }
    // delivered
    else if (matches[10] && matches[12]){
        // console.log('####### MATCH META GROUP 4 ########');
        d.lastStatus = 'Delivered';
        d.timestampStr = `${matches[11]} ${matches[10]}`;
        d.location = matches[12];
    }
    // out for delivery
    else if (matches[13] && matches[15]){
        // console.log('####### MATCH META GROUP 5 ########');
        d.lastStatus = 'Out for delivery';
        d.timestampStr = `${matches[13]} ${matches[14]}`;
        d.location = matches[15];
    }
    // exception: unable to deliver - address may be incorrect, incomplete, or illegible
    else if (matches[16] && matches[18]){
        // console.log('####### MATCH META GROUP 6 ########');
        d.lastStatus = `Exception: Incorrect/Incomplete Address - Unable to Deliver`;
        d.timestampStr = `${matches[16]} ${matches[17]}`;
        d.location = matches[18];
    }
    // notice left: receptacle full or oversized
    else if (matches[20] && matches[22]){
        // console.log('####### MATCH META GROUP 7 ########');
        d.lastStatus = `Notice Left: Receptacle full`;
        d.timestampStr = `${matches[20]} ${matches[21]}`;
        d.location = matches[22];
    }
    // in transit to next facility
    else if (matches[24]){
        // console.log('####### MATCH META GROUP 8 ########');
        d.lastStatus = 'In transit';
        d.timestampStr = matches[24];
        d.location = 'In transit';
    }
    else if (matches[25] && matches[26]) {
        d.lastStatus = 'In transit';
        d.timestampStr = `${matches[25]} ${matches[26]}`;
        d.location = 'In transit';
    }
    else if (matches[27] && matches[29]){
        d.lastStatus = 'At post office ready for pickup';
        d.timestampStr = `${matches[29]} ${matches[28]}`;
        d.location = matches[27];
    }
    console.log(d);
    return(d);
}

module.exports = {
    parseStatus
}