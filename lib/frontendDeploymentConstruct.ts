import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RootConfig, StageConfiguration } from './config/rootConfig';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import { VariableInjector } from './helpers/variableInjection';
import { Distribution, ErrorResponse, OriginAccessIdentity, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget} from 'aws-cdk-lib/aws-route53-targets'


interface FrontendDeploymentProps{
  rootConfig: RootConfig;
  stageConfig: StageConfiguration;
  varInjector: VariableInjector;
  cogUserPool: cdk.aws_cognito.UserPool;
};

export class FrontendDeploymentConstruct extends Construct {
    private frontendExecutionRole: cdk.aws_iam.Role;

    constructor(scope: Construct, id: string, props: FrontendDeploymentProps) {
    super(scope, id);

    const rootStageName = props.rootConfig.serviceName 
      ? `${props.rootConfig.serviceName}.${props.stageConfig.stageName}`
      : props.stageConfig.stageName;

    const zone = cdk.aws_route53.HostedZone.fromLookup(this, 'hosted-zone', { domainName: props.rootConfig.hostedZoneName });

    // Rebuilding the entire system for multi-modal, referencing the other diagram.
    this.frontendExecutionRole = new cdk.aws_iam.Role(this, `fe-role-${props.stageConfig.stageName}`, {
        assumedBy: new cdk.aws_iam.CompositePrincipal(
            new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),        )
    });

    const domainName = props.stageConfig.stageName === 'prod' 
      ? props.rootConfig.hostedZoneName
      : `${props.stageConfig.stageName}.${props.rootConfig.hostedZoneName}`;


    const cognitoClient = props.cogUserPool.addClient('cog-up-client', {
        userPoolClientName: rootStageName,
        authFlows: {
            userPassword: true,
            userSrp: true,   
        }
    });
    const identityPool = new cdk.aws_cognito.CfnIdentityPool(this, "IdentityPool", {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: cognitoClient.userPoolClientId,
            providerName: props.cogUserPool.userPoolProviderName,
          },
        ],
    });

    props.varInjector.addVariable('##_COG_CLIENT_ID_##', cognitoClient.userPoolClientId);
    props.varInjector.addVariable('##_COGNITO_USER_POOL_ID_##', props.cogUserPool.userPoolId);

    const errorResponse: ErrorResponse = {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.minutes(5)
    };

    const certificate = new Certificate(this, 'cross-region-certificate', {
      domainName: domainName,
      validation: CertificateValidation.fromDns(zone)
    });

    const accessLoggingBucket = new cdk.aws_s3.Bucket(this, 'frontend-access-logging', {});

    const uniqueId = new Date().getTime();

    this.frontendExecutionRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionrole')
    );

    const websiteBucket = new cdk.aws_s3.Bucket(this, 'web-bucket', {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED
    });

    const oai = new cdk.aws_cloudfront.OriginAccessIdentity(this, 'OAI');
    websiteBucket.grantRead(oai);

    const www_policy = new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      principals: [new cdk.aws_iam.AnyPrincipal],
      actions: ['s3:GetObject'],
      resources: [websiteBucket.arnForObjects('*')]
    });

    websiteBucket.addToResourcePolicy(www_policy);

    const distribution = new cdk.aws_cloudfront.Distribution(this, 'webDistribution', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(
          websiteBucket,  {
            originAccessIdentity: oai
          }),
          
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      domainNames: [domainName],
      certificate: certificate
    });

    const recordName = props.stageConfig.stageName === 'prod' 
      ? undefined  // For apex domain (coffeestain.co)
      : props.stageConfig.stageName;  // For subdomain (alpha.coffeestain.co)
    
    new cdk.aws_route53.ARecord(this, 'www-record', {
      zone: zone,
      target: cdk.aws_route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
      recordName: recordName,
    });

    // Deploy website contents to S3
    new cdk.aws_s3_deployment.BucketDeployment(this, 'DeployWebsite', {
      sources: [cdk.aws_s3_deployment.Source.asset('./frontend/coffeestain/build')],
      destinationBucket: websiteBucket,
      distributionPaths: ['/*'],
      distribution: distribution,
    });
  };
};
