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

// Simple Storage Service Service
export class S3Service {
    private s3Client: S3Client | null = null;
    private bucketName: string;

    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'karabast-customization';

        const s3ClientConfig: S3ClientConfig = {
            region: process.env.AWS_REGION || 'us-east-1',
        };

        // Use local S3 (Adobe S3Mock) if in development and specified
        if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_S3 === 'true') {
            s3ClientConfig.endpoint = process.env.LOCAL_S3_ENDPOINT || 'http://localhost:9090';
            s3ClientConfig.credentials = {
                accessKeyId: process.env.LOCAL_S3_ACCESS_KEY || 'accessKey1',
                secretAccessKey: process.env.LOCAL_S3_SECRET_KEY || 'verySecretKey1'
            };
            s3ClientConfig.forcePathStyle = true; // Required for Adobe S3Mock/local S3
        } else {
            // Only initialize if we have the required environment variables
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
                console.warn('AWS credentials not found, S3 service unavailable');
                this.s3Client = null;
                return;
            }

            const credentials = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: undefined as string | undefined
            };

            // Add session token if available (for temporary credentials)
            if (process.env.AWS_SESSION_TOKEN) {
                credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
            }

            s3ClientConfig.credentials = credentials;
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
     * Generate a presigned URL for client-side upload
     */
    async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
        if (!this.s3Client) {
            throw new Error('S3 service is not available. Check AWS credentials.');
        }

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn });
    }

    /**
     * Delete a file from S3
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
            const endpoint = process.env.LOCAL_S3_ENDPOINT || 'http://localhost:9090';
            return `${endpoint}/${this.bucketName}/${key}`;
        }

        return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    }

    /**
     * Extract S3 key from full URL
     */
    extractKeyFromUrl(url: string): string | null {
        // Handle AWS S3 URLs
        let match = url.match(/https:\/\/[^\/]+\.s3\.amazonaws\.com\/(.+)/);
        if (match) {
            return match[1];
        }

        // Handle local S3 (Adobe S3Mock) URLs - format: http://localhost:9090/bucket/key
        match = url.match(/https?:\/\/[^\/]+\/[^\/]+\/(.+)/);
        return match ? match[1] : null;
    }
}