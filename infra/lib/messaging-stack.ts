import * as cdk from 'aws-cdk-lib'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sns_subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as ses from 'aws-cdk-lib/aws-ses'
import type { Construct } from 'constructs'

interface MessagingStackProps extends cdk.StackProps {
  stage: string
}

export class MessagingStack extends cdk.Stack {
  public readonly moderationQueueUrl: string
  public readonly notificationQueueUrl: string
  public readonly analyticsQueueUrl: string

  public readonly userEventsTopic: sns.Topic
  public readonly matchEventsTopic: sns.Topic
  public readonly paymentEventsTopic: sns.Topic

  constructor(scope: Construct, id: string, props: MessagingStackProps) {
    super(scope, id, props)
    const { stage } = props

    const isProd = stage === 'prod'

    // ---------------------------------------------------------------
    // SQS — Moderation Queue (with DLQ, 3 retries)
    // ---------------------------------------------------------------
    const moderationDlq = new sqs.Queue(this, 'ModerationDlq', {
      queueName: `spark-${stage}-moderation-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    })

    const moderationQueue = new sqs.Queue(this, 'ModerationQueue', {
      queueName: `spark-${stage}-moderation`,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: moderationDlq,
        maxReceiveCount: 3,
      },
    })

    this.moderationQueueUrl = moderationQueue.queueUrl

    // ---------------------------------------------------------------
    // SQS — Notification Queue (with DLQ, 3 retries)
    // ---------------------------------------------------------------
    const notificationDlq = new sqs.Queue(this, 'NotificationDlq', {
      queueName: `spark-${stage}-notification-dlq`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    })

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: `spark-${stage}-notification`,
      visibilityTimeout: cdk.Duration.seconds(120),
      retentionPeriod: cdk.Duration.days(7),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: notificationDlq,
        maxReceiveCount: 3,
      },
    })

    this.notificationQueueUrl = notificationQueue.queueUrl

    // ---------------------------------------------------------------
    // SQS — Analytics Queue (no DLQ — best effort)
    // ---------------------------------------------------------------
    const analyticsQueue = new sqs.Queue(this, 'AnalyticsQueue', {
      queueName: `spark-${stage}-analytics`,
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(3),
      encryption: sqs.QueueEncryption.SQS_MANAGED,
    })

    this.analyticsQueueUrl = analyticsQueue.queueUrl

    // ---------------------------------------------------------------
    // SNS Topics
    // ---------------------------------------------------------------
    this.userEventsTopic = new sns.Topic(this, 'UserEventsTopic', {
      topicName: `spark-${stage}-user-events`,
      displayName: `Spark ${stage} User Events`,
    })

    this.matchEventsTopic = new sns.Topic(this, 'MatchEventsTopic', {
      topicName: `spark-${stage}-match-events`,
      displayName: `Spark ${stage} Match Events`,
    })

    this.paymentEventsTopic = new sns.Topic(this, 'PaymentEventsTopic', {
      topicName: `spark-${stage}-payment-events`,
      displayName: `Spark ${stage} Payment Events`,
    })

    // ---------------------------------------------------------------
    // SNS → SQS Subscriptions
    // Route match events to moderation and notification queues.
    // Route user events to analytics queue.
    // Route payment events to notification queue.
    // ---------------------------------------------------------------
    this.matchEventsTopic.addSubscription(
      new sns_subs.SqsSubscription(moderationQueue, {
        rawMessageDelivery: true,
      }),
    )

    this.matchEventsTopic.addSubscription(
      new sns_subs.SqsSubscription(notificationQueue, {
        rawMessageDelivery: true,
      }),
    )

    this.userEventsTopic.addSubscription(
      new sns_subs.SqsSubscription(analyticsQueue, {
        rawMessageDelivery: true,
      }),
    )

    this.paymentEventsTopic.addSubscription(
      new sns_subs.SqsSubscription(notificationQueue, {
        rawMessageDelivery: true,
      }),
    )

    // ---------------------------------------------------------------
    // SES — Email Identity for transactional email
    // ---------------------------------------------------------------
    const emailDomain = isProd ? 'spark.app' : `${stage}.spark.app`

    new ses.EmailIdentity(this, 'EmailIdentity', {
      identity: ses.Identity.domain(emailDomain),
      mailFromDomain: `mail.${emailDomain}`,
    })

    // ---------------------------------------------------------------
    // CloudFormation Outputs
    // ---------------------------------------------------------------
    new cdk.CfnOutput(this, 'ModerationQueueUrl', {
      value: moderationQueue.queueUrl,
      exportName: `spark-${stage}-moderation-queue-url`,
    })

    new cdk.CfnOutput(this, 'ModerationQueueArn', {
      value: moderationQueue.queueArn,
      exportName: `spark-${stage}-moderation-queue-arn`,
    })

    new cdk.CfnOutput(this, 'ModerationDlqUrl', {
      value: moderationDlq.queueUrl,
      exportName: `spark-${stage}-moderation-dlq-url`,
    })

    new cdk.CfnOutput(this, 'NotificationQueueUrl', {
      value: notificationQueue.queueUrl,
      exportName: `spark-${stage}-notification-queue-url`,
    })

    new cdk.CfnOutput(this, 'NotificationQueueArn', {
      value: notificationQueue.queueArn,
      exportName: `spark-${stage}-notification-queue-arn`,
    })

    new cdk.CfnOutput(this, 'NotificationDlqUrl', {
      value: notificationDlq.queueUrl,
      exportName: `spark-${stage}-notification-dlq-url`,
    })

    new cdk.CfnOutput(this, 'AnalyticsQueueUrl', {
      value: analyticsQueue.queueUrl,
      exportName: `spark-${stage}-analytics-queue-url`,
    })

    new cdk.CfnOutput(this, 'AnalyticsQueueArn', {
      value: analyticsQueue.queueArn,
      exportName: `spark-${stage}-analytics-queue-arn`,
    })

    new cdk.CfnOutput(this, 'UserEventsTopicArn', {
      value: this.userEventsTopic.topicArn,
      exportName: `spark-${stage}-user-events-topic-arn`,
    })

    new cdk.CfnOutput(this, 'MatchEventsTopicArn', {
      value: this.matchEventsTopic.topicArn,
      exportName: `spark-${stage}-match-events-topic-arn`,
    })

    new cdk.CfnOutput(this, 'PaymentEventsTopicArn', {
      value: this.paymentEventsTopic.topicArn,
      exportName: `spark-${stage}-payment-events-topic-arn`,
    })
  }
}
