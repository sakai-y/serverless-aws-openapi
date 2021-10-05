import { apiSpecFrom, lambdaHttpEventsFrom, makeHttpEventRequest } from '../openapi';

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
            description: 'Id of an existing user.',
          },
        ],
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' },
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
                  title: 'example',
                  properties: {
                    id: { type: 'string' },
                  },
                },
              },
            },
            required: undefined,
          },
        },
      },
    });
  });
});

describe('lambdaHttpEventsFrom', () => {
  test('collect http events from api spec', () => {
    const apiSpec = {
      '/users/{userId}': {
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
          },
        ],
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' },
          },
        },
      },
      '/user': {
        post: {
          lambda: { name: 'updateUser', params: {} },
        },
      },
    };

    const ret = lambdaHttpEventsFrom(apiSpec);

    expect(ret).toEqual({
      getUser: [
        {
          http: {
            path: '/users/{userId}',
            method: 'get',
            authorizer: 'aws_iam',
            request: {
              parameters: {
                paths: {
                  userId: true,
                },
              },
            },
          },
        },
      ],
      updateUser: [
        {
          http: {
            path: '/user',
            method: 'post',
          },
        },
      ],
    });
  });
});

describe('makeHttpEventRequest', () => {
  test('"path" should set in "paths"', () => {
    const apiSpec = {
      '/users/{userId}': {
        parameters: [
          {
            in: 'path',
            name: 'userId',
            required: true,
          },
        ],
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' },
          },
        },
      },
    };

    const ret = makeHttpEventRequest(apiSpec['/users/{userId}'], 'get');

    expect(ret).toEqual({
      parameters: {
        paths: {
          userId: true,
        },
      },
    });
  });

  test('requestBody should set in schemas', () => {
    const apiSpec = {
      '/users': {
        post: {
          lambda: {
            name: 'createUser',
            params: {},
          },
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                    dateOfBirth: { type: 'string', format: 'date' },
                  },
                  required: ['firstName', 'lastName', 'email', 'dateOfBirth'],
                },
              },
            },
          },
        },
      },
    };

    const ret = makeHttpEventRequest(apiSpec['/users'], 'post');

    expect(ret).toEqual({
      schemas: {
        'application/json': {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            dateOfBirth: { type: 'string', format: 'date' },
          },
          required: ['firstName', 'lastName', 'email', 'dateOfBirth'],
        },
      },
    });
  });

  test('returns undefined when no parameters and no requestBody', () => {
    const apiSpec = {
      '/users': {
        get: {
          lambda: {
            name: 'getUser',
            params: { authorizer: 'aws_iam' },
          },
        },
      },
    };

    const ret = makeHttpEventRequest(apiSpec['/users'], 'get');

    expect(ret).toBeUndefined();
  });
});
