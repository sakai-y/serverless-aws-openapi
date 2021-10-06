import Serverless from 'serverless';
import { apiSpecFrom, lambdaHttpEventsFrom } from './openapi';

class ServerlessAwsOpenapi {
  hooks: Record<string, Function>;

  constructor(private serverless: Serverless) {
    this.hooks = {
      'before:offline:start:init': this.applyApiSpec.bind(this),
      'before:package:createDeploymentArtifacts': this.applyApiSpec.bind(this),
    };
  }

  async applyApiSpec() {
    const cli = this.serverless.cli;
    const service = this.serverless.service;
    const specFile = service.custom?.openapi?.spec;
    if (!specFile) {
      cli.log('OpenAPI - WARNING: No openapi spec specified.');
      return;
    }

    const validate = service.custom?.openapi?.validate;

    const apiSpec = await apiSpecFrom(specFile);
    const lambdaEvents = lambdaHttpEventsFrom(apiSpec);
    Object.entries(lambdaEvents).forEach(([funcName, events]) => {
      const func = service.functions[funcName];
      if (!func) {
        cli.log(`OpenAPI - WARNING: No such function: ${funcName}`);
        return;
      }
      func.events = events;

      events.forEach((event) => {
        if (!validate) {
          event.http.request = undefined;
          return;
        }
        const schema = event.http.request?.schemas;
        if (schema) {
          const medias = Object.keys(schema);
          if (medias.length === 1) {
            // change only one media to '$default' to force APIGW to validate body
            schema['$default'] = schema[medias[0]];
            delete schema[medias[0]];
          }

          // set 'schemas' to 'schema' for Serverless <2.28
          (event.http.request as any).schema = schema;
        }
      });

      const routes = events.map((event) => `${event.http.method} ${event.http.path}`);
      cli.log(`OpenAPI - added route to ${funcName}: ${routes}`);
    });
  }
}

export = ServerlessAwsOpenapi;
