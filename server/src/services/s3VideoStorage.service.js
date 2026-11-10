import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';
import { getS3Client, getS3Bucket, isS3Configured } from '../config/s3.js';

const MIME_TO_EXT = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-matroska': 'mkv',
  'video/ogg': 'ogv'
};

const getExtensionForMime = (mimeType = 'video/webm') => {
  const baseMime = mimeType.split(';')[0].trim().toLowerCase();
  return MIME_TO_EXT[baseMime] || 'webm';
};

/**
 * AWS S3 Video Storage Service
 * Handles presigned upload/download URL generation, object verification, and retake cleanup
 */
export class S3VideoStorageService {
  static isConfigured() {
    return isS3Configured();
  }

  static getBucketName() {
    return getS3Bucket();
  }

  static getKeyPrefix() {
    const raw = (config.aws?.s3Prefix || 'verifications').replace(/^\/+|\/+$/g, '');
    return raw || 'verifications';
  }

  /**
   * Builds a deterministic, collision-safe S3 object key for a verification question response
   */
  static buildObjectKey({ verificationId, questionNumber, mimeType = 'video/webm' }) {
    const prefix = this.getKeyPrefix();
    const ext = getExtensionForMime(mimeType);
    return `${prefix}/${verificationId}/q${questionNumber}_${Date.now()}.${ext}`;
  }

  /**
   * Validates that an S3 key belongs to the expected verification session directory
   */
  static isKeyOwnedBySession(s3Key, verificationId) {
    if (!s3Key || typeof s3Key !== 'string' || !verificationId) return false;
    const expectedPrefix = `${this.getKeyPrefix()}/${verificationId}/`;
    return s3Key.startsWith(expectedPrefix);
  }

  /**
   * Generates a presigned PUT URL for direct browser-to-S3 video upload
   */
  static async createPresignedUploadUrl({
    key,
    contentType = 'video/webm',
    expiresIn = config.aws?.presignedExpiresIn || 900
  }) {
    const client = getS3Client();
    const bucket = getS3Bucket();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });
    return {
      uploadUrl,
      s3Key: key,
      bucket,
      contentType,
      expiresIn
    };
  }

  /**
   * Generates a presigned GET URL for secure video playback/preview
   */
  static async createPresignedDownloadUrl({
    key,
    bucket = getS3Bucket(),
    expiresIn = config.aws?.presignedExpiresIn || 900
  }) {
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return {
      url,
      s3Key: key,
      bucket,
      expiresIn
    };
  }

  /**
   * Verifies that a video object exists in S3 and returns its metadata
   */
  static async headObject(key, bucket = getS3Bucket()) {
    try {
      const client = getS3Client();
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      });
      const result = await client.send(command);
      return {
        exists: true,
        contentLength: result.ContentLength || 0,
        contentType: result.ContentType || 'video/webm',
        eTag: result.ETag || null
      };
    } catch (err) {
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
        return null;
      }
      throw err;
    }
  }

  /**
   * Deletes an object from S3 (used when retaking or resetting a recording)
   */
  static async deleteObject(key, bucket = getS3Bucket()) {
    try {
      if (!key || !isS3Configured()) return false;
      const client = getS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        })
      );
      return true;
    } catch (err) {
      console.warn(`[S3] Safe delete warning for ${key}:`, err.message);
      return false;
    }
  }
}

export default S3VideoStorageService;

