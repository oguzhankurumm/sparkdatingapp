import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import type { Construct } from 'constructs'

interface VpcStackProps extends cdk.StackProps {
  stage: string
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc
  public readonly albSg: ec2.SecurityGroup
  public readonly apiSg: ec2.SecurityGroup
  public readonly dbSg: ec2.SecurityGroup
  public readonly cacheSg: ec2.SecurityGroup

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props)
    const { stage } = props

    // ---------------------------------------------------------------
    // VPC — 3-AZ with public / private / isolated subnets
    // ---------------------------------------------------------------
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `spark-${stage}-vpc`,
      maxAzs: 3,
      natGateways: stage === 'prod' ? 3 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    })

    // ---------------------------------------------------------------
    // Security Groups
    // ---------------------------------------------------------------

    // ALB Security Group — accepts HTTP/HTTPS from the internet
    this.albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      securityGroupName: `spark-${stage}-alb-sg`,
      description: 'ALB security group — allows HTTP and HTTPS ingress',
    })
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from anywhere')
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS from anywhere')

    // API Security Group — accepts traffic on port 4000 from ALB only
    this.apiSg = new ec2.SecurityGroup(this, 'ApiSg', {
      vpc: this.vpc,
      securityGroupName: `spark-${stage}-api-sg`,
      description: 'API security group — allows port 4000 from ALB',
    })
    this.apiSg.addIngressRule(this.albSg, ec2.Port.tcp(4000), 'Allow port 4000 from ALB')

    // Database Security Group — accepts PostgreSQL from API only
    this.dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      securityGroupName: `spark-${stage}-db-sg`,
      description: 'Database security group — allows PostgreSQL from API',
    })
    this.dbSg.addIngressRule(this.apiSg, ec2.Port.tcp(5432), 'Allow PostgreSQL from API')

    // Cache Security Group — accepts Redis from API only
    this.cacheSg = new ec2.SecurityGroup(this, 'CacheSg', {
      vpc: this.vpc,
      securityGroupName: `spark-${stage}-cache-sg`,
      description: 'Cache security group — allows Redis from API',
    })
    this.cacheSg.addIngressRule(this.apiSg, ec2.Port.tcp(6379), 'Allow Redis from API')

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `spark-${stage}-vpc-id`,
    })

    new cdk.CfnOutput(this, 'AlbSgId', {
      value: this.albSg.securityGroupId,
      exportName: `spark-${stage}-alb-sg-id`,
    })

    new cdk.CfnOutput(this, 'ApiSgId', {
      value: this.apiSg.securityGroupId,
      exportName: `spark-${stage}-api-sg-id`,
    })

    new cdk.CfnOutput(this, 'DbSgId', {
      value: this.dbSg.securityGroupId,
      exportName: `spark-${stage}-db-sg-id`,
    })

    new cdk.CfnOutput(this, 'CacheSgId', {
      value: this.cacheSg.securityGroupId,
      exportName: `spark-${stage}-cache-sg-id`,
    })
  }
}
