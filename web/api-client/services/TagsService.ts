/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { dto_CreateTagRequest } from '../models/dto_CreateTagRequest';
import type { dto_TagListResponse } from '../models/dto_TagListResponse';
import type { dto_TagResponse } from '../models/dto_TagResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TagsService {
    /**
     * Get all tags
     * @returns any OK
     * @throws ApiError
     */
    public static getTags(): CancelablePromise<(dto_APIResponse & {
        data?: dto_TagListResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/tags',
        });
    }
    /**
     * Create a new tag
     * @param tag Tag data
     * @returns any Created
     * @throws ApiError
     */
    public static postTags(
        tag: dto_CreateTagRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_TagResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/tags',
            body: tag,
        });
    }
    /**
     * Delete a tag
     * @param id Tag ID
     * @returns dto_APIResponse OK
     * @throws ApiError
     */
    public static deleteTags(
        id: string,
    ): CancelablePromise<dto_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/tags/{id}',
            path: {
                'id': id,
            },
        });
    }
}
