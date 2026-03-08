import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as logs from 'aws-cdk-lib/aws-logs'
import type * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import type { Construct } from 'constructs'

interface ComputeStackProps extends cdk.StackProps {
  stage: string
  vpc: ec2.IVpc
  albSg: ec2.ISecurityGroup
  apiSg: ec2.ISecurityGroup
  dbSecret: secretsmanager.ISecret
  redisEndpoint: string
}

export class ComputeStack extends cdk.Stack {
  public readonly albDnsName: string
  public readonly service: ecs.FargateService
  public readonly cluster: ecs.Cluster

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props)
    const { stage, vpc, albSg, apiSg, dbSecret, redisEndpoint } = props

    const isProd = stage === 'prod'

    // ---------------------------------------------------------------
    // ECR Repository — stores API Docker images
    // ---------------------------------------------------------------
    const repository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `spark-${stage}-api`,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: !isProd,
      lifecycleRules: [
        {
          maxImageCount: isProd ? 50 : 10,
          description: 'Limit stored images',
        },
      ],
    })

    // ---------------------------------------------------------------
    // ECS Cluster
    // ---------------------------------------------------------------
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `spark-${stage}-cluster`,
      vpc,
      containerInsights: isProd,
    })

    // ---------------------------------------------------------------
    // CloudWatch Log Group
    // ---------------------------------------------------------------
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/ecs/spark-${stage}-api`,
      retention: isProd ? logs.RetentionDays.SIX_MONTHS : logs.RetentionDays.ONE_WEEK,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    })

    // ---------------------------------------------------------------
    // Task Definition
    // ---------------------------------------------------------------
    const taskCpu = isProd ? 1024 : 512
    const taskMemory = isProd ? 2048 : 1024

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `spark-${stage}-api`,
      cpu: taskCpu,
      memoryLimitMiB: taskMemory,
    })

    // Grant the task role read access to the DB secret
    dbSecret.grantRead(taskDefinition.taskRole)

    const container = taskDefinition.addContainer('api', {
      containerName: `spark-${stage}-api`,
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'api',
        logGroup,
      }),
      environment: {
        NODE_ENV: isProd ? 'production' : 'development',
        PORT: '4000',
        STAGE: stage,
        REDIS_URL: `redis://${redisEndpoint}:6379`,
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(dbSecret, 'connectionString'),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:4000/api/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    })

    container.addPortMappings({
      containerPort: 4000,
      protocol: ecs.Protocol.TCP,
    })

    // ---------------------------------------------------------------
    // Application Load Balancer
    // ---------------------------------------------------------------
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: `spark-${stage}-alb`,
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    })

    // ---------------------------------------------------------------
    // ECS Fargate Service
    // ---------------------------------------------------------------
    this.service = new ecs.FargateService(this, 'ApiService', {
      serviceName: `spark-${stage}-api`,
      cluster: this.cluster,
      taskDefinition,
      desiredCount: isProd ? 2 : 1,
      securityGroups: [apiSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      enableExecuteCommand: !isProd,
    })

    // ---------------------------------------------------------------
    // ALB Target Group & Listener
    // ---------------------------------------------------------------
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      targetGroupName: `spark-${stage}-api-tg`,
      vpc,
      port: 4000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/api/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    })

    targetGroup.addTarget(this.service)

    alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    })

    // ---------------------------------------------------------------
    // Auto-Scaling
    // ---------------------------------------------------------------
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: isProd ? 2 : 1,
      maxCapacity: isProd ? 10 : 2,
    })

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    })

    // ---------------------------------------------------------------
    // Store ALB DNS for outputs
    // ---------------------------------------------------------------
    this.albDnsName = alb.loadBalancerDnsName

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `spark-${stage}-alb-dns`,
    })

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      exportName: `spark-${stage}-ecr-uri`,
    })

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      exportName: `spark-${stage}-cluster-name`,
    })

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      exportName: `spark-${stage}-service-name`,
    })
  }
}
