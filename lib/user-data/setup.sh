#!/bin/bash
set -euo pipefail

# ── EBS マウント (/opt/corekeeper) ──────────────────────────────────────────
DEVICE=/dev/sdb
MOUNT=/opt/corekeeper

# デバイスが認識されるまで待機
while [ ! -b "$DEVICE" ]; do sleep 1; done

# 初回のみフォーマット（パーティションテーブルがなければ ext4 で初期化）
if ! blkid "$DEVICE" > /dev/null 2>&1; then
  mkfs.ext4 "$DEVICE"
fi

mkdir -p "$MOUNT"
mount "$DEVICE" "$MOUNT"

# 再起動後も自動マウントされるよう fstab に追記（重複防止）
if ! grep -q "$DEVICE" /etc/fstab; then
  echo "$DEVICE  $MOUNT  ext4  defaults,nofail  0  2" >> /etc/fstab
fi

# ── 依存パッケージ ───────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y lib32gcc-s1 curl

# ── steam ユーザー作成 ───────────────────────────────────────────────────────
if ! id steam &>/dev/null; then
  useradd -m -s /bin/bash steam
fi

# ── SteamCMD インストール ────────────────────────────────────────────────────
STEAMCMD_DIR=/home/steam/steamcmd
mkdir -p "$STEAMCMD_DIR"
curl -sSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz \
  | tar -xz -C "$STEAMCMD_DIR"
chown -R steam:steam "$STEAMCMD_DIR"

# ── Core Keeper Dedicated Server インストール ────────────────────────────────
SERVER_DIR="$MOUNT/server"
mkdir -p "$SERVER_DIR"
chown -R steam:steam "$MOUNT"

sudo -u steam "$STEAMCMD_DIR/steamcmd.sh" \
  +force_install_dir "$SERVER_DIR" \
  +login anonymous \
  +app_update 1963720 validate \
  +quit

# ── systemd サービス登録 ─────────────────────────────────────────────────────
cat > /etc/systemd/system/corekeeper.service << 'EOF'
[Unit]
Description=Core Keeper Dedicated Server
After=network.target

[Service]
Type=simple
User=steam
WorkingDirectory=/opt/corekeeper/server
ExecStart=/opt/corekeeper/server/CoreKeeperServer
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable corekeeper
systemctl start corekeeper
