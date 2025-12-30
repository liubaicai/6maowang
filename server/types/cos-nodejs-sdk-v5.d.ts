declare module 'cos-nodejs-sdk-v5' {
  interface COSOptions {
    SecretId: string
    SecretKey: string
    FileParallelLimit?: number
    ChunkParallelLimit?: number
    ChunkRetryTimes?: number
    ChunkSize?: number
    SliceSize?: number
    CopyChunkParallelLimit?: number
    CopyChunkSize?: number
    CopySliceSize?: number
    ProgressInterval?: number
    Protocol?: string
    ServiceDomain?: string
    Domain?: string
    UploadQueueSize?: number
    UploadCheckContentMd5?: boolean
    Timeout?: number
    KeepAlive?: boolean
    StrictSsl?: boolean
    Proxy?: string
    getAuthorization?: (options: any, callback: (params: any) => void) => void
    UseAccelerate?: boolean
  }

  interface HeadBucketParams {
    Bucket: string
    Region: string
  }

  interface HeadObjectParams {
    Bucket: string
    Region: string
    Key: string
  }

  interface PutObjectParams {
    Bucket: string
    Region: string
    Key: string
    Body: Buffer | string
    ContentType?: string
    ContentLength?: number
    onProgress?: (progressData: { loaded: number; total: number; speed: number; percent: number }) => void
  }

  interface PutObjectResult {
    ETag: string
    Location: string
    VersionId?: string
    statusCode: number
    headers: Record<string, string>
  }

  interface GetObjectUrlParams {
    Bucket: string
    Region: string
    Key: string
    Sign?: boolean
    Expires?: number
    Method?: string
    Query?: Record<string, string>
    Headers?: Record<string, string>
    Protocol?: string
    Domain?: string
  }

  interface GetObjectUrlResult {
    Url: string
  }

  interface GetBucketParams {
    Bucket: string
    Region: string
    Prefix?: string
    Delimiter?: string
    Marker?: string
    MaxKeys?: number
    EncodingType?: string
  }

  interface GetBucketResult {
    Name: string
    Prefix: string
    Marker: string
    MaxKeys: string
    IsTruncated: string
    NextMarker?: string
    Contents: Array<{
      Key: string
      LastModified: string
      ETag: string
      Size: string
      Owner: {
        ID: string
        DisplayName: string
      }
      StorageClass: string
    }>
    CommonPrefixes?: Array<{
      Prefix: string
    }>
    statusCode: number
    headers: Record<string, string>
  }

  interface DeleteObjectParams {
    Bucket: string
    Region: string
    Key: string
    VersionId?: string
  }

  interface DeleteObjectResult {
    statusCode: number
    headers: Record<string, string>
  }

  type Callback<T> = (err: Error | null, data: T) => void

  class COS {
    constructor(options: COSOptions)
    
    headBucket(params: HeadBucketParams, callback: Callback<any>): void
    headObject(params: HeadObjectParams, callback: Callback<any>): void
    putObject(params: PutObjectParams, callback: Callback<PutObjectResult>): void
    getObjectUrl(params: GetObjectUrlParams, callback: Callback<GetObjectUrlResult>): void
    getBucket(params: GetBucketParams, callback: Callback<GetBucketResult>): void
    deleteObject(params: DeleteObjectParams, callback: Callback<DeleteObjectResult>): void
  }

  export = COS
}
