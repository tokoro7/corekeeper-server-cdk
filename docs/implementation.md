# 実装メモ

## 構成ファイル

| ファイル | 役割 |
|---|---|
| `bin/corekeeper-server-cdk.ts` | CDK App エントリーポイント。env にアカウント/リージョンを設定 |
| `lib/corekeeper-server-cdk-stack.ts` | メインスタック。GameServer と ServerControlApi を組み合わせる |
| `lib/constructs/game-server.ts` | EC2 Construct (インスタンス, SG, IAMロール, EBS) |
| `lib/constructs/server-control-api.ts` | Lambda + API Gateway Construct |
| `lib/user-data/setup.sh` | EC2 起動時セットアップスクリプト |
| `lambda/server-control/index.ts` | EC2 起動/停止 Lambda ハンドラー |

## EC2 (GameServer)

- **VPC**: デフォルトVPC (`Vpc.fromLookup`)
- **AMI**: Ubuntu 22.04 (SSMパラメータストア経由で最新AMI IDを取得)
- **インスタンスタイプ**: `t3.medium`
- **EBS**: ルート (`/dev/sda1`, 20GB) + データ (`/dev/sdb`, 20GB, `deleteOnTermination: false`)
- **セキュリティグループ**: UDP 27015, 27016 インバウンド開放
- **IAMロール**: `AmazonSSMManagedInstanceCore` (SSM Session Manager 用)

## User Data (setup.sh)

EC2 初回起動時に以下を実行:

1. `/dev/sdb` を `/opt/corekeeper` にマウント (初回のみ ext4 フォーマット)
2. fstab に追記して再起動後も自動マウント
3. `lib32gcc-s1` 等の依存パッケージインストール
4. `steam` ユーザー作成
5. SteamCMD インストール
6. Core Keeper Dedicated Server インストール (App ID: `1963720`)
7. systemd サービス (`corekeeper.service`) を登録・有効化・起動

## Lambda (server-control)

- `POST /start` → `EC2:StartInstances`
- `POST /stop` → `EC2:StopInstances`
- AWS SDK v3 (`@aws-sdk/client-ec2`) 使用
- 環境変数 `INSTANCE_ID` でインスタンスを指定
- IAMポリシーで対象インスタンスARNのみに権限を限定

## API Gateway

- REST API (`CoreKeeper Server Control`)
- `/start` (POST), `/stop` (POST)
- Lambda プロキシ統合
- 認証なし

## env 設定

`Vpc.fromLookup` はアカウント/リージョンの指定が必要なため、`bin/corekeeper-server-cdk.ts` で `CDK_DEFAULT_ACCOUNT` / `CDK_DEFAULT_REGION` 環境変数を使用している。

## 進捗

- [x] CDK プロジェクト初期化
- [x] GameServer Construct 実装
- [x] User Data スクリプト実装
- [x] Lambda ハンドラー実装
- [x] ServerControlApi Construct 実装
- [x] メインスタック実装
- [x] `cdk synth` 成功
- [x] `cdk deploy` → 動作確認 (インスタンスタイプは t3.micro に変更)
