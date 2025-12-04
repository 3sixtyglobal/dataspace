# Interface: IDataAssetQuery

Data Asset query for internal service matching of datasets to apps.

This interface is used internally by the Data Space Connector service to match
datasets with their corresponding apps. Apps should use `datasetsHandled(): IDataset[]`
to declare which datasets they handle.

## See

IDataSpaceConnectorApp.datasetsHandled

## Properties

### datasetId

> **datasetId**: `string`

Id of the dataset in the Federated Catalogue (dataset @id).
