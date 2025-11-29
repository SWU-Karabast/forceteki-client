import { S3Client, PutObjectCommand, DeleteObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Singleton pattern for S3 client
let s3Service: S3Service;

/**
 * Get a properly initialized S3 service for Next.js
 */
export async function getS3ServiceAsync(): Promise<S3Service | null> {
    if (s3Service) {
        return s3Service;
    }

    s3Service = new S3Service();

    // Return null if service failed to initialize
    if (!s3Service.isAvailable()) {
        return null;
    }

    return s3Service;
}

// Simple Storage Service
export class S3Service {
    private s3Client: S3Client | null = null;
    private bucketName: string;

    constructor() {
        this.bucketName = 'karabast-customization';

        const s3ClientConfig: S3ClientConfig = {
            region: 'us-east-1',
        };

        // Use local S3 (Adobe S3Mock) if in development and specified
        if (process.env.NODE_ENV === 'development') {
            if(process.env.USE_LOCAL_S3 === 'true') {
                s3ClientConfig.endpoint = 'http://localhost:9090';
                s3ClientConfig.credentials = {
                    accessKeyId: 'accessKey1',
                    secretAccessKey: 'verySecretKey1'
                };
                s3ClientConfig.forcePathStyle = true; // Required for Adobe S3Mock/local S3
            } else{
                console.log('S3 service not started since credentials are not set for local environment')
                throw new Error('S3 service not started since credentials are not set for local environment');
            }
        } else {
            // Only initialize if we have the required environment variables
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
                console.warn('AWS credentials not found, S3 service unavailable');
                this.s3Client = null;
                return;
            }

            s3ClientConfig.credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            };
        }

        this.s3Client = new S3Client(s3ClientConfig);
    }

    /**
     * Check if S3 service is available
     */
    isAvailable(): boolean {
        return this.s3Client !== null;
    }

    /**
     * Upload a file to S3
     */
    async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
        if (!this.s3Client) {
            throw new Error('S3 service is not available. Check AWS credentials.');
        }

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: file,
            ContentType: contentType,
        });

        await this.s3Client.send(command);

        // Return the public URL based on environment
        return this.getPublicUrl(key);
    }

    /**
     * Delete a file from S3 Might be useful later on
     */
    async deleteFile(key: string): Promise<void> {
        if (!this.s3Client) {
            throw new Error('S3 service is not available. Check AWS credentials.');
        }

        const command = new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        });

        await this.s3Client.send(command);
    }

    /**
     * Get the public URL for a file
     */
    getPublicUrl(key: string): string {
        // Handle local S3 (Adobe S3Mock) URLs differently
        if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_S3 === 'true') {
            const endpoint = 'http://localhost:9090';
            return `${endpoint}/${this.bucketName}/${key}`;
        }

        return `https://${this.bucketName}.s3.us-east-1.amazonaws.com/${key}`;
    }
    // https://karabast-customization.s3.us-east-1.amazonaws.com/cardbacks/050b1d23-7144-4412-92a9-130e0c64b2b7.webp
}