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

* MongoDB 3.6
* Node 8.11.1 (LTS)

No Open Source license has been assigned as this project is currently maintained by aflansburg@roughcountry.com and no decisions regarding licensing have been made.