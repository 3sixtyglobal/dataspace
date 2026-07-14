export function ComponentLandscapeDiagram() {
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
				Dataspace Component Landscape
			</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
					<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
						<strong>Connector Control Plane</strong>
						<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
							Contract negotiation, transfer process lifecycle, dataset publication, protocol
							version discovery.
						</div>
					</div>
					<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
						<strong>Connector Data Plane</strong>
						<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
							Policy-filtered data access, activity inbox, push subscriptions, activity logs.
						</div>
					</div>
				</div>
				<div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
					<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
						<strong>Federated Catalogue</strong>
						<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
							DCAT dataset registry with ODRL offers, queried via Dataspace Protocol catalogue
							messages.
						</div>
					</div>
					<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
						<strong>Rights Management</strong>
						<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
							Policy administration, negotiation, decision, enforcement, information, management,
							and execution points.
						</div>
					</div>
				</div>
				<div
					style={{
						background: '#1a3370',
						color: '#eef4ff',
						borderRadius: '8px',
						padding: '10px 12px'
					}}
				>
					<strong>Trust and Identity</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						DIDs on the IOTA Rebased ledger, verifiable credential trust payloads verifying every
						cross-participant call.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Shared Foundations</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Shared models and entities, standards vocabularies (Dataspace Protocol, ODRL, DCAT),
						REST and socket clients, node runtime.
					</div>
				</div>
			</div>
		</div>
	);
}
