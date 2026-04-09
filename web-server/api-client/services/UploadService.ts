/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { v1_UploadResponse } from '../models/v1_UploadResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UploadService {
    /**
     * Upload a file to OSS
     * Upload a binary file and return the public URL
     * @param file File to upload
     * @returns any OK
     * @throws ApiError
     */
    public static postUpload(
        file: Blob,
    ): CancelablePromise<(dto_APIResponse & {
        data?: v1_UploadResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/upload',
            formData: {
                'file': file,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
}
