import Serverless from 'serverless';
import SwaggerParser from '@apidevtools/swagger-parser';
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

    const apiSpec = await apiSpecFrom(specFile);
    const lambdaEvents = lambdaHttpEventsFrom(apiSpec);
    Object.entries(lambdaEvents).forEach(([funcName, events]) => {
      const func = service.functions[funcName];
      if (!func) {
        cli.log(`OpenAPI - WARNING: No such function: ${funcName}`);
        return;
      }
      func.events = events;

      const routes = events.map(event => `${event.http.method} ${event.http.path}`);
      cli.log(`OpenAPI - added route to ${funcName}: ${routes}`);
    });
  }
}

export = ServerlessAwsOpenapi;
