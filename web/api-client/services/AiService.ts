/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_AIGenerationResponse } from '../models/dto_AIGenerationResponse';
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { dto_ChatRequest } from '../models/dto_ChatRequest';
import type { dto_GenerateExcerptRequest } from '../models/dto_GenerateExcerptRequest';
import type { dto_GenerateReadTimeRequest } from '../models/dto_GenerateReadTimeRequest';
import type { dto_GenerateTagsRequest } from '../models/dto_GenerateTagsRequest';
import type { dto_SummarizePostRequest } from '../models/dto_SummarizePostRequest';
import type { dto_TagsGenerationResponse } from '../models/dto_TagsGenerationResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
    /**
     * Chat with AI assistant
     * @param request Chat message
     * @returns any OK
     * @throws ApiError
     */
    public static postAiChat(
        request: dto_ChatRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_AIGenerationResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/chat',
            body: request,
        });
    }
    /**
     * Stream chat with AI assistant (SSE)
     * @param request Chat message
     * @returns void
     * @throws ApiError
     */
    public static postAiChatStream(
        request: dto_ChatRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/chat/stream',
            body: request,
        });
    }
    /**
     * Generate excerpt for content
     * @param request Content to summarize
     * @returns any OK
     * @throws ApiError
     */
    public static postAiExcerpt(
        request: dto_GenerateExcerptRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_AIGenerationResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/excerpt',
            body: request,
        });
    }
    /**
     * Generate reading time estimate
     * @param request Content to analyze
     * @returns any OK
     * @throws ApiError
     */
    public static postAiReadtime(
        request: dto_GenerateReadTimeRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_AIGenerationResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/readtime',
            body: request,
        });
    }
    /**
     * Summarize a blog post
     * @param request Post to summarize
     * @returns any OK
     * @throws ApiError
     */
    public static postAiSummarize(
        request: dto_SummarizePostRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_AIGenerationResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/summarize',
            body: request,
        });
    }
    /**
     * Generate tags for content
     * @param request Content to analyze
     * @returns any OK
     * @throws ApiError
     */
    public static postAiTags(
        request: dto_GenerateTagsRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_TagsGenerationResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/ai/tags',
            body: request,
        });
    }
}
