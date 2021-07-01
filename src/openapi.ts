import SwaggerParser from "@apidevtools/swagger-parser";
import { apiSpecFromV3, isOpenAPIV3 } from "./openapi.v3";
import { ApiSpec, ApigwHttpEvent, HttpMethods, ApigwRequestParameters, HttpMethod } from "./model";

export async function apiSpecFrom(specFile: string): Promise<ApiSpec> {
  const parser = new SwaggerParser();
  const api = await parser.validate(specFile);
  if (isOpenAPIV3(api)) {
    return apiSpecFromV3(api);
  }
  return {};
}

export function lambdaHttpEventsFrom(api: ApiSpec): Record<string, ApigwHttpEvent[]> {
  return Object.entries(api).reduce((record, [path, item]) => {
    HttpMethods.forEach(method => {
      const lambda = item[method]?.lambda;
      if (!lambda?.name) {
        return;
      }

      const request = makeHttpEventRequest(item, method);
      const event: ApigwHttpEvent = {
        http: {
          path,
          method,
          ...lambda.params,
          request
        }
      };

      if (!record[lambda.name]) {
        record[lambda.name] = [];
      }
      record[lambda.name].push(event);
    });
    return record;
  }, {} as Record<string, ApigwHttpEvent[]>);
}

export function makeHttpEventRequest(item: ApiSpec[string], method: HttpMethod): ApigwHttpEvent['http']['request'] {
  const parameters = (item[method]?.parameters ?? item.parameters)?.reduce((params, param) => {
    let location: keyof ApigwRequestParameters | undefined;
    switch (param.in) {
      case 'query':
        location = 'querystrings';
        break;
      case 'header':
        location = 'headers';
        break;
      case 'path':
        location = 'paths';
        break;
    }
    if (location) {
      if (!params[location]) {
        params[location] = {};
      }
      params[location][param.name] = param.required ?? false;
    }
    return params;
  }, {} as ApigwRequestParameters);

  const schema = ensureNotEmpty(Object.entries(item[method]?.requestBody?.content ?? {}).reduce((contents, [media, content]) => {
    if (content.schema) {
      contents[media] = content.schema;
      // (contents[media] as any).$schema = "http://json-schema.org/draft-04/schema#";
    }
    return contents;
  }, {} as Record<string, unknown>));

  if (!parameters && !schema) {
    return undefined;
  }

  return {
    parameters,
    schema
  };
}

function ensureNotEmpty<T extends {}>(obj: T): T | undefined {
  return Object.keys(obj).length > 0 ? obj : undefined;
}
