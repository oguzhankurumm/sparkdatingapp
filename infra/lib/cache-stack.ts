import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import type { Construct } from 'constructs'

interface CacheStackProps extends cdk.StackProps {
  stage: string
  vpc: ec2.IVpc
  cacheSg: ec2.ISecurityGroup
}

export class CacheStack extends cdk.Stack {
  public readonly redisEndpoint: string

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id, props)
    const { stage, vpc, cacheSg } = props

    const isProd = stage === 'prod'

    // ---------------------------------------------------------------
    // ElastiCache Subnet Group
    // ---------------------------------------------------------------
    const isolatedSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    })

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      cacheSubnetGroupName: `spark-${stage}-redis-subnet`,
      description: `Spark ${stage} Redis subnet group`,
      subnetIds: isolatedSubnets.subnetIds,
    })

    // ---------------------------------------------------------------
    // ElastiCache Redis 7 Replication Group
    // ---------------------------------------------------------------
    const replicationGroup = new elasticache.CfnReplicationGroup(this, 'RedisReplicationGroup', {
      replicationGroupDescription: `Spark ${stage} Redis cluster`,
      replicationGroupId: `spark-${stage}-redis`,
      engine: 'redis',
      engineVersion: '7.1',
      cacheNodeType: isProd ? 'cache.r6g.large' : 'cache.t4g.micro',
      numCacheClusters: isProd ? 2 : 1,
      automaticFailoverEnabled: isProd,
      multiAzEnabled: isProd,
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      securityGroupIds: [cacheSg.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      port: 6379,
    })

    replicationGroup.addDependency(subnetGroup)

    this.redisEndpoint = replicationGroup.attrPrimaryEndPointAddress

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: replicationGroup.attrPrimaryEndPointAddress,
      exportName: `spark-${stage}-redis-endpoint`,
    })

    new cdk.CfnOutput(this, 'RedisPort', {
      value: replicationGroup.attrPrimaryEndPointPort,
      exportName: `spark-${stage}-redis-port`,
    })
  }
}
