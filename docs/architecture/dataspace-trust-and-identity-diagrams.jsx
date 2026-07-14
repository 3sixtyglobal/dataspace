export function TrustDataFlowDiagram() {
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
				Trust Data Flow: Negotiation to Enforcement
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
					Caller presents a JWT verifiable credential as the bearer trust payload on each protocol
					message.
				</li>
				<li>
					Trust verifiers check expiry, resolve the issuer DID on the ledger, verify signature and
					revocation, and apply allow/deny lists.
				</li>
				<li>
					The policy negotiation point captures the verified identity and credential attributes
					during contract negotiation.
				</li>
				<li>
					On finalisation the verification data is persisted onto the ODRL agreement as its trust
					data.
				</li>
				<li>
					At data access time the enforcement point passes the trust data into the decision point,
					where constraints evaluate against the verified attributes.
				</li>
			</ol>
		</div>
	);
}
