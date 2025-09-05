// This is a test file to verify our domain logic works for different stages
import { RootConfig } from './lib/config/rootConfig';

// Test configuration for non-prod stage (should create alpha.coffeestain.co)
const testRootConfig: RootConfig = {
  hostedZoneName: 'coffeestain.co',
  serviceName: '', // Empty service name
  frontEndPath: 'frontend/coffeestain',
  stageConfigurations: [
    {
      stageName: 'alpha',
      region: 'us-east-1',
      accountId: '229133519362'
    },
  ]
};

// Test configuration for prod stage (should create coffeestain.co)
const prodRootConfig: RootConfig = {
  hostedZoneName: 'coffeestain.co',
  serviceName: '', // Empty service name  
  frontEndPath: 'frontend/coffeestain',
  stageConfigurations: [
    {
      stageName: 'prod',
      region: 'us-east-1',
      accountId: '229133519362'
    },
  ]
};

console.log('Test configurations created to verify domain logic:');
console.log('Alpha stage should create: alpha.coffeestain.co');
console.log('Prod stage should create: coffeestain.co');
