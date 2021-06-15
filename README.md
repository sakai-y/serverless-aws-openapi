# Serverless plugin AWS OpenAPI

Appends serverless function http events from OpenAPI spec.

## Usage
### serverless.yml
Add API spec file to `serverless.yml` and define function just `handler`
```yaml
custom:
  openapi:
    spec: docs/api-spec.yaml

functions:
  UserList:
    handler: src/users.js
```

### api spec
Add `x-serverless-lambda` to path definition
```yaml
paths:
  /users:
    get:
      responses:
        200:
          description: User Found
          schema:
            $ref: '#/definitions/User'
      x-serverless-lambda:
        function: UserList
        authorizer: aws_iam
```
