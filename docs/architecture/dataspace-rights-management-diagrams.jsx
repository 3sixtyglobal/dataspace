export function EvaluationPipelineDiagram() {
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
				Policy Evaluation Pipeline
			</p>
			<div style={{ display: 'grid', gap: '10px' }}>
				<div style={{ background: '#4b84e0', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>PEP intercepts</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						The data plane hands the payload, agreement, action, and trust data to the enforcement
						point.
					</div>
				</div>
				<div style={{ background: '#e8e8ea', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>PDP gathers context</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Before-stage execution actions run, the information point fans out to its sources, and
						the agreement trust data is merged over the result.
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
					<strong>Arbiters decide</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Profile check, inheritance, rule expansion, constraint evaluation, conflict strategy,
						obligation gate; per-target decisions: Granted or Denied (custom arbiters may emit
						Replace). After-stage execution actions then run inside the decision point.
					</div>
				</div>
				<div style={{ background: '#f6aa42', borderRadius: '8px', padding: '10px 12px' }}>
					<strong>PEP applies decisions</strong>
					<div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
						Enforcement processors build the released payload from the granted targets on a clone,
						substituting replacements where a decision carries one; denied or undecided fields are
						absent.
					</div>
				</div>
			</div>
		</div>
	);
}
