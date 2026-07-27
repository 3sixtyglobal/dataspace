# Variable: TransferHandlerFactory

> `const` **TransferHandlerFactory**: `Factory`\<[`ITransferHandler`](../interfaces/ITransferHandler.md)\>

Factory for registering and retrieving format-specific ITransferHandler instances.
Keys are DataspaceTransferFormat values (e.g. "HttpData-PULL").
Throws GeneralError when get() is called with an unregistered format.
