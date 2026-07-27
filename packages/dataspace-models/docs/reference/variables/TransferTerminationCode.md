# Variable: TransferTerminationCode

> `const` **TransferTerminationCode**: `object`

Machine-readable codes set on provider-initiated TransferTerminationMessages
by the control plane's transfer lifecycle policies.

## Type Declaration

### IdleTimeout {#idletimeout}

> `readonly` **IdleTimeout**: `"idleTimeout"` = `"idleTimeout"`

A Provider-side STARTED transfer had no data-plane activity within the configured idle window.
