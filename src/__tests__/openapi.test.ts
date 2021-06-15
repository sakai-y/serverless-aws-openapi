import { apiSpecFrom, lambdaHttpEventsFrom } from '../openapi';

describe('apiSpecFrom', () => {
  test('retrieves ApiSpec from OpenAPI V3', async () => {
    const ret = await apiSpecFrom('./data/v3/test-api.yaml');
    expect(ret).toEqual({
      '/users/{userId}': {
        parameters: [
          {
            schema: { type: 'integer' },
            name: 'userId',
            in: 'path',
            required: true,
            description: 'Id of an existing user.'
          }
        ],
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' }
          },
          parameters: undefined,
          requestBody: undefined,
        },
      },
      '/user': {
        parameters: undefined,
        post: {
          lambda: { name: 'createUser', params: {} },
          parameters: undefined,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date' }
                  },
                  required: [ 'firstName', 'lastName', 'email', 'dateOfBirth' ]
                },
                examples: {
                  'Create User Bob Fellow': {
                    value: {
                      firstName: 'Bob',
                      lastName: 'Fellow',
                      email: 'bob.fellow@gmail.com',
                      dateOfBirth: '1996-08-24'
                    }
                  }
                }
              }
            },
            required: undefined,
          }
        }
      }
    })
  })
});

describe('lambdaHttpEventsFrom', () => {
  test('collect http events from api spec', () => {
    const apiSpec = {
      '/users/{userId}': {
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' }
          },
        },
      },
      '/user': {
        post: {
          lambda: { name: 'updateUser', params: {} },
        }
      }
    };

    const ret = lambdaHttpEventsFrom(apiSpec);

    expect(ret).toEqual({
      'getUser': [
        {
          http: {
            path: '/users/{userId}',
            method: 'get',
            authorizer: 'aws_iam'
          }
        }
      ],
      'updateUser': [
        {
          http: {
            path: '/user',
            method: 'post'
          }
        }
      ]
    })
  })
});
