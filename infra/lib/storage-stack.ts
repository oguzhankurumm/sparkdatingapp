import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import type { Construct } from 'constructs'

interface StorageStackProps extends cdk.StackProps {
  stage: string
}

export class StorageStack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket
  public readonly cdnDistribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props)
    const { stage } = props

    const isProd = stage === 'prod'

    // ---------------------------------------------------------------
    // S3 Bucket — media storage (photos, videos, voice notes)
    // ---------------------------------------------------------------
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: `spark-${stage}-media-${this.account}`,
      versioned: isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: isProd ? ['https://spark.app'] : ['*'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: 'AbortIncompleteMultipartUpload',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    })

    // ---------------------------------------------------------------
    // CloudFront Distribution — CDN for media
    // ---------------------------------------------------------------
    this.cdnDistribution = new cloudfront.Distribution(this, 'CdnDistribution', {
      comment: `Spark ${stage} media CDN`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.mediaBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      priceClass: isProd
        ? cloudfront.PriceClass.PRICE_CLASS_ALL
        : cloudfront.PriceClass.PRICE_CLASS_100,
    })

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,
      exportName: `spark-${stage}-media-bucket`,
    })

    new cdk.CfnOutput(this, 'MediaBucketArn', {
      value: this.mediaBucket.bucketArn,
      exportName: `spark-${stage}-media-bucket-arn`,
    })

    new cdk.CfnOutput(this, 'CdnDomainName', {
      value: this.cdnDistribution.distributionDomainName,
      exportName: `spark-${stage}-cdn-domain`,
    })

    new cdk.CfnOutput(this, 'CdnDistributionId', {
      value: this.cdnDistribution.distributionId,
      exportName: `spark-${stage}-cdn-distribution-id`,
    })
  }
}
