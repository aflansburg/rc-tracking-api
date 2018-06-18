const sql = require('mssql');
const config = {
    user: 'rcapi',
    password: 'RC@p1u$3r!',
    server: 'horp-serv5.horpgroup.local',
    database: 'RC_Live_Build',
    pool: {
       idleTimeoutMillis: 10000,
    }
}

const sqlQuery = 'SELECT  [U_PackTracking],[DocDate],[SalesOrderNum],[PackageNum]FROM [RC_Live_build].[dbo].[TrackingNumberStatus]WHERE [DocDate] >= DATEADD(day, -3, GETDATE())';

async function getShipmentData () {
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