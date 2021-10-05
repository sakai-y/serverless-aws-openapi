export const EXT_PROP_LAMBDA = 'x-serverless-lambda';

export interface LambdaSpec {
  [EXT_PROP_LAMBDA]?: {
    function?: string;
  };
};

export const HttpMethods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch'] as const;
export type HttpMethod = typeof HttpMethods[number];

export interface ParameterSpec {
  name: string;
  in: string;
  required?: boolean;
};

export interface RequestBodySpec {
  content: {
    [media: string]: {
      schema?: unknown;
    };
  };
  required?: boolean;
};

export interface OperationSpec {
  lambda?: {
    name: string;
    params: Record<string, unknown>;
  };
  parameters?: ParameterSpec[];
  requestBody?: RequestBodySpec;
};

export interface ApiSpec {
  [path: string]: {
    parameters?: ParameterSpec[];
  } & {
    [method in HttpMethod]?: OperationSpec;
  };
};

export type ApigwRequestParameters = Partial<Record<'querystrings' | 'headers' | 'paths', Record<string, boolean>>>;

export interface ApigwHttpEvent {
  http: {
    path: string;
    method: HttpMethod;
    request?: {
      parameters?: ApigwRequestParameters;
      schemas?: Record<string, unknown>;
    };
    [key: string]: unknown;
  }
}
