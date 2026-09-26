# Changelog

## [0.10.1-next.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.10.1-next.2...dataspace-control-plane-rest-client-v0.10.1-next.3) (2026-09-26)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.10.1-next.2 to 0.10.1-next.3

## [0.10.1-next.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.10.1-next.1...dataspace-control-plane-rest-client-v0.10.1-next.2) (2026-09-18)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.10.1-next.1 to 0.10.1-next.2

## [0.10.1-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.10.1-next.0...dataspace-control-plane-rest-client-v0.10.1-next.1) (2026-09-17)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* linting and dependency update ([adf8ee0](https://github.com/iotaledger/twin-dataspace/commit/adf8ee04f657f22fb051978591749a4cf19d67a1))
* pap queries ([#372](https://github.com/iotaledger/twin-dataspace/issues/372)) ([923583f](https://github.com/iotaledger/twin-dataspace/commit/923583f754e525bb87d9022093d1808001421b06))
* provider-side idle lifecycle policy for STARTED data transfers ([#284](https://github.com/iotaledger/twin-dataspace/issues/284)) ([a9312ef](https://github.com/iotaledger/twin-dataspace/commit/a9312ef7573a92805c99cb2a314e8b289a6ab195))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* query existing data transfers by agreement to avoid duplicate preparations ([#289](https://github.com/iotaledger/twin-dataspace/issues/289)) ([53fe251](https://github.com/iotaledger/twin-dataspace/commit/53fe2516b2287b6b6a7a6ca6fc6063ea4a446cf0))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.10.1-next.0 to 0.10.1-next.1

## [0.10.0](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.10.0...dataspace-control-plane-rest-client-v0.10.0) (2026-09-16)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* release to production ([#359](https://github.com/iotaledger/twin-dataspace/issues/359)) ([3a2c8ae](https://github.com/iotaledger/twin-dataspace/commit/3a2c8aeeab167c5848536b74453953165e3eeb94))
* release to production ([#368](https://github.com/iotaledger/twin-dataspace/issues/368)) ([7c70a24](https://github.com/iotaledger/twin-dataspace/commit/7c70a24b24a3d2bc7624cb9c1a80b6eeefb1453d))
* release to production [skip ci] ([#378](https://github.com/iotaledger/twin-dataspace/issues/378)) ([9d859c3](https://github.com/iotaledger/twin-dataspace/commit/9d859c31c1705d8337aec72e54c8ef5382e4e208))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))

## [0.9.4-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.4-next.0...dataspace-control-plane-rest-client-v0.9.4-next.1) (2026-09-07)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* linting and dependency update ([adf8ee0](https://github.com/iotaledger/twin-dataspace/commit/adf8ee04f657f22fb051978591749a4cf19d67a1))
* pap queries ([#372](https://github.com/iotaledger/twin-dataspace/issues/372)) ([923583f](https://github.com/iotaledger/twin-dataspace/commit/923583f754e525bb87d9022093d1808001421b06))
* provider-side idle lifecycle policy for STARTED data transfers ([#284](https://github.com/iotaledger/twin-dataspace/issues/284)) ([a9312ef](https://github.com/iotaledger/twin-dataspace/commit/a9312ef7573a92805c99cb2a314e8b289a6ab195))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* query existing data transfers by agreement to avoid duplicate preparations ([#289](https://github.com/iotaledger/twin-dataspace/issues/289)) ([53fe251](https://github.com/iotaledger/twin-dataspace/commit/53fe2516b2287b6b6a7a6ca6fc6063ea4a446cf0))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.4-next.0 to 0.9.4-next.1

## [0.9.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.3...dataspace-control-plane-rest-client-v0.9.3) (2026-09-04)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* release to production ([#359](https://github.com/iotaledger/twin-dataspace/issues/359)) ([3a2c8ae](https://github.com/iotaledger/twin-dataspace/commit/3a2c8aeeab167c5848536b74453953165e3eeb94))
* release to production ([#368](https://github.com/iotaledger/twin-dataspace/issues/368)) ([7c70a24](https://github.com/iotaledger/twin-dataspace/commit/7c70a24b24a3d2bc7624cb9c1a80b6eeefb1453d))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))

## [0.9.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2...dataspace-control-plane-rest-client-v0.9.2) (2026-08-24)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* release to production ([#359](https://github.com/iotaledger/twin-dataspace/issues/359)) ([3a2c8ae](https://github.com/iotaledger/twin-dataspace/commit/3a2c8aeeab167c5848536b74453953165e3eeb94))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))

## [0.9.2-next.11](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.10...dataspace-control-plane-rest-client-v0.9.2-next.11) (2026-08-23)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.10 to 0.9.2-next.11

## [0.9.2-next.10](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.9...dataspace-control-plane-rest-client-v0.9.2-next.10) (2026-08-16)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.9 to 0.9.2-next.10

## [0.9.2-next.9](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.8...dataspace-control-plane-rest-client-v0.9.2-next.9) (2026-08-13)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.8 to 0.9.2-next.9

## [0.9.2-next.8](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.7...dataspace-control-plane-rest-client-v0.9.2-next.8) (2026-08-11)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.7 to 0.9.2-next.8

## [0.9.2-next.7](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.6...dataspace-control-plane-rest-client-v0.9.2-next.7) (2026-08-10)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.6 to 0.9.2-next.7

## [0.9.2-next.6](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.5...dataspace-control-plane-rest-client-v0.9.2-next.6) (2026-08-10)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.5 to 0.9.2-next.6

## [0.9.2-next.5](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.4...dataspace-control-plane-rest-client-v0.9.2-next.5) (2026-08-07)


### Features

* linting and dependency update ([adf8ee0](https://github.com/iotaledger/twin-dataspace/commit/adf8ee04f657f22fb051978591749a4cf19d67a1))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.4 to 0.9.2-next.5

## [0.9.2-next.4](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.3...dataspace-control-plane-rest-client-v0.9.2-next.4) (2026-08-03)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.3 to 0.9.2-next.4

## [0.9.2-next.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.2...dataspace-control-plane-rest-client-v0.9.2-next.3) (2026-07-31)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.2 to 0.9.2-next.3

## [0.9.2-next.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.1...dataspace-control-plane-rest-client-v0.9.2-next.2) (2026-07-30)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.1 to 0.9.2-next.2

## [0.9.2-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.2-next.0...dataspace-control-plane-rest-client-v0.9.2-next.1) (2026-07-28)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side idle lifecycle policy for STARTED data transfers ([#284](https://github.com/iotaledger/twin-dataspace/issues/284)) ([a9312ef](https://github.com/iotaledger/twin-dataspace/commit/a9312ef7573a92805c99cb2a314e8b289a6ab195))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* query existing data transfers by agreement to avoid duplicate preparations ([#289](https://github.com/iotaledger/twin-dataspace/issues/289)) ([53fe251](https://github.com/iotaledger/twin-dataspace/commit/53fe2516b2287b6b6a7a6ca6fc6063ea4a446cf0))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.0 to 0.9.2-next.1

## [0.9.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1...dataspace-control-plane-rest-client-v0.9.1) (2026-07-27)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))

## [0.9.1-next.12](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.11...dataspace-control-plane-rest-client-v0.9.1-next.12) (2026-07-26)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.11 to 0.9.1-next.12

## [0.9.1-next.11](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.10...dataspace-control-plane-rest-client-v0.9.1-next.11) (2026-07-21)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.10 to 0.9.1-next.11

## [0.9.1-next.10](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.9...dataspace-control-plane-rest-client-v0.9.1-next.10) (2026-07-20)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.9 to 0.9.1-next.10

## [0.9.1-next.9](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.8...dataspace-control-plane-rest-client-v0.9.1-next.9) (2026-07-06)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.8 to 0.9.1-next.9

## [0.9.1-next.8](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.7...dataspace-control-plane-rest-client-v0.9.1-next.8) (2026-07-02)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.7 to 0.9.1-next.8

## [0.9.1-next.7](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.6...dataspace-control-plane-rest-client-v0.9.1-next.7) (2026-07-02)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.6 to 0.9.1-next.7

## [0.9.1-next.6](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.5...dataspace-control-plane-rest-client-v0.9.1-next.6) (2026-07-02)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.5 to 0.9.1-next.6

## [0.9.1-next.5](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.4...dataspace-control-plane-rest-client-v0.9.1-next.5) (2026-06-30)


### Features

* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.4 to 0.9.1-next.5

## [0.9.1-next.4](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.3...dataspace-control-plane-rest-client-v0.9.1-next.4) (2026-06-29)


### Features

* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.3 to 0.9.1-next.4

## [0.9.1-next.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.2...dataspace-control-plane-rest-client-v0.9.1-next.3) (2026-06-26)


### Features

* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.2 to 0.9.1-next.3

## [0.9.1-next.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.1...dataspace-control-plane-rest-client-v0.9.1-next.2) (2026-06-26)


### Features

* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.1 to 0.9.1-next.2

## [0.9.1-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.1-next.0...dataspace-control-plane-rest-client-v0.9.1-next.1) (2026-06-26)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.0 to 0.9.1-next.1

## [0.9.0](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.0...dataspace-control-plane-rest-client-v0.9.0) (2026-06-25)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))

## [0.9.0-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.9.0-next.0...dataspace-control-plane-rest-client-v0.9.0-next.1) (2026-06-24)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.0-next.0 to 0.9.0-next.1

## [0.0.3-next.55](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.54...dataspace-control-plane-rest-client-v0.0.3-next.55) (2026-06-23)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.54 to 0.0.3-next.55

## [0.0.3-next.54](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.53...dataspace-control-plane-rest-client-v0.0.3-next.54) (2026-06-23)


### Features

* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.53 to 0.0.3-next.54

## [0.0.3-next.53](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.52...dataspace-control-plane-rest-client-v0.0.3-next.53) (2026-06-23)


### Features

* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.52 to 0.0.3-next.53

## [0.0.3-next.52](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.51...dataspace-control-plane-rest-client-v0.0.3-next.52) (2026-06-21)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.51 to 0.0.3-next.52

## [0.0.3-next.51](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.50...dataspace-control-plane-rest-client-v0.0.3-next.51) (2026-06-19)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.50 to 0.0.3-next.51

## [0.0.3-next.50](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.49...dataspace-control-plane-rest-client-v0.0.3-next.50) (2026-06-19)


### Features

* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.49 to 0.0.3-next.50

## [0.0.3-next.49](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.48...dataspace-control-plane-rest-client-v0.0.3-next.49) (2026-06-19)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.48 to 0.0.3-next.49

## [0.0.3-next.48](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.47...dataspace-control-plane-rest-client-v0.0.3-next.48) (2026-06-18)


### Features

* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.47 to 0.0.3-next.48

## [0.0.3-next.47](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.46...dataspace-control-plane-rest-client-v0.0.3-next.47) (2026-06-17)


### Features

* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.46 to 0.0.3-next.47

## [0.0.3-next.46](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.45...dataspace-control-plane-rest-client-v0.0.3-next.46) (2026-06-17)


### Features

* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.45 to 0.0.3-next.46

## [0.0.3-next.45](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.44...dataspace-control-plane-rest-client-v0.0.3-next.45) (2026-06-17)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.44 to 0.0.3-next.45

## [0.0.3-next.44](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.43...dataspace-control-plane-rest-client-v0.0.3-next.44) (2026-06-12)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.43 to 0.0.3-next.44

## [0.0.3-next.43](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.42...dataspace-control-plane-rest-client-v0.0.3-next.43) (2026-06-11)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.42 to 0.0.3-next.43

## [0.0.3-next.42](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.41...dataspace-control-plane-rest-client-v0.0.3-next.42) (2026-06-10)


### Bug Fixes

* throw not supported error for in-process only control plane methods ([#185](https://github.com/iotaledger/twin-dataspace/issues/185)) ([130f00a](https://github.com/iotaledger/twin-dataspace/commit/130f00a87412b34defde891855bee7aa3ac34130))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.41 to 0.0.3-next.42

## [0.0.3-next.41](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.40...dataspace-control-plane-rest-client-v0.0.3-next.41) (2026-06-08)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.40 to 0.0.3-next.41

## [0.0.3-next.40](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.39...dataspace-control-plane-rest-client-v0.0.3-next.40) (2026-06-08)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.39 to 0.0.3-next.40

## [0.0.3-next.39](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.38...dataspace-control-plane-rest-client-v0.0.3-next.39) (2026-06-04)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.38 to 0.0.3-next.39

## [0.0.3-next.38](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.37...dataspace-control-plane-rest-client-v0.0.3-next.38) (2026-06-03)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.37 to 0.0.3-next.38

## [0.0.3-next.37](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.36...dataspace-control-plane-rest-client-v0.0.3-next.37) (2026-06-03)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.36 to 0.0.3-next.37

## [0.0.3-next.36](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.35...dataspace-control-plane-rest-client-v0.0.3-next.36) (2026-06-02)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.35 to 0.0.3-next.36

## [0.0.3-next.35](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.34...dataspace-control-plane-rest-client-v0.0.3-next.35) (2026-06-02)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.34 to 0.0.3-next.35

## [0.0.3-next.34](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.33...dataspace-control-plane-rest-client-v0.0.3-next.34) (2026-06-01)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.33 to 0.0.3-next.34

## [0.0.3-next.33](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.32...dataspace-control-plane-rest-client-v0.0.3-next.33) (2026-06-01)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.32 to 0.0.3-next.33

## [0.0.3-next.32](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.31...dataspace-control-plane-rest-client-v0.0.3-next.32) (2026-05-29)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.31 to 0.0.3-next.32

## [0.0.3-next.31](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.30...dataspace-control-plane-rest-client-v0.0.3-next.31) (2026-05-27)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.30 to 0.0.3-next.31

## [0.0.3-next.30](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.29...dataspace-control-plane-rest-client-v0.0.3-next.30) (2026-05-26)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.29 to 0.0.3-next.30

## [0.0.3-next.29](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.28...dataspace-control-plane-rest-client-v0.0.3-next.29) (2026-05-20)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.28 to 0.0.3-next.29

## [0.0.3-next.28](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.27...dataspace-control-plane-rest-client-v0.0.3-next.28) (2026-05-12)


### Features

* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.27 to 0.0.3-next.28

## [0.0.3-next.27](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.26...dataspace-control-plane-rest-client-v0.0.3-next.27) (2026-05-08)


### Features

* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.26 to 0.0.3-next.27

## [0.0.3-next.26](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.25...dataspace-control-plane-rest-client-v0.0.3-next.26) (2026-04-14)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.25 to 0.0.3-next.26

## [0.0.3-next.25](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.24...dataspace-control-plane-rest-client-v0.0.3-next.25) (2026-04-10)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.24 to 0.0.3-next.25

## [0.0.3-next.24](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.23...dataspace-control-plane-rest-client-v0.0.3-next.24) (2026-03-31)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.23 to 0.0.3-next.24

## [0.0.3-next.23](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.22...dataspace-control-plane-rest-client-v0.0.3-next.23) (2026-03-25)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.22 to 0.0.3-next.23

## [0.0.3-next.22](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.21...dataspace-control-plane-rest-client-v0.0.3-next.22) (2026-03-20)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.21 to 0.0.3-next.22

## [0.0.3-next.21](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.20...dataspace-control-plane-rest-client-v0.0.3-next.21) (2026-03-17)


### Features

* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.20 to 0.0.3-next.21

## [0.0.3-next.20](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.19...dataspace-control-plane-rest-client-v0.0.3-next.20) (2026-03-17)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.19 to 0.0.3-next.20

## [0.0.3-next.19](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.18...dataspace-control-plane-rest-client-v0.0.3-next.19) (2026-03-12)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.18 to 0.0.3-next.19

## [0.0.3-next.18](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.17...dataspace-control-plane-rest-client-v0.0.3-next.18) (2026-03-09)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.17 to 0.0.3-next.18

## [0.0.3-next.17](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.16...dataspace-control-plane-rest-client-v0.0.3-next.17) (2026-03-06)


### Miscellaneous Chores

* **dataspace-control-plane-rest-client:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.16 to 0.0.3-next.17

## [0.0.3-next.16](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.15...dataspace-control-plane-rest-client-v0.0.3-next.16) (2026-03-02)


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.15 to 0.0.3-next.16

## [0.0.3-next.15](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-rest-client-v0.0.3-next.14...dataspace-control-plane-rest-client-v0.0.3-next.15) (2026-03-02)


### Features

* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.14 to 0.0.3-next.15

## [0.0.3-next.1](https://github.com/iotaledger/twin-data-exchange/compare/data-exchange-rest-client-v0.0.3-next.0...data-exchange-rest-client-v0.0.3-next.1) (2026-01-19)


### Features

* mocking data exchange basic methods ([#5](https://github.com/iotaledger/twin-data-exchange/issues/5)) ([6cb00c0](https://github.com/iotaledger/twin-data-exchange/commit/6cb00c029aacf46da7bed0b3c97a21ef4102784a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/data-exchange-models bumped from 0.0.3-next.0 to 0.0.3-next.1

## Changelog
