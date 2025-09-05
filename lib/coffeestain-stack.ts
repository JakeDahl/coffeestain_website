import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { RootConfig, StageConfiguration } from './config/rootConfig';
import { FrontendDeploymentConstruct } from './frontendDeploymentConstruct';
import { VariableInjector } from './helpers/variableInjection';


interface CoffeeStainProps extends cdk.StackProps{
  stageName: string; // For defining environment stages later on.
  rootConfig: RootConfig;
  stageConfig: StageConfiguration;
};

export class CoffeestainStack extends cdk.Stack {
  private executionRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, props: CoffeeStainProps) {
    super(scope, id, props);

    const varInjector = new VariableInjector();

    const pool = new cdk.aws_cognito.UserPool(
        this, 
        `coffeestain-${props?.stageName}`,
        {
            userPoolName: `coffeestain-${props?.stageName}`,
            signInAliases: {
                email: true,
              },
              selfSignUpEnabled: true,
              autoVerify: {
                email: true,
              },
              userVerification: {
                emailSubject: 'CoffeeStain: Verify your email',
                emailBody: 'Thanks for signing up! Your verification code is {####}', // # This placeholder is a must if code is selected as preferred verification method
                emailStyle: cdk.aws_cognito.VerificationEmailStyle.CODE,
              },
              passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
        accountRecovery: cdk.aws_cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.executionRole = new cdk.aws_iam.Role(this, `execution-role`, {
        assumedBy: new cdk.aws_iam.CompositePrincipal(
            new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        ),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ]
    });

    const frontend = new FrontendDeploymentConstruct(this, 'coffee-stain-frontend', {
      rootConfig: props.rootConfig,
      stageConfig: props.stageConfig,
      cogUserPool: pool,
      varInjector: varInjector
    });
  }
}
