// Copyright 2025 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { ComponentFactory } from "@twin.org/core";
import type { INegotiationCallback } from "@twin.org/dataspace-models";
import type { ILoggingComponent } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { OdrlPolicyHelper, type IPolicyRequester } from "@twin.org/rights-management-models";
import {
	DataspaceProtocolContractNegotiationStateType,
	type IDataspaceProtocolAgreement,
	type IDataspaceProtocolOffer
} from "@twin.org/standards-dataspace-protocol";
import type { INegotiationState } from "./models/INegotiationState.js";

/**
 * Policy Requester for Dataspace Control Plane.
 *
 * Handles contract negotiation callbacks from PNP and forwards state changes
 * to the control plane service via the INegotiationCallback interface.
 *
 * Callback Flow:
 * 1. Control Plane initiates negotiation via PNP.sendRequestToProvider()
 * 2. PNP calls offer() → auto-accept, notify control plane
 * 3. PNP calls agreement() → store agreement, notify control plane
 * 4. PNP calls finalised() → notify control plane with agreementId
 * 5. Control plane notifies upstream caller (e.g. supply-chain)
 */
export class DataspaceControlPlanePolicyRequester implements IPolicyRequester {
	/**
	 * Runtime name for the class.
	 */
	public static readonly CLASS_NAME: string = nameof<DataspaceControlPlanePolicyRequester>();

	/**
	 * The logging component.
	 * @internal
	 */
	private readonly _loggingComponent?: ILoggingComponent;

	/**
	 * Callback interface for notifying the control plane of negotiation state changes.
	 * @internal
	 */
	private readonly _callback?: INegotiationCallback;

	/**
	 * Active negotiations tracked in memory.
	 * Key: negotiationId
	 * Value: Negotiation state
	 * @internal
	 */
	private readonly _negotiations: Map<string, INegotiationState>;

	/**
	 * Create a new instance of DataspaceControlPlanePolicyRequester.
	 * @param loggingComponentType Optional logging component type.
	 * @param callback Optional callback interface for state change notifications.
	 */
	constructor(loggingComponentType?: string, callback?: INegotiationCallback) {
		this._loggingComponent = ComponentFactory.getIfExists<ILoggingComponent>(loggingComponentType);
		this._callback = callback;
		this._negotiations = new Map();
	}

	/**
	 * Returns the class name of the component.
	 * @returns The class name of the component.
	 */
	public className(): string {
		return DataspaceControlPlanePolicyRequester.CLASS_NAME;
	}

	/**
	 * Register a negotiation for tracking.
	 * Called by the control plane service after initiating a negotiation via PNP.
	 * @param negotiationId The negotiation ID returned by PNP.sendRequestToProvider().
	 */
	public trackNegotiation(negotiationId: string): void {
		const now = Date.now();
		this._negotiations.set(negotiationId, {
			negotiationId,
			state: DataspaceProtocolContractNegotiationStateType.REQUESTED,
			startedAt: now,
			updatedAt: now
		});
	}

	/**
	 * Get all active negotiations (for stalled cleanup).
	 * @returns Map of negotiationId to negotiation state.
	 */
	public getActiveNegotiations(): Map<string, INegotiationState> {
		return this._negotiations;
	}

	/**
	 * Remove a negotiation from tracking (for cleanup).
	 * @param negotiationId The negotiation ID to remove.
	 */
	public removeNegotiation(negotiationId: string): void {
		this._negotiations.delete(negotiationId);
	}

	/**
	 * A policy has been offered by a provider.
	 * Called by PNP when provider sends an OfferMessage.
	 * @param negotiationId The id of the negotiation.
	 * @param offer The offer sent by the provider.
	 * @returns True if the offer was accepted, false otherwise.
	 */
	public async offer(negotiationId: string, offer: IDataspaceProtocolOffer): Promise<boolean> {
		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
			ts: Date.now(),
			message: "offerReceived",
			data: {
				negotiationId,
				offerId: offer["@id"]
			}
		});

		const negotiation = this._negotiations.get(negotiationId);
		if (negotiation) {
			negotiation.state = DataspaceProtocolContractNegotiationStateType.OFFERED;
			negotiation.updatedAt = Date.now();
		}

		await this._callback?.onStateChanged(
			negotiationId,
			DataspaceProtocolContractNegotiationStateType.OFFERED,
			{ offer }
		);

		return true;
	}

	/**
	 * A policy agreement has been sent by a provider.
	 * Called by PNP when provider sends an AgreementMessage.
	 * @param negotiationId The id of the negotiation.
	 * @param agreement The agreement sent by the provider.
	 * @returns True if the agreement was accepted, false otherwise.
	 */
	public async agreement(
		negotiationId: string,
		agreement: IDataspaceProtocolAgreement
	): Promise<boolean> {
		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
			ts: Date.now(),
			message: "agreementReceived",
			data: {
				negotiationId,
				agreementId: OdrlPolicyHelper.getUid(agreement) ?? ""
			}
		});

		const negotiation = this._negotiations.get(negotiationId);
		if (negotiation) {
			negotiation.state = DataspaceProtocolContractNegotiationStateType.AGREED;
			negotiation.agreement = agreement;
			negotiation.updatedAt = Date.now();
		}

		await this._callback?.onStateChanged(
			negotiationId,
			DataspaceProtocolContractNegotiationStateType.AGREED,
			{ agreement }
		);

		return true;
	}

	/**
	 * A policy finalisation has been sent by a provider.
	 * Called by PNP when provider sends a FinalizedEvent.
	 * @param negotiationId The id of the negotiation.
	 * @returns A promise that resolves when all finalisation callbacks have been notified.
	 */
	public async finalised(negotiationId: string): Promise<void> {
		await this._loggingComponent?.log({
			level: "info",
			source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
			ts: Date.now(),
			message: "negotiationFinalized",
			data: { negotiationId }
		});

		const negotiation = this._negotiations.get(negotiationId);
		if (negotiation) {
			negotiation.state = DataspaceProtocolContractNegotiationStateType.FINALIZED;
			negotiation.updatedAt = Date.now();

			const agreementId = OdrlPolicyHelper.getUid(negotiation.agreement);
			this._negotiations.delete(negotiationId);

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
				ts: Date.now(),
				message: "negotiationCompleted",
				data: {
					negotiationId,
					agreementId,
					durationMs: Date.now() - negotiation.startedAt
				}
			});

			if (agreementId) {
				await this._callback?.onStateChanged(
					negotiationId,
					DataspaceProtocolContractNegotiationStateType.FINALIZED,
					{ agreement: negotiation.agreement }
				);

				await this._callback?.onFinalized(negotiationId, agreementId);
			} else {
				await this._callback?.onFailed(negotiationId, "negotiationFinalizedNoAgreement");
			}
		} else {
			await this._loggingComponent?.log({
				level: "warn",
				source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
				ts: Date.now(),
				message: "unknownNegotiationFinalized",
				data: { negotiationId }
			});
		}
	}

	/**
	 * A policy termination has been sent by a provider.
	 * Called by PNP when provider sends a TerminatedMessage or negotiation fails.
	 * @param negotiationId The id of the negotiation.
	 * @returns A promise that resolves when all termination callbacks have been notified.
	 */
	public async terminated(negotiationId: string): Promise<void> {
		await this._loggingComponent?.log({
			level: "warn",
			source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
			ts: Date.now(),
			message: "negotiationTerminated",
			data: { negotiationId }
		});

		const negotiation = this._negotiations.get(negotiationId);
		if (negotiation) {
			negotiation.state = DataspaceProtocolContractNegotiationStateType.TERMINATED;
			negotiation.updatedAt = Date.now();

			this._negotiations.delete(negotiationId);

			await this._loggingComponent?.log({
				level: "info",
				source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
				ts: Date.now(),
				message: "negotiationRejected",
				data: {
					negotiationId,
					durationMs: Date.now() - negotiation.startedAt
				}
			});

			await this._callback?.onFailed(negotiationId, "negotiationTerminatedByProvider");
		} else {
			await this._loggingComponent?.log({
				level: "warn",
				source: DataspaceControlPlanePolicyRequester.CLASS_NAME,
				ts: Date.now(),
				message: "unknownNegotiationTerminated",
				data: { negotiationId }
			});
		}
	}
}
