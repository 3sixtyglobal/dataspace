# Variable: AgreementSweepReason

> `const` **AgreementSweepReason**: `object`

Reasons an agreement is skipped or removed by the control plane, reported in logs.

## Type Declaration

### ActiveTransfer {#activetransfer}

> `readonly` **ActiveTransfer**: `"activeTransfer"` = `"activeTransfer"`

A live transfer (REQUESTED, STARTED or SUSPENDED) references the agreement.

### RecentActivity {#recentactivity}

> `readonly` **RecentActivity**: `"recentActivity"` = `"recentActivity"`

A referencing transfer or the agreement itself changed within the unused window.

### NoId {#noid}

> `readonly` **NoId**: `"noId"` = `"noId"`

The policy record carries no id, so it cannot be evaluated or removed.

### RecentAgreement {#recentagreement}

> `readonly` **RecentAgreement**: `"recentAgreement"` = `"recentAgreement"`

The agreement has no referencing transfers but is younger than the unused window.

### NoTimestamp {#notimestamp}

> `readonly` **NoTimestamp**: `"noTimestamp"` = `"noTimestamp"`

The agreement has no referencing transfers and no timestamps, so its age cannot be judged.

### Unused {#unused}

> `readonly` **Unused**: `"unused"` = `"unused"`

Every referencing transfer is terminal and stale beyond the unused window.

### NeverReferenced {#neverreferenced}

> `readonly` **NeverReferenced**: `"neverReferenced"` = `"neverReferenced"`

No transfer references the agreement and it is older than the unused window.

### UnknownAtProvider {#unknownatprovider}

> `readonly` **UnknownAtProvider**: `"unknownAtProvider"` = `"unknownAtProvider"`

The provider rejected a transfer request because it no longer holds the agreement.
