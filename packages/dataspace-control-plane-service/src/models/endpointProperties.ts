// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The properties of an endpoint in a Transfer Process.
 * Determines the configuration and authorization details for the endpoint.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const EndpointProperties = {
	/**
	 * Authorization property - the authorization token for the endpoint.
	 */
	Authorization: "authorization",

	/**
	 * Authorization type - the type of authorization used for the endpoint.
	 */
	AuthType: "authType"
} as const;

/**
 * Type for EndpointProperties values.
 */
export type EndpointProperties = (typeof EndpointProperties)[keyof typeof EndpointProperties];
