export function PlaneSeparationDiagram() {
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
				Control Plane / Data Plane Separation
			</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Control Plane - agreements and state</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Negotiates ODRL agreements via the policy negotiation point, manages transfer process
						lifecycle over Dataspace Protocol messages, publishes datasets to the federated
						catalogue. Never touches payload data.
					</div>
				</div>
				<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Shared Transfer Process Store</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Transfer process entities (role, parties, agreement, format, state) written by the
						control plane, validated by the data plane on every access.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Data Plane - payload movement</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Serves entity queries, receives inbox activities, manages push subscriptions, records
						activity logs. Every payload passes the policy enforcement point.
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
					<strong>Dataspace Apps</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Application components that own the data, resolved through the app factory and executed
						by background task runners.
					</div>
				</div>
			</div>
		</div>
	);
}

export function TransferFormatsDiagram() {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #122457 0%, #0d1b43 100%)',
				borderRadius: '12px',
				padding: '16px',
				margin: '1rem 0 1.5rem'
			}}
		>
			<p style={{ margin: '0 0 12px', color: '#ffffff', fontWeight: 700 }}>Transfer Formats</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>HttpData-PULL</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Provider issues a token-bearing data address; the consumer queries the provider data
						plane endpoint on demand while the transfer is started.
					</div>
				</div>
				<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>HttpData-PUSH</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Consumer supplies its inbox address; the provider subscribes the app to new data and
						pushes Activity Streams deliveries to the consumer inbox.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>HttpData-POST</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Provider returns its own inbox address and signed token; the consumer posts
						contributions to the provider under the agreement.
					</div>
				</div>
			</div>
		</div>
	);
}
