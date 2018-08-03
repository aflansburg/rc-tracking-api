# rc-tracking-api

This API aggregates data from the FedEx Web Services (SOAP), USPS, and OnTrac APIs and exposes it via a RESTful API.

The flow of this application:

* A query is made to SAP for order data from a specific time range and stored in the 'ordershipments' collection in MongoDb
* App makes requests to Fedex SOAP, USPS, and OnTrac APIs with tracking numbers
* APIs returns response which is parsed, aggregated, and then stored in the 'trackings' collection in MongoDb
* RESTful API accepts "GET" requests and responds with information from the MongoDB

Side operations:
* An hourly job is run to update order and tracking information
* A nightly job is run to prune old records from the MongoDB collections

Environment consists of:

* MongoDB 4.0
* Node 8.11.1 (LTS)

Required command line arg to set the SAP server address:

* `-s --server` Usage: ```-s=192.168.1.8```

Optional command line arg to run dataset refresh, fetch new information from carrier APIs:

* `-r`

Note that command line arguments have to be specified at run/build:

* ```npm start -- -s=192.168.1.8 -r```