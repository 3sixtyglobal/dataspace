// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { HttpErrorHelper } from "@twin.org/api-models";
import { BaseError, type IError, Is } from "@twin.org/core";
import { getJsonLdType } from "@twin.org/dataspace-models";
import {
	DataspaceProtocolCatalogTypes,
	DataspaceProtocolContexts,
	DataspaceProtocolTransferProcessTypes,
	type IDataspaceProtocolCatalogError,
	type IDataspaceProtocolTransferError
} from "@twin.org/standards-dataspace-protocol";
import { HttpStatusCode } from "@twin.org/web";

/**
 * Fallback value used when PIDs cannot be extracted from a malformed message.
 * DSP protocol requires consumerPid and providerPid in TransferError responses,
 * so we must provide a value even when the request is completely malformed.
 */
const UNKNOWN_PID = "urn:dsp:unknown";

/**
 * Transform an error to DS Protocol TransferError format.
 * Used by both service and route layers to ensure consistent error responses.
 * Following the same pattern as Federated Catalogue's catalogErrorUtils.ts.
 * The code property uses semantic format "ErrorName:message".
 * The reason property contains the full flattened error chain for debugging.
 * @param error The error to transform.
 * @param pids Optional object containing consumerPid and/or providerPid.
 * @param pids.consumerPid Optional consumer process ID.
 * @param pids.providerPid Optional provider process ID.
 * @returns The TransferError.
 */
export function transformToTransferError(
	error: unknown,
	pids?: { consumerPid?: string; providerPid?: string }
): IDataspaceProtocolTransferError {
	const flattened = BaseError.flatten(error);

	return {
		"@context": [DataspaceProtocolContexts.Context],
		"@type": DataspaceProtocolTransferProcessTypes.TransferError,
		consumerPid: pids?.consumerPid ?? UNKNOWN_PID,
		providerPid: pids?.providerPid ?? UNKNOWN_PID,
		code: `${flattened[0].name}:${flattened[0].message}`,
		reason: flattened
	};
}

/**
 * Transform the DS Protocol result to an HTTP status code.
 * Used by the routes layer to derive HTTP status from TransferError.
 *
 * @param result The result to transform.
 * @returns The transformed status code or undefined if no transformation was found or not an error.
 */
export function transformErrorToStatusCode(result: unknown): HttpStatusCode | undefined {
	// Is this a transfer error?
	if (
		Is.object<IDataspaceProtocolTransferError>(result) &&
		result["@type"] === DataspaceProtocolTransferProcessTypes.TransferError
	) {
		// Extract the error name to map to status codes
		if (result.code) {
			const codePart = result.code.split(":")[0];
			return HttpErrorHelper.ERROR_TYPE_MAP[codePart] ?? HttpStatusCode.badRequest;
		}
		return HttpStatusCode.badRequest;
	}

	// Regular error
	if (Is.object<IError>(result) && !BaseError.isEmpty(result)) {
		return HttpErrorHelper.ERROR_TYPE_MAP[result.name] ?? HttpStatusCode.badRequest;
	}

	return undefined;
}

/**
 * Check if a CatalogError contains a specific error name in its code.
 * @param error The CatalogError to check.
 * @param errorName The error name to check for (e.g., NotFoundError.CLASS_NAME).
 * @returns True if the error code contains the specified error name.
 */
export function isCatalogErrorName(
	error: IDataspaceProtocolCatalogError,
	errorName: string
): boolean {
	return error.code?.includes(errorName) ?? false;
}

/**
 * Check if a CatalogError contains a specific error name in its code.
 * @param error The CatalogError to check.
 * @returns True if the error code contains the specified error name.
 */
export function isCatalogError(error: unknown): error is IDataspaceProtocolCatalogError {
	return getJsonLdType(error) === DataspaceProtocolCatalogTypes.CatalogError;
}
