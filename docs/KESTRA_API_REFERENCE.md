https://kestra.io/docs/api-reference/open-source

- GET /api/v1/{tenant}/configs : i did not find this api 
- instead i found the one below
- GET /api/v1/configs

/api/v1/configs
Retrieve the instance configuration.
Global endpoint available to all users.

REQUEST
RESPONSE
200
getConfiguration 200 response

EXAMPLE
SCHEMA
application/json
Copy
{
"uuid": "string",
"version": "string",
"edition": "OSS",
"commitId": "string",
"chartDefaultDuration": "string",
"commitDate": "1970-01-01T00:00:00.000Z",
"isCustomDashboardsEnabled": false,
"isAnonymousUsageEnabled": false,
"isUiAnonymousUsageEnabled": false,
"isTemplateEnabled": false,
"environment": {
"name": "string",
"color": "string"
},
"url": "string",
"preview": {
"initial": 0,
"max": 0
},
"systemNamespace": "string",
"hiddenLabelsPrefixes": [
"string"
],
"isAiEnabled": false,
"isBasicAuthInitialized": false,
"pluginsHash": 0
}
----
- POST /api/v1/executions/webhook/{namespace}/{flowId}/{key}
Trigger a new execution by POST webhook trigger
REQUEST
PATH PARAMETERS
* namespace
string
The flow namespace

* id
string
The flow id

* key
string
The webhook trigger uid

* tenant
string
RESPONSE
200
On success

EXAMPLE
SCHEMA
application/json
Copy
{
"tenantId": "string",
"id": "string",
"namespace": "string",
"flowId": "string",
"flowRevision": 0,
"trigger": {
"id": "string",
"type": "string",
"variables": { },
"logFile": "http://example.com"
},
"outputs": {
"property1": { },
"property2": { },
},
"labels": [
{
"key": "A",
"value": "A"
}
],
"state": {
"duration": "string",
"startDate": "1970-01-01T00:00:00.000Z",
"endDate": "1970-01-01T00:00:00.000Z",
"current": "CREATED",
"histories": [
{
"state": "CREATED",
"date": "1970-01-01T00:00:00.000Z"
}
]
},
"url": "http://example.com"
}
----
- GET /api/v1/{tenant}/executions/{executionId}
get
/api/v1/{tenant}/executions/{executionId}
Get an execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string

GET /api/v1/{tenant}/logs/{executionId}
Get logs for a specific execution, taskrun or task
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
minLevel
enum┃null
Allowed: ERROR ┃ WARN ┃ INFO ┃ DEBUG ┃ TRACE
The min log level filter

taskRunId
string┃null
The taskrun id

taskId
string┃null
The task id

attempt
int32
The attempt number

RESPONSE
200

GET /api/v1/{tenant}/executions/{executionId}/follow
Follow an execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string


GET /api/v1/{tenant}/logs/{executionId}/follow
Follow logs for a specific execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
minLevel
enum┃null
Allowed: ERROR ┃ WARN ┃ INFO ┃ DEBUG ┃ TRACE
The min log level filter


DELETE /api/v1/{tenant}/executions/{executionId}/kill
Kill an execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
* isOnKillCascade
boolean
Default: true
Specifies whether killing the execution also kill all subflow executions.

POST /api/v1/{tenant}/executions/{executionId}/replay
Create a new execution from an old one and start it from a specified task run id
REQUEST
PATH PARAMETERS
* executionId
string
the original execution id to clone

* tenant
string
QUERY-STRING PARAMETERS
taskRunId
string┃null
The taskrun id

revision
int32
The flow revision to use for new execution

breakpoints
string┃null
Set a list of breakpoints at specific tasks 'id.value', separated by a coma.
POST /api/v1/{tenant}/executions/{executionId}/restart
Restart a new execution from an old one
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
revision
int32
The flow revision to use for new execution


GET /api/v1/{tenant}/flows/{namespace}/{id}
Get a flow
REQUEST
PATH PARAMETERS
* namespace
string
The flow namespace

* id
string
The flow id

* tenant
string
QUERY-STRING PARAMETERS
* source
boolean
Default: false
Include the source code

revision
int32
Get latest revision by default

* allowDeleted
boolean
Default: false
Get flow even if deleted
GET /api/v1/{tenant}/executions/{executionId}/file/metas
Get file meta information for an execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
* path
uri
The internal storage uri


GET /api/v1/{tenant}/executions/{executionId}/file?path={filePath}

GET /api/v1/{tenant}/executions/{executionId}/file/preview
Get file preview for an execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
* path
uri
The internal storage uri

maxRows
int32
The max row returns

* encoding
string
Default: UTF-8
The file encoding as Java charset name. Defaults to UTF-8

Examples: ISO-8859-1

GET /api/v1/{tenant}/logs/{executionId}/download
Download logs for a specific execution, taskrun or task
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
minLevel
enum┃null
Allowed: ERROR ┃ WARN ┃ INFO ┃ DEBUG ┃ TRACE
The min log level filter

taskRunId
string┃null
The taskrun id

taskId
string┃null
The task id

attempt
int32
The attempt number
GET /api/v1/{tenant}/metrics/{executionId}
Get metrics for a specific execution
REQUEST
PATH PARAMETERS
* executionId
string
The execution id

* tenant
string
QUERY-STRING PARAMETERS
* page
int32
Default: 1
Min 1
The current page

* size
int32
Default: 10
Min 1
The current page size

sort
array┃null
The sort of current page

taskRunId
string┃null
The taskrun id

taskId
string┃null
The task id
GET /api/v1/{tenant}/metrics/aggregates/{namespace}/{flowId}/{metric} i dont see these in the api reference
GET /api/v1/{tenant}/metrics/names/{namespace}/{flowId} i dont see these in the api reference
