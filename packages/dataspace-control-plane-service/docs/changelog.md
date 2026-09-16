# Changelog

## [0.9.4-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.4-next.0...dataspace-control-plane-service-v0.9.4-next.1) (2026-09-07)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add correlation callbacks ([#354](https://github.com/iotaledger/twin-dataspace/issues/354)) ([d362fb6](https://github.com/iotaledger/twin-dataspace/commit/d362fb6b0816a62f72a77478d78fb3959a437b3c))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transfer handlers ([#259](https://github.com/iotaledger/twin-dataspace/issues/259)) ([06e21b1](https://github.com/iotaledger/twin-dataspace/commit/06e21b179f548f3d93d81192b68ea710e5b9aafb))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* add unused agreement sweep to the control plane ([#344](https://github.com/iotaledger/twin-dataspace/issues/344)) ([8633642](https://github.com/iotaledger/twin-dataspace/commit/86336424ced7aeab3259c78373447074f4140e90))
* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* linting and dependency update ([adf8ee0](https://github.com/iotaledger/twin-dataspace/commit/adf8ee04f657f22fb051978591749a4cf19d67a1))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* pap queries ([#372](https://github.com/iotaledger/twin-dataspace/issues/372)) ([923583f](https://github.com/iotaledger/twin-dataspace/commit/923583f754e525bb87d9022093d1808001421b06))
* provider-side idle lifecycle policy for STARTED data transfers ([#284](https://github.com/iotaledger/twin-dataspace/issues/284)) ([a9312ef](https://github.com/iotaledger/twin-dataspace/commit/a9312ef7573a92805c99cb2a314e8b289a6ab195))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* query existing data transfers by agreement to avoid duplicate preparations ([#289](https://github.com/iotaledger/twin-dataspace/issues/289)) ([53fe251](https://github.com/iotaledger/twin-dataspace/commit/53fe2516b2287b6b6a7a6ca6fc6063ea4a446cf0))
* re-use existing agreement ([#333](https://github.com/iotaledger/twin-dataspace/issues/333)) ([46c9079](https://github.com/iotaledger/twin-dataspace/commit/46c90798f590166f061bf75eb08ea27b76548299))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove engine dependency ([#313](https://github.com/iotaledger/twin-dataspace/issues/313)) ([aec9f60](https://github.com/iotaledger/twin-dataspace/commit/aec9f60d530cd06a73170b3226795a260db8e6f4))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* simplify url construction ([49986d1](https://github.com/iotaledger/twin-dataspace/commit/49986d1b67b58c0918a5744794d06baf6b6c6461))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* transfer process remove inline agreement ([#340](https://github.com/iotaledger/twin-dataspace/issues/340)) ([332eaf6](https://github.com/iotaledger/twin-dataspace/commit/332eaf67e5cf0b13545d013d107658b232ae32ff))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* update well-known fields ([97e73ea](https://github.com/iotaledger/twin-dataspace/commit/97e73ea1c1c442547f130007e17930cec4de3e2b))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))
* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Bug Fixes

* agreement reuse scans every PAP page and removes agreements unknown at the provider ([#363](https://github.com/iotaledger/twin-dataspace/issues/363)) ([70ce644](https://github.com/iotaledger/twin-dataspace/commit/70ce64423f08a9a0a4d463915fe197e8a6f70cac))
* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* data plane path is base not full url for pull ([68092ac](https://github.com/iotaledger/twin-dataspace/commit/68092acf707b6ba6679f5b75d4dc355c6629396c))
* defer catalogue reconciliation to background on startup ([#260](https://github.com/iotaledger/twin-dataspace/issues/260)) ([0824e46](https://github.com/iotaledger/twin-dataspace/commit/0824e465f5cedc9557abad90fb4d18a524210ddd))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* distribution format validation ([#327](https://github.com/iotaledger/twin-dataspace/issues/327)) ([17ce266](https://github.com/iotaledger/twin-dataspace/commit/17ce266756f3725bb721c887e6417f4b79772602))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* guard format ([#319](https://github.com/iotaledger/twin-dataspace/issues/319)) ([cc6f89b](https://github.com/iotaledger/twin-dataspace/commit/cc6f89b8d0fd9a428c3bb5ca4fae6281ce2c7bd0))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* include the TransferError diagnostics in the autoStartFailed log ([#325](https://github.com/iotaledger/twin-dataspace/issues/325)) ([8c9a98f](https://github.com/iotaledger/twin-dataspace/commit/8c9a98f59f4410aa6978b0f70bc9f92b74a56a00))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* keep one TransferProcess record per role in self transfers ([#321](https://github.com/iotaledger/twin-dataspace/issues/321)) ([91ccc87](https://github.com/iotaledger/twin-dataspace/commit/91ccc87e47d94c6a015e3f974f0dd4cf680c4603))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* retain cursor after pep enforcement ([#296](https://github.com/iotaledger/twin-dataspace/issues/296)) ([5198cd2](https://github.com/iotaledger/twin-dataspace/commit/5198cd29505ceffa532fa4fa18c97a5c8e78f663))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* run prepareTransfer request in-process for local-origin providers ([#291](https://github.com/iotaledger/twin-dataspace/issues/291)) ([eb8cc40](https://github.com/iotaledger/twin-dataspace/commit/eb8cc408df5ce5394fbeb30897595dab2d555840)), refs [#287](https://github.com/iotaledger/twin-dataspace/issues/287)
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.4-next.0 to 0.9.4-next.1

## [0.9.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.3...dataspace-control-plane-service-v0.9.3) (2026-09-04)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* release to production ([#359](https://github.com/iotaledger/twin-dataspace/issues/359)) ([3a2c8ae](https://github.com/iotaledger/twin-dataspace/commit/3a2c8aeeab167c5848536b74453953165e3eeb94))
* release to production ([#368](https://github.com/iotaledger/twin-dataspace/issues/368)) ([7c70a24](https://github.com/iotaledger/twin-dataspace/commit/7c70a24b24a3d2bc7624cb9c1a80b6eeefb1453d))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))

## [0.9.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2...dataspace-control-plane-service-v0.9.2) (2026-08-24)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* release to production ([#359](https://github.com/iotaledger/twin-dataspace/issues/359)) ([3a2c8ae](https://github.com/iotaledger/twin-dataspace/commit/3a2c8aeeab167c5848536b74453953165e3eeb94))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))

## [0.9.2-next.11](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.10...dataspace-control-plane-service-v0.9.2-next.11) (2026-08-23)


### Features

* add correlation callbacks ([#354](https://github.com/iotaledger/twin-dataspace/issues/354)) ([d362fb6](https://github.com/iotaledger/twin-dataspace/commit/d362fb6b0816a62f72a77478d78fb3959a437b3c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.10 to 0.9.2-next.11

## [0.9.2-next.10](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.9...dataspace-control-plane-service-v0.9.2-next.10) (2026-08-16)


### Features

* add unused agreement sweep to the control plane ([#344](https://github.com/iotaledger/twin-dataspace/issues/344)) ([8633642](https://github.com/iotaledger/twin-dataspace/commit/86336424ced7aeab3259c78373447074f4140e90))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.9 to 0.9.2-next.10

## [0.9.2-next.9](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.8...dataspace-control-plane-service-v0.9.2-next.9) (2026-08-13)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.8 to 0.9.2-next.9

## [0.9.2-next.8](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.7...dataspace-control-plane-service-v0.9.2-next.8) (2026-08-11)


### Features

* transfer process remove inline agreement ([#340](https://github.com/iotaledger/twin-dataspace/issues/340)) ([332eaf6](https://github.com/iotaledger/twin-dataspace/commit/332eaf67e5cf0b13545d013d107658b232ae32ff))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.7 to 0.9.2-next.8

## [0.9.2-next.7](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.6...dataspace-control-plane-service-v0.9.2-next.7) (2026-08-10)


### Features

* update well-known fields ([97e73ea](https://github.com/iotaledger/twin-dataspace/commit/97e73ea1c1c442547f130007e17930cec4de3e2b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.6 to 0.9.2-next.7

## [0.9.2-next.6](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.5...dataspace-control-plane-service-v0.9.2-next.6) (2026-08-10)


### Features

* re-use existing agreement ([#333](https://github.com/iotaledger/twin-dataspace/issues/333)) ([46c9079](https://github.com/iotaledger/twin-dataspace/commit/46c90798f590166f061bf75eb08ea27b76548299))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.5 to 0.9.2-next.6

## [0.9.2-next.5](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.4...dataspace-control-plane-service-v0.9.2-next.5) (2026-08-07)


### Features

* linting and dependency update ([adf8ee0](https://github.com/iotaledger/twin-dataspace/commit/adf8ee04f657f22fb051978591749a4cf19d67a1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.4 to 0.9.2-next.5

## [0.9.2-next.4](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.3...dataspace-control-plane-service-v0.9.2-next.4) (2026-08-03)


### Bug Fixes

* distribution format validation ([#327](https://github.com/iotaledger/twin-dataspace/issues/327)) ([17ce266](https://github.com/iotaledger/twin-dataspace/commit/17ce266756f3725bb721c887e6417f4b79772602))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.3 to 0.9.2-next.4

## [0.9.2-next.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.2...dataspace-control-plane-service-v0.9.2-next.3) (2026-07-31)


### Bug Fixes

* include the TransferError diagnostics in the autoStartFailed log ([#325](https://github.com/iotaledger/twin-dataspace/issues/325)) ([8c9a98f](https://github.com/iotaledger/twin-dataspace/commit/8c9a98f59f4410aa6978b0f70bc9f92b74a56a00))
* keep one TransferProcess record per role in self transfers ([#321](https://github.com/iotaledger/twin-dataspace/issues/321)) ([91ccc87](https://github.com/iotaledger/twin-dataspace/commit/91ccc87e47d94c6a015e3f974f0dd4cf680c4603))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.2 to 0.9.2-next.3

## [0.9.2-next.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.1...dataspace-control-plane-service-v0.9.2-next.2) (2026-07-30)


### Bug Fixes

* guard format ([#319](https://github.com/iotaledger/twin-dataspace/issues/319)) ([cc6f89b](https://github.com/iotaledger/twin-dataspace/commit/cc6f89b8d0fd9a428c3bb5ca4fae6281ce2c7bd0))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.1 to 0.9.2-next.2

## [0.9.2-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.2-next.0...dataspace-control-plane-service-v0.9.2-next.1) (2026-07-28)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transfer handlers ([#259](https://github.com/iotaledger/twin-dataspace/issues/259)) ([06e21b1](https://github.com/iotaledger/twin-dataspace/commit/06e21b179f548f3d93d81192b68ea710e5b9aafb))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side idle lifecycle policy for STARTED data transfers ([#284](https://github.com/iotaledger/twin-dataspace/issues/284)) ([a9312ef](https://github.com/iotaledger/twin-dataspace/commit/a9312ef7573a92805c99cb2a314e8b289a6ab195))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* query existing data transfers by agreement to avoid duplicate preparations ([#289](https://github.com/iotaledger/twin-dataspace/issues/289)) ([53fe251](https://github.com/iotaledger/twin-dataspace/commit/53fe2516b2287b6b6a7a6ca6fc6063ea4a446cf0))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove engine dependency ([#313](https://github.com/iotaledger/twin-dataspace/issues/313)) ([aec9f60](https://github.com/iotaledger/twin-dataspace/commit/aec9f60d530cd06a73170b3226795a260db8e6f4))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* simplify url construction ([49986d1](https://github.com/iotaledger/twin-dataspace/commit/49986d1b67b58c0918a5744794d06baf6b6c6461))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))
* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* data plane path is base not full url for pull ([68092ac](https://github.com/iotaledger/twin-dataspace/commit/68092acf707b6ba6679f5b75d4dc355c6629396c))
* defer catalogue reconciliation to background on startup ([#260](https://github.com/iotaledger/twin-dataspace/issues/260)) ([0824e46](https://github.com/iotaledger/twin-dataspace/commit/0824e465f5cedc9557abad90fb4d18a524210ddd))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* retain cursor after pep enforcement ([#296](https://github.com/iotaledger/twin-dataspace/issues/296)) ([5198cd2](https://github.com/iotaledger/twin-dataspace/commit/5198cd29505ceffa532fa4fa18c97a5c8e78f663))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* run prepareTransfer request in-process for local-origin providers ([#291](https://github.com/iotaledger/twin-dataspace/issues/291)) ([eb8cc40](https://github.com/iotaledger/twin-dataspace/commit/eb8cc408df5ce5394fbeb30897595dab2d555840)), refs [#287](https://github.com/iotaledger/twin-dataspace/issues/287)
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.2-next.0 to 0.9.2-next.1

## [0.9.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1...dataspace-control-plane-service-v0.9.1) (2026-07-27)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* release to production ([#308](https://github.com/iotaledger/twin-dataspace/issues/308)) ([fba29a0](https://github.com/iotaledger/twin-dataspace/commit/fba29a083d7e4892f1f06b9e2e3faa6a72185cda))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))

## [0.9.1-next.12](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.11...dataspace-control-plane-service-v0.9.1-next.12) (2026-07-26)


### Bug Fixes

* run prepareTransfer request in-process for local-origin providers ([#291](https://github.com/iotaledger/twin-dataspace/issues/291)) ([eb8cc40](https://github.com/iotaledger/twin-dataspace/commit/eb8cc408df5ce5394fbeb30897595dab2d555840)), refs [#287](https://github.com/iotaledger/twin-dataspace/issues/287)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.11 to 0.9.1-next.12

## [0.9.1-next.11](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.10...dataspace-control-plane-service-v0.9.1-next.11) (2026-07-21)


### Bug Fixes

* retain cursor after pep enforcement ([#296](https://github.com/iotaledger/twin-dataspace/issues/296)) ([5198cd2](https://github.com/iotaledger/twin-dataspace/commit/5198cd29505ceffa532fa4fa18c97a5c8e78f663))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.10 to 0.9.1-next.11

## [0.9.1-next.10](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.9...dataspace-control-plane-service-v0.9.1-next.10) (2026-07-20)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.9 to 0.9.1-next.10

## [0.9.1-next.9](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.8...dataspace-control-plane-service-v0.9.1-next.9) (2026-07-06)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.8 to 0.9.1-next.9

## [0.9.1-next.8](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.7...dataspace-control-plane-service-v0.9.1-next.8) (2026-07-02)


### Bug Fixes

* defer catalogue reconciliation to background on startup ([#260](https://github.com/iotaledger/twin-dataspace/issues/260)) ([0824e46](https://github.com/iotaledger/twin-dataspace/commit/0824e465f5cedc9557abad90fb4d18a524210ddd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.7 to 0.9.1-next.8

## [0.9.1-next.7](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.6...dataspace-control-plane-service-v0.9.1-next.7) (2026-07-02)


### Features

* simplify url construction ([49986d1](https://github.com/iotaledger/twin-dataspace/commit/49986d1b67b58c0918a5744794d06baf6b6c6461))


### Bug Fixes

* data plane path is base not full url for pull ([68092ac](https://github.com/iotaledger/twin-dataspace/commit/68092acf707b6ba6679f5b75d4dc355c6629396c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.6 to 0.9.1-next.7

## [0.9.1-next.6](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.5...dataspace-control-plane-service-v0.9.1-next.6) (2026-07-02)


### Features

* add transfer handlers ([#259](https://github.com/iotaledger/twin-dataspace/issues/259)) ([06e21b1](https://github.com/iotaledger/twin-dataspace/commit/06e21b179f548f3d93d81192b68ea710e5b9aafb))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.5 to 0.9.1-next.6

## [0.9.1-next.5](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.4...dataspace-control-plane-service-v0.9.1-next.5) (2026-06-30)


### Features

* rest enhancements ([f6dbd24](https://github.com/iotaledger/twin-dataspace/commit/f6dbd24c186a382769c97e697e54f0b6e28488a9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.4 to 0.9.1-next.5

## [0.9.1-next.4](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.3...dataspace-control-plane-service-v0.9.1-next.4) (2026-06-29)


### Features

* enhanced rest testing ([#255](https://github.com/iotaledger/twin-dataspace/issues/255)) ([264f91e](https://github.com/iotaledger/twin-dataspace/commit/264f91ea3a6501a13da51e7accbe9035e5ac4cef))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.3 to 0.9.1-next.4

## [0.9.1-next.3](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.2...dataspace-control-plane-service-v0.9.1-next.3) (2026-06-26)


### Features

* well-known endpoint ([9ff2607](https://github.com/iotaledger/twin-dataspace/commit/9ff2607a345ee9e038a2915179a926353251e59c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.2 to 0.9.1-next.3

## [0.9.1-next.2](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.1...dataspace-control-plane-service-v0.9.1-next.2) (2026-06-26)


### Features

* add well known versions endpoint ([#251](https://github.com/iotaledger/twin-dataspace/issues/251)) ([4b4cbe9](https://github.com/iotaledger/twin-dataspace/commit/4b4cbe91a40980481dad6e0650c1ee73c53ae360))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.1 to 0.9.1-next.2

## [0.9.1-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.1-next.0...dataspace-control-plane-service-v0.9.1-next.1) (2026-06-26)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.1-next.0 to 0.9.1-next.1

## [0.9.0](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.0...dataspace-control-plane-service-v0.9.0) (2026-06-25)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* release to production ([#243](https://github.com/iotaledger/twin-dataspace/issues/243)) ([9906476](https://github.com/iotaledger/twin-dataspace/commit/9906476c5b9150f0660f7950a3afd4fa87009d14))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))

## [0.9.0-next.1](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.9.0-next.0...dataspace-control-plane-service-v0.9.0-next.1) (2026-06-24)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.9.0-next.0 to 0.9.0-next.1

## [0.0.3-next.55](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.54...dataspace-control-plane-service-v0.0.3-next.55) (2026-06-23)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))
* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))
* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))
* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))
* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))
* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))
* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))
* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))
* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))
* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))
* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))
* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))
* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))
* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))
* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))
* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))
* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))
* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))
* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))
* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))
* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))
* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))
* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))
* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))
* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))
* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))
* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))
* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))
* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))
* incorrect docs ([754aa8d](https://github.com/iotaledger/twin-dataspace/commit/754aa8d032a5dfefa69072aa460106badfa41ac9))
* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))
* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))
* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))
* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.54 to 0.0.3-next.55

## [0.0.3-next.54](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.53...dataspace-control-plane-service-v0.0.3-next.54) (2026-06-23)


### Features

* align all config times to ms ([40238d5](https://github.com/iotaledger/twin-dataspace/commit/40238d59a2b45caedc01792b682ce7206815dfd1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.53 to 0.0.3-next.54

## [0.0.3-next.53](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.52...dataspace-control-plane-service-v0.0.3-next.53) (2026-06-23)


### Features

* provider-side transfer auto-start and negotiation/transfer timeout callbacks ([#227](https://github.com/iotaledger/twin-dataspace/issues/227)) ([619d858](https://github.com/iotaledger/twin-dataspace/commit/619d858e8d44e59744dc8a0f73e06be976932b53))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.52 to 0.0.3-next.53

## [0.0.3-next.52](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.51...dataspace-control-plane-service-v0.0.3-next.52) (2026-06-21)


### Features

* use inbuilt constants ([256bc03](https://github.com/iotaledger/twin-dataspace/commit/256bc0332bf439fcc16022e0b984b9035e9b0100))


### Bug Fixes

* gate implicit-trust shortcut on local provider endpoint ([#221](https://github.com/iotaledger/twin-dataspace/issues/221)) ([1167c53](https://github.com/iotaledger/twin-dataspace/commit/1167c53d2a94d4672191d278fed69b4f2d607a3c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.51 to 0.0.3-next.52

## [0.0.3-next.51](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.50...dataspace-control-plane-service-v0.0.3-next.51) (2026-06-19)


### Features

* local optimization ([#218](https://github.com/iotaledger/twin-dataspace/issues/218)) ([1daae6b](https://github.com/iotaledger/twin-dataspace/commit/1daae6be8be44abdbe2b4c883c35938506cdd34a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.50 to 0.0.3-next.51

## [0.0.3-next.50](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.49...dataspace-control-plane-service-v0.0.3-next.50) (2026-06-19)


### Features

* shortcut implicit trust ([#215](https://github.com/iotaledger/twin-dataspace/issues/215)) ([f9bcfea](https://github.com/iotaledger/twin-dataspace/commit/f9bcfeab8f069b62017502833c108b4ee3791414))


### Bug Fixes

* remove inline i18n ([edde37e](https://github.com/iotaledger/twin-dataspace/commit/edde37e90ac397f253f57bc0d306b4bd0c797920))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.49 to 0.0.3-next.50

## [0.0.3-next.49](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.48...dataspace-control-plane-service-v0.0.3-next.49) (2026-06-19)


### Features

* add telemetry metrics to dataspace control and data plane services ([#212](https://github.com/iotaledger/twin-dataspace/issues/212)) ([b5b0248](https://github.com/iotaledger/twin-dataspace/commit/b5b024899ed12c0f639c5d51aefa3e509753eac6))
* remove datasetsHandled method from apps ([9fdc950](https://github.com/iotaledger/twin-dataspace/commit/9fdc95018d38ab49c4a1094642be2ee83ee0e4cd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.48 to 0.0.3-next.49

## [0.0.3-next.48](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.47...dataspace-control-plane-service-v0.0.3-next.48) (2026-06-18)


### Features

* remove hosting component ([#209](https://github.com/iotaledger/twin-dataspace/issues/209)) ([5e19328](https://github.com/iotaledger/twin-dataspace/commit/5e1932823aa8a0f88f559f096610b9df1f3b8615))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.47 to 0.0.3-next.48

## [0.0.3-next.47](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.46...dataspace-control-plane-service-v0.0.3-next.47) (2026-06-17)


### Features

* add transferStarted provider method to start a data transfer ([#206](https://github.com/iotaledger/twin-dataspace/issues/206)) ([3ec2dc8](https://github.com/iotaledger/twin-dataspace/commit/3ec2dc8943c8531cd8d8e4ab07cb970ef7b11090))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.46 to 0.0.3-next.47

## [0.0.3-next.46](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.45...dataspace-control-plane-service-v0.0.3-next.46) (2026-06-17)


### Features

* cross-node transfer callbacks and DataTransferManager auto-start ([#199](https://github.com/iotaledger/twin-dataspace/issues/199)) ([1089aa3](https://github.com/iotaledger/twin-dataspace/commit/1089aa344e3598e382f37a82ca03230c5cf6cacd))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.45 to 0.0.3-next.46

## [0.0.3-next.45](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.44...dataspace-control-plane-service-v0.0.3-next.45) (2026-06-17)


### Bug Fixes

* mock pnap ([35f21f8](https://github.com/iotaledger/twin-dataspace/commit/35f21f847d3fb9d2ffcb9191a18835093cd259b9))
* use async getStore in tests ([739531e](https://github.com/iotaledger/twin-dataspace/commit/739531e1a159f728301835cd39cf06eab7a7bf4a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.44 to 0.0.3-next.45

## [0.0.3-next.44](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.43...dataspace-control-plane-service-v0.0.3-next.44) (2026-06-12)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.43 to 0.0.3-next.44

## [0.0.3-next.43](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.42...dataspace-control-plane-service-v0.0.3-next.43) (2026-06-11)


### Features

* organization identifiers ([#188](https://github.com/iotaledger/twin-dataspace/issues/188)) ([af643d3](https://github.com/iotaledger/twin-dataspace/commit/af643d3bb7f212d6cbb672e362a9e1bbe886d1a5))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.42 to 0.0.3-next.43

## [0.0.3-next.42](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.41...dataspace-control-plane-service-v0.0.3-next.42) (2026-06-10)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.41 to 0.0.3-next.42

## [0.0.3-next.41](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.40...dataspace-control-plane-service-v0.0.3-next.41) (2026-06-08)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.40 to 0.0.3-next.41

## [0.0.3-next.40](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.39...dataspace-control-plane-service-v0.0.3-next.40) (2026-06-08)


### Features

* add support for the new federated catalogue trust model ([#179](https://github.com/iotaledger/twin-dataspace/issues/179)) ([0d99a93](https://github.com/iotaledger/twin-dataspace/commit/0d99a9331e259e3efe5250e390fdfb1a2f0983b1))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.39 to 0.0.3-next.40

## [0.0.3-next.39](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.38...dataspace-control-plane-service-v0.0.3-next.39) (2026-06-04)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.38 to 0.0.3-next.39

## [0.0.3-next.38](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.37...dataspace-control-plane-service-v0.0.3-next.38) (2026-06-03)


### Bug Fixes

* persist STARTED before setupPushSubscription so data-plane read-back sees the right state ([#168](https://github.com/iotaledger/twin-dataspace/issues/168)) ([6a7c81a](https://github.com/iotaledger/twin-dataspace/commit/6a7c81a1247dcbfbec5d64958328e8b77798be0c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.37 to 0.0.3-next.38

## [0.0.3-next.37](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.36...dataspace-control-plane-service-v0.0.3-next.37) (2026-06-03)


### Bug Fixes

* return 409 Conflict on duplicate dataset creation ([#165](https://github.com/iotaledger/twin-dataspace/issues/165)) ([890a2f5](https://github.com/iotaledger/twin-dataspace/commit/890a2f59d881aed4c50f63f57cdec3a4ccfb572d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.36 to 0.0.3-next.37

## [0.0.3-next.36](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.35...dataspace-control-plane-service-v0.0.3-next.36) (2026-06-02)


### Bug Fixes

* defer startTransfer state mutation until dispatch succeeds ([#162](https://github.com/iotaledger/twin-dataspace/issues/162)) ([6704bbd](https://github.com/iotaledger/twin-dataspace/commit/6704bbd88c10c8b5b37b621b56cf9d8704e00a15))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.35 to 0.0.3-next.36

## [0.0.3-next.35](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.34...dataspace-control-plane-service-v0.0.3-next.35) (2026-06-02)


### Features

* update DataspaceTransferFormat names ([2c9d424](https://github.com/iotaledger/twin-dataspace/commit/2c9d424a07b97346faa2124048c4675514d58109))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.34 to 0.0.3-next.35

## [0.0.3-next.34](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.33...dataspace-control-plane-service-v0.0.3-next.34) (2026-06-01)


### Features

* add consumer transfer callbacks and startDataTransfer convenience method ([#151](https://github.com/iotaledger/twin-dataspace/issues/151)) ([0ab66c3](https://github.com/iotaledger/twin-dataspace/commit/0ab66c3636fd1f98f89baca1e99764d77c6f91d9))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.33 to 0.0.3-next.34

## [0.0.3-next.33](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.32...dataspace-control-plane-service-v0.0.3-next.33) (2026-06-01)


### Features

* rename completed callback ([#147](https://github.com/iotaledger/twin-dataspace/issues/147)) ([f62baad](https://github.com/iotaledger/twin-dataspace/commit/f62baad0ff444e2913439b12dcd06d20c9a4f6a4))


### Bug Fixes

* implement missing trust check on negotiateAgreement ([#136](https://github.com/iotaledger/twin-dataspace/issues/136)) ([a3589c2](https://github.com/iotaledger/twin-dataspace/commit/a3589c279476d5450b68ea7c2790be7e3125bfe2))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.32 to 0.0.3-next.33

## [0.0.3-next.32](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.31...dataspace-control-plane-service-v0.0.3-next.32) (2026-05-29)


### Bug Fixes

* validate dataset-id ([#138](https://github.com/iotaledger/twin-dataspace/issues/138)) ([92a6a9b](https://github.com/iotaledger/twin-dataspace/commit/92a6a9b7b82c3dd5c652a3685892f7e9156d458b))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.31 to 0.0.3-next.32

## [0.0.3-next.31](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.30...dataspace-control-plane-service-v0.0.3-next.31) (2026-05-27)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.30 to 0.0.3-next.31

## [0.0.3-next.30](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.29...dataspace-control-plane-service-v0.0.3-next.30) (2026-05-26)


### Features

* implement DSP push transfer mode ([#109](https://github.com/iotaledger/twin-dataspace/issues/109)) ([71f5fee](https://github.com/iotaledger/twin-dataspace/commit/71f5feec1d92dfec8ed6899c951809818e1bf2a3))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.29 to 0.0.3-next.30

## [0.0.3-next.29](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.28...dataspace-control-plane-service-v0.0.3-next.29) (2026-05-20)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.28 to 0.0.3-next.29

## [0.0.3-next.28](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.27...dataspace-control-plane-service-v0.0.3-next.28) (2026-05-12)


### Features

* typescript 6 update ([340f10e](https://github.com/iotaledger/twin-dataspace/commit/340f10e4767f6285c694938944f7e044474f9aaa))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.27 to 0.0.3-next.28

## [0.0.3-next.27](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.26...dataspace-control-plane-service-v0.0.3-next.27) (2026-05-08)


### Features

* endpoint encryption + getDatasetTargets multi-target fix ([#112](https://github.com/iotaledger/twin-dataspace/issues/112)) ([3288941](https://github.com/iotaledger/twin-dataspace/commit/328894113c19c7402f7d00dfa77b6a97ae40ca91))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.26 to 0.0.3-next.27

## [0.0.3-next.26](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.25...dataspace-control-plane-service-v0.0.3-next.26) (2026-04-14)


### Bug Fixes

* dependency update ([fbff0dd](https://github.com/iotaledger/twin-dataspace/commit/fbff0ddae93d82bd2899001368d7a03b482ce05c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.25 to 0.0.3-next.26

## [0.0.3-next.25](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.24...dataspace-control-plane-service-v0.0.3-next.25) (2026-04-10)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.24 to 0.0.3-next.25

## [0.0.3-next.24](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.23...dataspace-control-plane-service-v0.0.3-next.24) (2026-03-31)


### Features

* skip tenant dsp transfer routes ([#97](https://github.com/iotaledger/twin-dataspace/issues/97)) ([2f1ad97](https://github.com/iotaledger/twin-dataspace/commit/2f1ad971bc50ad24bb9f68759fbd4d44527d3d02))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.23 to 0.0.3-next.24

## [0.0.3-next.23](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.22...dataspace-control-plane-service-v0.0.3-next.23) (2026-03-25)


### Miscellaneous Chores

* **dataspace-control-plane-service:** Synchronize repo versions


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.22 to 0.0.3-next.23

## [0.0.3-next.22](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.21...dataspace-control-plane-service-v0.0.3-next.22) (2026-03-20)


### Features

* internalise constant ([9b9b293](https://github.com/iotaledger/twin-dataspace/commit/9b9b2933588ee70811a601bc485b5abaa12bed41))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.21 to 0.0.3-next.22

## [0.0.3-next.21](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.20...dataspace-control-plane-service-v0.0.3-next.21) (2026-03-17)


### Features

* improve open-api examples ([1368dbe](https://github.com/iotaledger/twin-dataspace/commit/1368dbed5c36e074b4854942304a19b9ce51e088))
* improve open-api examples ([44f7350](https://github.com/iotaledger/twin-dataspace/commit/44f7350c625d8d6afdca88b292dd48ef03253412))


### Bug Fixes

* handle missing target in catalogue offers during policy derivation check ([#89](https://github.com/iotaledger/twin-dataspace/issues/89)) ([a0e0dbc](https://github.com/iotaledger/twin-dataspace/commit/a0e0dbc8d9111d5d1c43e905249825e5d8d62816))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.20 to 0.0.3-next.21

## [0.0.3-next.20](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.19...dataspace-control-plane-service-v0.0.3-next.20) (2026-03-17)


### Features

* improve open-api examples ([f065f4b](https://github.com/iotaledger/twin-dataspace/commit/f065f4bd55540041a653ef141c4be29a83c5055e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.19 to 0.0.3-next.20

## [0.0.3-next.19](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.18...dataspace-control-plane-service-v0.0.3-next.19) (2026-03-12)


### Features

* improve validation ([#82](https://github.com/iotaledger/twin-dataspace/issues/82)) ([8bfaf7b](https://github.com/iotaledger/twin-dataspace/commit/8bfaf7b830f89b63575f8a51ee96bd8ac4da02f4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.18 to 0.0.3-next.19

## [0.0.3-next.18](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.17...dataspace-control-plane-service-v0.0.3-next.18) (2026-03-09)


### Features

* resolve DSP transfer flow bugs for cross-node communication ([#76](https://github.com/iotaledger/twin-dataspace/issues/76)) ([506a45c](https://github.com/iotaledger/twin-dataspace/commit/506a45c94e63d5f958b1fc7131adfe452c3e2974))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.17 to 0.0.3-next.18

## [0.0.3-next.17](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.16...dataspace-control-plane-service-v0.0.3-next.17) (2026-03-06)


### Features

* docs update ([8b44c7a](https://github.com/iotaledger/twin-dataspace/commit/8b44c7a75afb8d377a6f606616f8a78d58439ab4))
* types update ([77c338e](https://github.com/iotaledger/twin-dataspace/commit/77c338e9244dcc7e3d597fdb06229513b1f13eac))


### Bug Fixes

* avoid compaction of incoming activities ([#77](https://github.com/iotaledger/twin-dataspace/issues/77)) ([ff43d6a](https://github.com/iotaledger/twin-dataspace/commit/ff43d6a3e1563eb9cb185501134b2a53ae88787c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.16 to 0.0.3-next.17

## [0.0.3-next.16](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.15...dataspace-control-plane-service-v0.0.3-next.16) (2026-03-02)


### Bug Fixes

* docs and component init ([8557233](https://github.com/iotaledger/twin-dataspace/commit/8557233fb3b8273c5c9a5b580fb43061f8efe47c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.15 to 0.0.3-next.16

## [0.0.3-next.15](https://github.com/iotaledger/twin-dataspace/compare/dataspace-control-plane-service-v0.0.3-next.14...dataspace-control-plane-service-v0.0.3-next.15) (2026-03-02)


### Features

* unification of the data exchange and the data space connector ([#57](https://github.com/iotaledger/twin-dataspace/issues/57)) ([df2644d](https://github.com/iotaledger/twin-dataspace/commit/df2644d989471e07dadd83d27bef736179e31bf4))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/dataspace-models bumped from 0.0.3-next.14 to 0.0.3-next.15

## [0.0.3-next.1](https://github.com/iotaledger/twin-data-exchange/compare/data-exchange-service-v0.0.3-next.0...data-exchange-service-v0.0.3-next.1) (2026-01-19)


### Features

* mocking data exchange basic methods ([#5](https://github.com/iotaledger/twin-data-exchange/issues/5)) ([6cb00c0](https://github.com/iotaledger/twin-data-exchange/commit/6cb00c029aacf46da7bed0b3c97a21ef4102784a))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @twin.org/data-exchange-models bumped from 0.0.3-next.0 to 0.0.3-next.1

## Changelog
