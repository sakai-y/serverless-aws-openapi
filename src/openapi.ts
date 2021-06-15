import Serverless from "serverless";
import SwaggerParser from "@apidevtools/swagger-parser";
import { apiSpecFromV3, isOpenAPIV3 } from "./openapi.v3";
import { ApiSpec, HttpEvent, HttpMethods } from "./model";

export async function apiSpecFrom(specFile: string): Promise<ApiSpec> {
  const parser = new SwaggerParser();
  const api = await parser.validate(specFile);
  if (isOpenAPIV3(api)) {
    return apiSpecFromV3(api);
  }
  return {};
}

export function lambdaHttpEventsFrom(api: ApiSpec): Record<string, HttpEvent[]> {
  return Object.entries(api).reduce((record, [path, item]) => {
    HttpMethods.forEach(method => {
      const lambda = item[method]?.lambda;
      if (!lambda?.name) {
        return;
      }

      const event: HttpEvent = {
        http: {
          path,
          method,
          ...lambda.params
        }
      };

      if (!record[lambda.name]) {
        record[lambda.name] = [];
      }
      record[lambda.name].push(event);
    });
    return record;
  }, {} as Record<string, HttpEvent[]>);
}
