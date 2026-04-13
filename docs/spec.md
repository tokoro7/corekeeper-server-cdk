# Corekeeper Server on AWS - 仕様書

## 概要

友達とCore Keeper（Steamゲーム）をプレイするための専用サーバーをAWS上に構築する。
クラウドおよびIaCの学習を兼ねたプロジェクト。

## アーキテクチャ

```
[プレイヤー] → API Gateway → Lambda → EC2起動/停止
                                        ↓
                                  Core Keeperサーバー (EC2)
                                        ↓
                                  ワールドデータ (EBS)
```

## 使用技術

| 技術 | 用途 |
|---|---|
| AWS EC2 | Core Keeper専用サーバーのホスト |
| AWS Lambda | EC2の起動・停止を制御 |
| AWS API Gateway | LambdaをHTTPで呼び出すエンドポイント |
| AWS EBS | ワールドデータの永続化 |
| AWS CDK (TypeScript) | インフラのコード化 (IaC) |

## サーバーの起動・停止方法

API GatewayのエンドポイントにHTTPリクエストを送るだけで操作できる。

```
POST /start  → EC2起動 + Core Keeperサーバー自動起動
POST /stop   → EC2停止
```

起動後はCore KeeperのGame IDが発行されるので、友達に共有して参加してもらう。

## 方針

- EC2はプレイ中のみ起動し、停止時はシャットダウンしてコストを削減する
- Lambda経由でEC2を起動・停止する
- ワールドデータはEBSに永続化し、EC2を停止しても消えないようにする
- インフラはAWS CDK (TypeScript) で管理する

## 技術選定理由

- **CDK**: IaCの学習のため
- **TypeScript**: 好みの言語
