#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CorekeeperServerCdkStack } from '../lib/corekeeper-server-cdk-stack';

const app = new cdk.App();
new CorekeeperServerCdkStack(app, 'CorekeeperServerCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
