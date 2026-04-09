/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { dto_CreatePostRequest } from '../models/dto_CreatePostRequest';
import type { dto_PostListResponse } from '../models/dto_PostListResponse';
import type { dto_PostResponse } from '../models/dto_PostResponse';
import type { dto_UpdatePostRequest } from '../models/dto_UpdatePostRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PostsService {
    /**
     * Get all posts (Admin)
     * Get all posts including drafts, requires authentication
     * @param page Page number
     * @param pageSize Page size
     * @param status Filter by status: published, draft, all
     * @returns any OK
     * @throws ApiError
     */
    public static getAdminPosts(
        page: number = 1,
        pageSize: number = 10,
        status: string = 'all',
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_PostListResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/admin/posts',
            query: {
                'page': page,
                'page_size': pageSize,
                'status': status,
            },
        });
    }
    /**
     * Get all posts
     * @param page Page number
     * @param pageSize Page size
     * @param tag Filter by tag
     * @param search Search in title/excerpt
     * @param status Filter by status: published, draft, all
     * @returns any OK
     * @throws ApiError
     */
    public static getPosts(
        page: number = 1,
        pageSize: number = 10,
        tag?: string,
        search?: string,
        status?: string,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_PostListResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/posts',
            query: {
                'page': page,
                'page_size': pageSize,
                'tag': tag,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * Create a new post
     * @param post Post data
     * @returns any Created
     * @throws ApiError
     */
    public static postPosts(
        post: dto_CreatePostRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_PostResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/posts',
            body: post,
        });
    }
    /**
     * Get post by ID
     * @param id Post ID
     * @returns any OK
     * @throws ApiError
     */
    public static getPosts1(
        id: string,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_PostResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/posts/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update a post
     * @param id Post ID
     * @param post Post data
     * @returns any OK
     * @throws ApiError
     */
    public static putPosts(
        id: string,
        post: dto_UpdatePostRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_PostResponse;
    })> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/posts/{id}',
            path: {
                'id': id,
            },
            body: post,
        });
    }
    /**
     * Delete a post
     * @param id Post ID
     * @returns dto_APIResponse OK
     * @throws ApiError
     */
    public static deletePosts(
        id: string,
    ): CancelablePromise<dto_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/posts/{id}',
            path: {
                'id': id,
            },
        });
    }
}
