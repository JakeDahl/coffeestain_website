#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CoffeestainStack } from '../lib/coffeestain-stack';
import { RootConfig } from '../lib/config/rootConfig';

const app = new cdk.App();

const prodRootConfig: RootConfig = {
  hostedZoneName: 'coffeestain.co', // placeholder,
  serviceName: '',
  frontEndPath: 'frontend/coffeestain',
  stageConfigurations: [
    {
      stageName: 'prod',
      region: 'us-east-1',
      accountId: '229133519362'
    },
  ]
};


new CoffeestainStack(app, 'CoffeestainStack', { 
  env: {
    account: '229133519362',
    region: 'us-east-1'
  }, 
  stageName: 'prod', 
  rootConfig: prodRootConfig, 
  stageConfig: prodRootConfig.stageConfigurations[0] } 
);