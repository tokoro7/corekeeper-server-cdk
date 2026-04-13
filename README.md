# Core Keeper Dedicated Server on AWS

Core Keeper (Steam) の専用サーバーを AWS 上に構築する CDK プロジェクト。

## アーキテクチャ

```
プレイヤー → API Gateway → Lambda → EC2 起動/停止
                                      ↓
                               Core Keeper サーバー (EC2)
                                      ↓
                               ワールドデータ (EBS)
```

- EC2 はプレイ中のみ起動し、停止時はコストがかからない
- ワールドデータは EBS に永続化され、EC2 を停止しても消えない
- API Gateway 経由で HTTP リクエストからサーバーを操作できる

## 使用技術

| 技術 | 用途 |
|---|---|
| AWS CDK (TypeScript) | インフラのコード化 |
| EC2 (t3.micro) | ゲームサーバーのホスト |
| Lambda | EC2 の起動・停止制御 |
| API Gateway | HTTP エンドポイント |
| EBS | ワールドデータの永続化 |

## セットアップ

### 前提条件

- Node.js
- AWS CLI (設定済み)
- AWS CDK (`npm install -g aws-cdk`)
- CDK Bootstrap 済み (`cdk bootstrap`)

### デプロイ

```bash
npm install
cdk deploy
```

デプロイ完了後、API Gateway のエンドポイント URL が出力されます。

## 使い方

```bash
# サーバー起動
curl -X POST https://<api-endpoint>/prod/start

# サーバー停止
curl -X POST https://<api-endpoint>/prod/stop
```

## プロジェクト構成

```
├── bin/                        # CDK App エントリーポイント
├── lib/
│   ├── constructs/
│   │   ├── game-server.ts      # EC2 Construct
│   │   └── server-control-api.ts # Lambda + API Gateway Construct
│   └── user-data/
│       └── setup.sh            # EC2 セットアップスクリプト
├── lambda/
│   └── server-control/
│       └── index.ts            # Lambda ハンドラー
└── docs/
    ├── spec.md                 # 仕様書
    └── implementation.md       # 実装メモ
```
