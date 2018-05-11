# fedex-rest-api

This project consists of functionality to make requests and consume responses from Fedex Web Services (SOAP API) while offering a RESTful API that exposes an endpoint for returning data from a MongoDB where the aforementioned Fedex responses are stored. CRUD operations supported.

The expected flow of this project:

* Service makes requests to Fedex SOAP API with tracking numbers
* SOAP API returns response
* Response is written to MongoDB
* RESTful API accepts "GET" requests and responds with information from the MongoDB

The original idea was to make a request to the RESTful API and then have the service make the request to the Fedex SOAP API, but this requires storing a potentially large amount of information in memory until all processes complete.

Current dev environment consists of:

* MongoDB 3.6
* Node 8.11.1 (LTS)