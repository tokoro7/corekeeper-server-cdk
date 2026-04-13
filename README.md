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

## How to Use

### 1. 前提条件を準備する

- [Node.js](https://nodejs.org/) (v18 以上)
- [AWS CLI](https://aws.amazon.com/cli/) のインストール
- AWS アカウント

### 2. AWS CLI を設定する

```bash
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-northeast-1
# Default output format: json
```

設定を確認：

```bash
aws sts get-caller-identity
```

アカウントIDが表示されればOK。

### 3. リポジトリをクローンして依存関係をインストールする

```bash
git clone https://github.com/<your-username>/corekeeper-server-cdk.git
cd corekeeper-server-cdk
npm install
npm install -g aws-cdk
```

### 4. CDK Bootstrap を実行する（初回のみ）

CDK がデプロイに使う S3 バケット等を作成する。AWS アカウント・リージョンごとに1回だけ必要。

```bash
cdk bootstrap
```

### 5. デプロイする

```bash
cdk deploy
```

IAM やセキュリティグループの変更について確認を求められるので `y` で承認する。

デプロイ完了後、以下が出力される：

- **ApiEndpoint** - サーバー操作用の URL
- **InstanceId** - EC2 インスタンス ID

### 6. サーバーを操作する

```bash
# サーバー起動
curl -X POST https://<ApiEndpoint>/prod/start

# サーバー停止
curl -X POST https://<ApiEndpoint>/prod/stop
```

### 7. Core Keeper からサーバーに接続する

1. `/start` でサーバーを起動する
2. 初回起動時はセットアップに数分かかる
3. SSM Session Manager でインスタンスに接続し、Game ID を確認する：
   ```bash
   aws ssm start-session --target <InstanceId>
   sudo journalctl -u corekeeper -f
   ```
4. Core Keeper のゲーム内で「ゲームに参加」→ Game ID を入力して接続する

### 8. リソースを削除する

```bash
cdk destroy
```

> **注意**: ワールドデータ用の EBS ボリューム (`/dev/sdb`) は `deleteOnTermination: false` のため、`cdk destroy` 後も残ります。完全に削除する場合は AWS コンソールから手動で EBS ボリュームを削除してください。

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
