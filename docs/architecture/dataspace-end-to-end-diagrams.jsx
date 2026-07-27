export function ExchangeLifecycleDiagram() {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #122457 0%, #0d1b43 100%)',
				borderRadius: '12px',
				padding: '16px',
				margin: '1rem 0 1.5rem'
			}}
		>
			<p style={{ margin: '0 0 12px', color: '#ffffff', fontWeight: 700 }}>
				End-to-End Exchange Lifecycle
			</p>
			<ol
				style={{
					margin: 0,
					paddingLeft: '1.2rem',
					color: '#f7faff',
					display: 'grid',
					gap: '8px'
				}}
			>
				<li>
					<strong>Register</strong> - participants create DIDs on the ledger, configure trust
					verifiers, and register dataspace apps.
				</li>
				<li>
					<strong>Publish</strong> - the provider registers a DCAT dataset with an ODRL offer in the
					federated catalogue; only metadata moves.
				</li>
				<li>
					<strong>Discover</strong> - the consumer queries the catalogue and obtains the dataset id,
					offer id, and provider endpoint.
				</li>
				<li>
					<strong>Negotiate</strong> - the policy negotiation points run the Dataspace Protocol
					contract negotiation; the finalised ODRL agreement is persisted with its trust data.
				</li>
				<li>
					<strong>Transfer</strong> - transfer processes are created on both sides, the provider
					issues the data address, and data flows with every payload policy-enforced.
				</li>
				<li>
					<strong>Audit</strong> - negotiation history, activity logs, decision logs, and obligation
					logs reconstruct the exchange.
				</li>
			</ol>
		</div>
	);
}

export function LifecycleStatesDiagram() {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #122457 0%, #0d1b43 100%)',
				borderRadius: '12px',
				padding: '16px',
				margin: '1rem 0 1.5rem'
			}}
		>
			<p style={{ margin: '0 0 12px', color: '#ffffff', fontWeight: 700 }}>
				Negotiation and Transfer State Machines
			</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Contract negotiation</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
						REQUESTED → OFFERED → ACCEPTED → AGREED → VERIFIED → FINALIZED
					</div>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Either side may move the negotiation to TERMINATED at any point before finalisation.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Transfer process</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem', fontFamily: 'monospace' }}>
						REQUESTED → STARTED → COMPLETED
					</div>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						STARTED may move to SUSPENDED and back to STARTED; REQUESTED, STARTED, and SUSPENDED may
						move to TERMINATED. Data flows only while STARTED.
					</div>
				</div>
			</div>
		</div>
	);
}
