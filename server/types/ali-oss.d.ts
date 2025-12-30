declare module 'ali-oss' {
  interface OSSOptions {
    region?: string
    accessKeyId: string
    accessKeySecret: string
    bucket?: string
    endpoint?: string
    secure?: boolean
    timeout?: number | string
    cname?: boolean
    isRequestPay?: boolean
    stsToken?: string
    refreshSTSToken?: () => Promise<{ accessKeyId: string; accessKeySecret: string; stsToken: string }>
    refreshSTSTokenInterval?: number
  }

  interface PutOptions {
    mime?: string
    meta?: Record<string, string>
    headers?: Record<string, string>
    callback?: {
      url: string
      host?: string
      body: string
      contentType?: string
      customValue?: Record<string, string>
    }
  }

  interface PutResult {
    name: string
    url: string
    res: {
      status: number
      statusCode: number
      headers: Record<string, string>
    }
  }

  interface ListOptions {
    prefix?: string
    marker?: string
    delimiter?: string
    'max-keys'?: number
  }

  interface ListResult {
    objects?: Array<{
      name: string
      url: string
      lastModified: string
      etag: string
      type: string
      size: number
      storageClass: string
      owner?: {
        id: string
        displayName: string
      }
    }>
    prefixes?: string[]
    isTruncated: boolean
    nextMarker?: string
    res: {
      status: number
      statusCode: number
      headers: Record<string, string>
    }
  }

  interface SignatureUrlOptions {
    expires?: number
    method?: string
    process?: string
    response?: {
      'content-type'?: string
      'content-disposition'?: string
      'cache-control'?: string
    }
  }

  interface HeadResult {
    meta: Record<string, string>
    res: {
      status: number
      statusCode: number
      headers: Record<string, string>
    }
    status: number
  }

  interface BucketInfo {
    bucket: {
      Location: string
      Name: string
      StorageClass: string
      CreationDate: string
      ExtranetEndpoint: string
      IntranetEndpoint: string
      Owner: {
        ID: string
        DisplayName: string
      }
    }
  }

  class OSS {
    constructor(options: OSSOptions)
    
    put(name: string, file: Buffer | string, options?: PutOptions): Promise<PutResult>
    get(name: string, file?: string | WriteStream, options?: Record<string, any>): Promise<{ content: Buffer; res: any }>
    head(name: string, options?: Record<string, any>): Promise<HeadResult>
    delete(name: string, options?: Record<string, any>): Promise<{ res: any }>
    list(query?: ListOptions, options?: Record<string, any>): Promise<ListResult>
    signatureUrl(name: string, options?: SignatureUrlOptions): string
    getBucketInfo(bucket: string): Promise<BucketInfo>
    useBucket(bucket: string): void
  }

  export = OSS
}
