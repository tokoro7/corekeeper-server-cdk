import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as path from 'path';

interface ServerControlApiProps {
  instance: ec2.Instance;
}

export class ServerControlApi extends Construct {
  constructor(scope: Construct, id: string, props: ServerControlApiProps) {
    super(scope, id);

    const { instance } = props;

    const fn = new lambdaNodejs.NodejsFunction(this, 'Function', {
      entry: path.join(__dirname, '../../lambda/server-control/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        INSTANCE_ID: instance.instanceId,
      },
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ec2:StartInstances', 'ec2:StopInstances'],
      resources: [
        `arn:aws:ec2:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:instance/${instance.instanceId}`,
      ],
    }));

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'CoreKeeper Server Control',
    });

    const integration = new apigateway.LambdaIntegration(fn);

    api.root.addResource('start').addMethod('POST', integration);
    api.root.addResource('stop').addMethod('POST', integration);

    new cdk.CfnOutput(scope, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });
  }
}
