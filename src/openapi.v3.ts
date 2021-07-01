import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { omit } from 'lodash';
import { ApiSpec, HttpMethod, HttpMethods, OperationSpec, ParameterSpec, RequestBodySpec } from './model';

const EXT_PROP_LAMBDA = 'x-serverless-lambda';
type LambdaSpec = {
  [EXT_PROP_LAMBDA]?: {
    function?: string;
  };
};

export function isOpenAPIV3(api: OpenAPI.Document): api is OpenAPIV3.Document {
  return (api as OpenAPIV3.Document).openapi != null;
}

function parameters(parameters?: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]): ParameterSpec[] | undefined {
  return parameters?.filter((elem): elem is ParameterSpec => (elem as OpenAPIV3.ParameterObject).name != null);
}

function requestBody(requestBody?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject): RequestBodySpec | undefined {
  const isRequestBody = (
    arg?: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject
  ): arg is OpenAPIV3.RequestBodyObject => {
    return (arg as OpenAPIV3.RequestBodyObject)?.content != null;
  };

  if (isRequestBody(requestBody)) {
    return {
      content: requestBody.content,
      required: requestBody.required,
    };
  }
  return undefined;
}

function operations<T extends {} = {}>(
  path: OpenAPIV3.PathItemObject<T>
): [HttpMethod, OpenAPIV3.OperationObject<T>][] {
  return Object.keys(path)
    .filter((key): key is HttpMethod => (HttpMethods as readonly string[]).includes(key))
    .map((method) => [method, path[method]] as [HttpMethod, OpenAPIV3.OperationObject<T>]);
}

export function apiSpecFromV3(api: OpenAPIV3.Document<LambdaSpec>): ApiSpec {
  return Object.keys(api.paths).reduce((apiSpec, path) => {
    const item = api.paths[path];
    if (!item) {
      return apiSpec;
    }

    const pathSpec = {} as ApiSpec[string];
    apiSpec[path] = pathSpec;
    pathSpec.parameters = parameters(item.parameters);

    operations(item).forEach(([method, operation]) => {
      const operationSpec = {} as OperationSpec;
      pathSpec[method] = operationSpec;
      const lambdaSpec = operation[EXT_PROP_LAMBDA];
      if (lambdaSpec?.function) {
        operationSpec.lambda = {
          name: lambdaSpec.function,
          params: { ...omit(lambdaSpec, 'function') },
        };
      }
      operationSpec.parameters = parameters(operation.parameters);
      operationSpec.requestBody = requestBody(operation.requestBody);
    });
    return apiSpec;
  }, {} as ApiSpec);
}

