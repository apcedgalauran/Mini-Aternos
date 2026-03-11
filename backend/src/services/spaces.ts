import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from '../config';
import { Readable } from 'stream';

const spacesClient = new S3Client({
  endpoint: `https://${config.doSpacesRegion}.digitaloceanspaces.com`,
  region: config.doSpacesRegion,
  credentials: {
    accessKeyId: config.doSpacesKey,
    secretAccessKey: config.doSpacesSecret,
  },
  forcePathStyle: false,
});

class SpacesService {
  private bucket = config.doSpacesBucket;

  /**
   * Upload world backup to Spaces
   */
  async uploadWorldBackup(data: Buffer, key = 'world-backup.zip'): Promise<{ size: number }> {
    await spacesClient.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: 'application/zip',
        ACL: 'private',
      })
    );
    return { size: data.length };
  }

  /**
   * Download world backup from Spaces
   */
  async downloadWorldBackup(key = 'world-backup.zip'): Promise<Buffer> {
    const response = await spacesClient.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    if (!response.Body) {
      throw new Error('Empty response body from Spaces');
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  /**
   * Get backup metadata (size, last modified)
   */
  async getBackupInfo(key = 'world-backup.zip'): Promise<{
    size: number;
    lastModified: string;
  } | null> {
    try {
      const response = await spacesClient.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return {
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified?.toISOString() ?? '',
      };
    } catch {
      return null;
    }
  }
}

export const spacesService = new SpacesService();
