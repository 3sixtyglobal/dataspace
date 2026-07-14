export function EntryLifecycleDiagram() {
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
				Catalogue Entry Lifecycle
			</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Authorise</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Verify the bearer trust payload; the verified identity becomes the entry owner.
					</div>
				</div>
				<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Validate</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Normalise the id, require type and publisher, enforce Dataspace Protocol conformance
						(distribution, access service, offer).
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
					<strong>Store</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Compact to prefixed JSON-LD, serialise writes per dataset, reject non-owner updates,
						bake the owning organisation into distribution endpoints, invoke the filter plugins.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>Query / Remove</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Filter plugins answer queries as Dataspace Protocol catalogues grouped by publisher;
						entries persist until removed by their owner.
					</div>
				</div>
			</div>
		</div>
	);
}
