const sql = require('mssql');
let config = {
    user: 'rcapi',
    password: 'RC@p1u$3r!',
    // server: 'horp-serv5.horpgroup.local',
    server: '192.168.1.8',
    database: 'RC_Live_Build',
    pool: {
       idleTimeoutMillis: 10000,
    }
}

const sqlQuery = `SELECT  [U_PackTracking],[ActDelDate],[SalesOrderNum],[PackageNum],[WhsCode]FROM [RC_Live_build].[dbo].[TrackingNumberStatus]WHERE [ActDelDate] >= DATEADD(day, -7, GETDATE())`;

async function getShipmentData (ip) {
    if (ip)
        config.server = ip;
    const pool = new sql.ConnectionPool(config);
    pool.on('error', err => {
        // ... error handler 
        console.log('sql errors', err);
    });

    try {
        await pool.connect();
        let result = await pool.request().query(sqlQuery);
        return result.recordset;
    } catch (err) { 
        return err;
    } finally {
        pool.close(); //closing connection after request is finished.
    }

}

sql.on('error', err => {
    // ... error handler
})

module.exports = {
    getShipmentData
}