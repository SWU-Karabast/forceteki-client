export const s3ImageURL = (path: string) => {
    const s3Bucket = "https://karabast-assets.s3.amazonaws.com/";
    return s3Bucket + path;
};