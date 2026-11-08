Endpoint 1: Get All Departments - retrieves the list of departments from the HospitalQ partner API.

Endpoint: GET https://hospitalq-webapp.vercel.app/api/departments

Request Headers: X-API-Key: Partner-issued API key.

Expected Result: HTTP 200 OK, with a JSON response containing the departments and their details.

Actual response: HTTP 503 Service Unavailable
{"success":false,"message":"Database is not connected. Check MongoDB Atlas Network Access (allow 0.0.0.0/0 for Vercel) and that atlas-hospita is linked to this project.","error":"DB_NOT_CONNECTED"}

The endpoint did not return the expected list of departments. Instead, it returned an error indicating that the deployed API could not connect to its database.

Status: Failed - checking for connection with the database

Retest: Get All Departments

Actual Result: HTTP 200 OK
{"success":true,"data":[{"_id":"6ad9a840ed2fc22a78edb3d8","name":"Dental","slug":"dental","description":"Dental clinic","isActive":true},{"_id":"6ad9a8407729371962982743","name":"Dental","slug":"dental","description":"Dental clinic","isActive":true},{"_id":"6ad9a840c1ae3f1e309799c6","name":"Dental","slug":"dental","description":"Dental clinic","isActive":true},{"_id":"6ad9a840ed2fc22a78edb3d2","name":"General OPD","slug":"general-opd","description":"General outpatient department","isActive":true},{"_id":"6ad9a840772937196298273b","name":"General OPD","slug":"general-opd","description":"General outpatient department","isActive":true},{"_id":"6ad9a8407729371962982740","name":"Pediatrics","slug":"pediatrics","description":"Children and infant care","isActive":true},{"_id":"6ad9a840ed2fc22a78edb3d5","name":"Pediatrics","slug":"pediatrics","description":"Children and infant care","isActive":true}]} 

Status: Successful retest after reconnecting HospitalQ's database in MongoDB.

Endpoint 2: Get General OPD Queue - retrieves the queue entries for the General OPD department from the HospitalQ partner API.

Endpoint: GET https://hospitalq-webapp.vercel.app/api/queue/general-opd

Request Headers: X-API-Key: Partner-issued API key.

Expected Result: HTTP 200 OK, with a JSON response containing the queue entries.

Actual Result: HTTP 200 OK
{ "success": true, "data": []}
The endpoint returned the expected successful response structure. However, the data array was empty, meaning no queue entries were returned.

Status: Successful

Endpoint 3: Get General OPD Queue Statistics - retrieves queue statistics for the General OPD department.

Endpoint: GET https://hospitalq-webapp.vercel.app/api/queue/general-opd/stats

Request Headers: X-API-Key: Partner-issued API key (value omitted for security)

Expected Result: HTTP 200 OK, with queue statistics in the JSON response.

Actual Result: HTTP 200 OK
{"success":true,"data":{"total":0,"waiting":0,"done":0,"inProgress":0,"noShow":0,"walkOuts":0,"avgWaitMinutes":10,"predictedWaitMinutes":0}}
All queue counts are zero, consistent with the empty queue returned by the previous endpoint. The API reports an average wait time of 10 minutes and a predicted wait time of 0 minutes.

Status: Successful

Endpoint 4: Staff Login - authenticates a staff member and obtain a token for accessing protected API endpoints.

Endpoint: POST https://hospitalq-webapp.vercel.app/api/auth/login

Request Headers:
X-API-Key: Partner-issued API key
Content-Type: application/json

Request Body:
{"email": "reception@hospitalq.com", "password": "[test password omitted]"}

Expected Result: HTTP 200 OK, with a success message, authentication token, and user details.

Actual Result: HTTP 200 OK
{"success":true,"data":{"token":"REDACTED","user":{"_id":"6ad9a840ed2fc22a78edb3dc","name":"Reception Desk","email":"reception@hospitalq.com","role":"receptionist","department":null}},"message":"Login successful"}

Status: Successful

Endpoint 5: Analytics Overview - retrieves queue analytics for the HospitalQ departments.

Endpoint: GET https://hospitalq-webapp.vercel.app/api/analytics/overview

Request Headers:
X-API-Key: Partner-issued API key 
Authorization: Bearer token obtained from the login endpoint

Expected Result: HTTP 200 OK, with department-level statistics and overall queue totals.

Actual Result: HTTP 200 OK
{"success":true,"data":{"departments":[{"departmentId":"6ad9a840ed2fc22a78edb3d8","name":"Dental","slug":"dental","waiting":1,"avgConsultMinutes":10,"predictedWaitMinutes":10,"busy":false},{"departmentId":"6ad9a8407729371962982743","name":"Dental","slug":"dental","waiting":0,"avgConsultMinutes":10,"predictedWaitMinutes":0,"busy":false},{"departmentId":"6ad9a840c1ae3f1e309799c6","name":"Dental","slug":"dental","waiting":0,"avgConsultMinutes":10,"predictedWaitMinutes":0,"busy":false},{"departmentId":"6ad9a840ed2fc22a78edb3d2","name":"General OPD","slug":"general-opd","waiting":0,"avgConsultMinutes":10,"predictedWaitMinutes":0,"busy":false},{"departmentId":"6ad9a840772937196298273b","name":"General OPD","slug":"general-opd","waiting":0,"avgConsultMinutes":10,"predictedWaitMinutes":0,"busy":false},{"departmentId":"6ad9a8407729371962982740","name":"Pediatrics","slug":"pediatrics","waiting":0,"avgConsultMinutes":1,"predictedWaitMinutes":0,"busy":false},{"departmentId":"6ad9a840ed2fc22a78edb3d5","name":"Pediatrics","slug":"pediatrics","waiting":0,"avgConsultMinutes":10,"predictedWaitMinutes":0,"busy":false}],"totals":{"waiting":1,"done":1}}}

Status: Successful

Endpoint 6: Add a Patient to the Queue - registers a patient in a department queue.

Endpoint: POST https://hospitalq-webapp.vercel.app/api/queue

Request Headers:
X-API-Key: Partner-issued API key
Authorization: Bearer token obtained from the login endpoint
Content-Type: application/json

Request Body:
{"patientName": "Integration Test Patient", "department":"6ad9a840ed2fc22a78edb3d2",
"priority": "normal"}

Expected Result: HTTP 201 Created, with the new queue entry's details.

Actual Result: HTTP 201 Created
{"success":true,"data":{"_id":"6ae24b504026a852ef863cf3","ticketNumber":1,"patientName":"Integration Test Patient","patientPhone":"","status":"waiting","priority":"normal","department":{"_id":"6ad9a840ed2fc22a78edb3d2","name":"General OPD","slug":"general-opd"},"createdAt":"2026-10-28T19:21:52.112Z","calledAt":null},"message":"Patient added to queue"}

Verification: Retrieve General OPD Queue After Check-in - verifies that the patient created through POST /api/queue appears in the queue.

Endpoint: GET https://hospitalq-webapp.vercel.app/api/queue/general-opd
The created entry was retrieved successfully with matching details. This confirms that the queue creation and retrieval operations work together.

Status: Successful verification.
