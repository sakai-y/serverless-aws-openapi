export const EXT_PROP_LAMBDA = 'x-serverless-lambda';

export interface LambdaSpec {
  [EXT_PROP_LAMBDA]?: {
    function?: string;
  };
};

export const HttpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'] as const;
export type HttpMethod = typeof HttpMethods[number];

export interface Parameter {
  name: string;
  in: string;
  required?: boolean;
};

export interface RequestBody {
  content: {
    [media: string]: {
      schema?: any;
    };
  };
  required?: boolean;
};

export interface Operation {
  lambda?: {
    name: string;
    params: {
      [key: string]: unknown;
    }
  };
  parameters?: Parameter[];
  requestBody?: RequestBody;
};

export interface ApiSpec {
  [path: string]: {
    parameters?: Parameter[];
  } & {
    [method in HttpMethod]?: Operation;
  };
};

export interface HttpEvent {
  http: {
    path: string;
    method: HttpMethod;
    [key: string]: unknown;
  }
}
