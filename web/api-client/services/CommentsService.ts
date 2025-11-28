/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { dto_CommentListResponse } from '../models/dto_CommentListResponse';
import type { dto_CommentResponse } from '../models/dto_CommentResponse';
import type { dto_CreateCommentRequest } from '../models/dto_CreateCommentRequest';
import type { dto_GuestReplyRequest } from '../models/dto_GuestReplyRequest';
import type { dto_ReplyCommentRequest } from '../models/dto_ReplyCommentRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CommentsService {
    /**
     * Delete a comment (admin only)
     * @param id Comment ID
     * @returns dto_APIResponse OK
     * @throws ApiError
     */
    public static deleteComments(
        id: string,
    ): CancelablePromise<dto_APIResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/comments/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Reply to a comment (public)
     * @param id Comment ID
     * @param reply Reply data
     * @returns any Created
     * @throws ApiError
     */
    public static postCommentsGuestReply(
        id: string,
        reply: dto_GuestReplyRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_CommentResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/comments/{id}/guest-reply',
            path: {
                'id': id,
            },
            body: reply,
        });
    }
    /**
     * Reply to a comment (admin only)
     * @param id Comment ID
     * @param reply Reply data
     * @returns any Created
     * @throws ApiError
     */
    public static postCommentsReply(
        id: string,
        reply: dto_ReplyCommentRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_CommentResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/comments/{id}/reply',
            path: {
                'id': id,
            },
            body: reply,
        });
    }
    /**
     * Get comments for a post
     * @param id Post ID
     * @param page Page number
     * @param pageSize Page size
     * @returns any OK
     * @throws ApiError
     */
    public static getPostsComments(
        id: string,
        page: number = 1,
        pageSize: number = 20,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_CommentListResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/posts/{id}/comments',
            path: {
                'id': id,
            },
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * Create a comment on a post
     * @param id Post ID
     * @param comment Comment data
     * @returns any Created
     * @throws ApiError
     */
    public static postPostsComments(
        id: string,
        comment: dto_CreateCommentRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_CommentResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/posts/{id}/comments',
            path: {
                'id': id,
            },
            body: comment,
        });
    }
}
