/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { dto_AdminResponse } from '../models/dto_AdminResponse';
import type { dto_APIResponse } from '../models/dto_APIResponse';
import type { dto_LoginRequest } from '../models/dto_LoginRequest';
import type { dto_LoginResponse } from '../models/dto_LoginResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Admin login
     * @param credentials Login credentials
     * @returns any OK
     * @throws ApiError
     */
    public static postAuthLogin(
        credentials: dto_LoginRequest,
    ): CancelablePromise<(dto_APIResponse & {
        data?: dto_LoginResponse;
    })> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/auth/login',
            body: credentials,
        });
    }
    /**
     * Get current logged in user
     * @returns any OK
     * @throws ApiError
     */
    public static getAuthMe(): CancelablePromise<(dto_APIResponse & {
        data?: dto_AdminResponse;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/me',
        });
    }
}
