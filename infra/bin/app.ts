#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { VpcStack } from '../lib/vpc-stack'
import { DatabaseStack } from '../lib/database-stack'
import { CacheStack } from '../lib/cache-stack'
import { StorageStack } from '../lib/storage-stack'
import { ComputeStack } from '../lib/compute-stack'
import { MessagingStack } from '../lib/messaging-stack'

const app = new cdk.App()

// ---------------------------------------------------------------------------
// Stage Configuration — pass via `cdk deploy -c stage=prod`
// Defaults to 'dev' if not specified
// ---------------------------------------------------------------------------
const stage = (app.node.tryGetContext('stage') as string) ?? 'dev'

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
}

// ---------------------------------------------------------------------------
// Helper for consistent stack naming: Spark-{Stage}-{StackName}
// ---------------------------------------------------------------------------
function stackName(name: string): string {
  const capitalized = stage.charAt(0).toUpperCase() + stage.slice(1)
  return `Spark-${capitalized}-${name}`
}

// ---------------------------------------------------------------------------
// 1. Networking — VPC, subnets, security groups
// ---------------------------------------------------------------------------
const vpcStack = new VpcStack(app, stackName('Vpc'), {
  stage,
  env,
})

// ---------------------------------------------------------------------------
// 2. Data — PostgreSQL RDS + Redis ElastiCache
// ---------------------------------------------------------------------------
const databaseStack = new DatabaseStack(app, stackName('Database'), {
  stage,
  env,
  vpc: vpcStack.vpc,
  dbSg: vpcStack.dbSg,
})
databaseStack.addDependency(vpcStack)

const cacheStack = new CacheStack(app, stackName('Cache'), {
  stage,
  env,
  vpc: vpcStack.vpc,
  cacheSg: vpcStack.cacheSg,
})
cacheStack.addDependency(vpcStack)

// ---------------------------------------------------------------------------
// 3. Storage — S3 + CloudFront (no VPC dependency)
// ---------------------------------------------------------------------------
const _storageStack = new StorageStack(app, stackName('Storage'), {
  stage,
  env,
})

// ---------------------------------------------------------------------------
// 4. Messaging — SQS, SNS, SES (no VPC dependency)
// ---------------------------------------------------------------------------
const _messagingStack = new MessagingStack(app, stackName('Messaging'), {
  stage,
  env,
})

// ---------------------------------------------------------------------------
// 5. Compute — ECS Fargate + ALB (depends on VPC, Database, Cache)
// ---------------------------------------------------------------------------
const computeStack = new ComputeStack(app, stackName('Compute'), {
  stage,
  env,
  vpc: vpcStack.vpc,
  albSg: vpcStack.albSg,
  apiSg: vpcStack.apiSg,
  dbSecret: databaseStack.dbSecret,
  redisEndpoint: cacheStack.redisEndpoint,
})
computeStack.addDependency(vpcStack)
computeStack.addDependency(databaseStack)
computeStack.addDependency(cacheStack)

// ---------------------------------------------------------------------------
// Tags — applied to all resources in all stacks
// ---------------------------------------------------------------------------
cdk.Tags.of(app).add('Project', 'Spark')
cdk.Tags.of(app).add('Stage', stage)
cdk.Tags.of(app).add('ManagedBy', 'CDK')
