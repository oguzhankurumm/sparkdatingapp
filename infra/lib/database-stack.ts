import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'

interface DatabaseStackProps extends cdk.StackProps {
  stage: string
  vpc: ec2.IVpc
  dbSg: ec2.ISecurityGroup
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbSecret: secretsmanager.ISecret
  public readonly dbInstance: rds.DatabaseInstance

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props)
    const { stage, vpc, dbSg } = props

    const isProd = stage === 'prod'

    // ---------------------------------------------------------------
    // Database Credentials Secret
    // ---------------------------------------------------------------
    const secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `spark-${stage}-db-credentials`,
      description: `Spark ${stage} PostgreSQL credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'spark_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    })

    this.dbSecret = secret

    // ---------------------------------------------------------------
    // RDS PostgreSQL 16 Instance
    // ---------------------------------------------------------------
    this.dbInstance = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `spark-${stage}-postgres`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: isProd
        ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
        : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      credentials: rds.Credentials.fromSecret(secret),
      databaseName: 'spark',
      multiAz: isProd,
      allocatedStorage: isProd ? 100 : 20,
      maxAllocatedStorage: isProd ? 500 : 50,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(isProd ? 30 : 7),
      deletionProtection: isProd,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    })

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      exportName: `spark-${stage}-db-endpoint`,
    })

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: secret.secretArn,
      exportName: `spark-${stage}-db-secret-arn`,
    })
  }
}
