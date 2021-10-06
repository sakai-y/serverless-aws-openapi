import Serverless from 'serverless';
import { lambdaHttpEventsFrom } from '../openapi';
import ServerlessAwsOpenapi from '../index';
import { cloneDeep } from 'lodash';

jest.mock('../openapi');

describe('ServerlessAwsOpenapi', () => {
  const mockServerless = {
    service: {
      functions: {},
      custom: {
        openapi: {
          spec: 'dummy.yml',
          validate: true,
        },
      },
    },
    cli: {
      log: jest.fn(),
    },
  } as any as Serverless;

  const target = new ServerlessAwsOpenapi(mockServerless);

  const mockLambdaHttpEventsFrom = lambdaHttpEventsFrom as jest.MockedFunction<typeof lambdaHttpEventsFrom>;

  beforeEach(() => {
    mockServerless.service.functions = {};
    mockServerless.service.custom.openapi.validate = true;
    mockLambdaHttpEventsFrom.mockClear();
  });

  test('sets function http events', async () => {
    mockServerless.service.functions['getUser'] = {
      handler: 'get-user',
      events: [],
    };
    mockServerless.service.functions['updateUser'] = {
      handler: 'update-user',
      events: [],
    };

    const lambdaHttpEvents: ReturnType<typeof lambdaHttpEventsFrom> = {
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
            request: {
              schemas: {
                'application/json': {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                },
                'text/plain': {
                  type: 'string',
                },
              },
            },
          },
        },
      ],
    };
    mockLambdaHttpEventsFrom.mockReturnValue(lambdaHttpEvents);

    const expected = {
      getUser: {
        handler: 'get-user',
        events: cloneDeep(lambdaHttpEvents.getUser),
      },
      updateUser: {
        handler: 'update-user',
        events: [{ ...cloneDeep(lambdaHttpEvents.updateUser[0]) }],
      },
    };
    (expected.updateUser.events[0].http.request as any).schema = cloneDeep(
      lambdaHttpEvents.updateUser[0].http.request?.schemas
    );

    await target.applyApiSpec();

    expect(mockServerless.service.functions).toEqual(expected);
  });

  test('sets request schema $default when method has only one media', async () => {
    mockServerless.service.functions['updateUser'] = {
      handler: 'update-user',
      events: [],
    };
    const lambdaHttpEvents: ReturnType<typeof lambdaHttpEventsFrom> = {
      updateUser: [
        {
          http: {
            path: '/user',
            method: 'post',
            request: {
              schemas: {
                'application/json': {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      ],
    };
    mockLambdaHttpEventsFrom.mockReturnValue(lambdaHttpEvents);

    const expected = {
      updateUser: {
        handler: 'update-user',
        events: [
          {
            http: {
              path: '/user',
              method: 'post',
              request: {
                schemas: {
                  $default: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
                schema: {
                  $default: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    };

    await target.applyApiSpec();

    expect(mockServerless.service.functions).toEqual(expected);
  });

  test('do not set request when validate is not true', async () => {
    mockServerless.service.custom.openapi.validate = undefined;
    mockServerless.service.functions['updateUser'] = {
      handler: 'update-user',
      events: [],
    };
    const lambdaHttpEvents: ReturnType<typeof lambdaHttpEventsFrom> = {
      updateUser: [
        {
          http: {
            path: '/user',
            method: 'post',
            request: {
              schemas: {
                'application/json': {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      ],
    };
    mockLambdaHttpEventsFrom.mockReturnValue(lambdaHttpEvents);

    const expected = {
      updateUser: {
        handler: 'update-user',
        events: [
          {
            http: {
              path: '/user',
              method: 'post',
            },
          },
        ],
      },
    };

    await target.applyApiSpec();

    expect(mockServerless.service.functions).toEqual(expected);
  });
});
