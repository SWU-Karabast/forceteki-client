// upload.ts
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const bucketName = 'karabast-customization';
const folderPath = path.join(__dirname, 'images');

const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: 'http://localhost:9090',
    forcePathStyle: true,
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
});

async function run() {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const fileData = fs.readFileSync(filePath);

        await s3.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: file,
                Body: fileData
            })
        );

        console.log(`Uploaded: ${file}`);
    }

    console.log('Done.');
}

run().catch((err) => {
    console.error('Upload failed:', err);
    process.exit(1);
});
