/**
 * transporters
 *
 * @ignore
 */

import * as createDebug from 'debug';
import * as httpStatus from 'http-status';
import * as fetch from 'isomorphic-fetch';

const debug = createDebug('sasaki-api:transporters');
// tslint:disable-next-line
const pkg = require('../package.json');

export interface ITransporter {
    fetch(url: string, options: RequestInit): Promise<any>;
}

/**
 * RequestError
 */
export class RequestError extends Error {
    public code: number;
    public errors: Error[];
}

/**
 * DefaultTransporter
 */
export class DefaultTransporter {
    /**
     * Default user agent.
     */
    public static readonly USER_AGENT: string = `sasaki-api-javascript-client/${pkg.version}`;

    public expectedStatusCodes: number[];

    constructor(expectedStatusCodes: number[]) {
        this.expectedStatusCodes = expectedStatusCodes;
    }

    /**
     * Configures request options before making a request.
     */
    public static CONFIGURE(options: RequestInit): RequestInit {
        // set transporter user agent
        options.headers = (options.headers !== undefined) ? options.headers : {};
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = DefaultTransporter.USER_AGENT;
        } else if (options.headers['User-Agent'].indexOf(DefaultTransporter.USER_AGENT) === -1) {
            options.headers['User-Agent'] = `${options.headers['User-Agent']} ${DefaultTransporter.USER_AGENT}`;
        }

        return options;
    }

    /**
     * Makes a request with given options and invokes callback.
     */
    public async fetch(url: string, options: RequestInit) {
        const fetchOptions = DefaultTransporter.CONFIGURE(options);

        console.log('fetching...', fetchOptions);
        return await fetch(url, fetchOptions).then((response) => this.wrapCallback(response));
    }

    /**
     * Wraps the response callback.
     */
    private async wrapCallback(response: Response): Promise<any> {
        let err: RequestError = new RequestError('An unexpected error occurred');

        debug('request processed', response.status, response.body);
        if (this.expectedStatusCodes.indexOf(response.status) < 0) {
            if (response.status >= httpStatus.UNAUTHORIZED) {
                // Consider all 4xx and 5xx responses errors.
                err = new RequestError(await response.text());
                err.code = response.status;
            } else {
                const body = await response.json();
                if (typeof body === 'object' && body.errors !== undefined) {
                    err = new RequestError((<any[]>body.errors).map((error) => `${error.title}:${error.detail}`).join('\n'));
                    err.code = response.status;
                    err.errors = body.errors;
                }
            }
        } else {
            if (response.status === httpStatus.NO_CONTENT) {
                // consider 204
                return;
            } else {
                const body = await response.json();
                if (body !== undefined && body.data !== undefined) {
                    // consider 200,201,404
                    return body.data;
                }
            }
        }

        throw err;
    }
}
