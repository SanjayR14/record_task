
import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

let s3ClientInstance = null;

/**
 * Checks whether AWS S3 configuration is present.
 * AWS credentials are obtained automatically from the EC2 IAM Role.
 */
export const isS3Configured = () => {
  return Boolean(
    config.aws?.region &&
    config.aws?.s3Bucket
  );
};

/**
 * Returns the singleton AWS S3Client instance.
 */
export const getS3Client = () => {
  if (!isS3Configured()) {
    throw new Error(
      'AWS S3 is not configured. Please set AWS_REGION and AWS_S3_BUCKET.'
    );
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: config.aws.region,

      // Uses the AWS default credential provider chain.
      // On EC2, this automatically retrieves temporary credentials
      // from the attached IAM Role.

      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED'
    });
  }

  return s3ClientInstance;
};

export const getS3Bucket = () => config.aws.s3Bucket;

export default {
  isS3Configured,
  getS3Client,
  getS3Bucket
};
