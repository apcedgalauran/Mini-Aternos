import { config } from './config';

/**
 * Generate cloud-init user-data script for the Droplet.
 * This runs automatically on first boot.
 */
export function generateCloudInit(): string {
  const spacesEndpoint = `https://${config.doSpacesRegion}.digitaloceanspaces.com`;
  const bucket = config.doSpacesBucket;

  return `#!/bin/bash
set -euo pipefail

# Log all output for debugging
exec > /var/log/cloud-init-minecraft.log 2>&1

echo "=== Mini-Aternos Cloud Init ==="
echo "Started at: $(date)"

# 1. Install dependencies
apt-get update
apt-get install -y awscli unzip openjdk-17-jre-headless screen

# 2. Configure AWS CLI for Spaces
mkdir -p /root/.aws
cat > /root/.aws/config <<AWSEOF
[default]
region = ${config.doSpacesRegion}
AWSEOF
cat > /root/.aws/credentials <<AWSEOF
[default]
aws_access_key_id = ${config.doSpacesKey}
aws_secret_access_key = ${config.doSpacesSecret}
AWSEOF

# 3. Setup Minecraft directory
mkdir -p /opt/minecraft
cd /opt/minecraft

# 4. Download Paper server if not present
if [ ! -f paper.jar ]; then
  echo "Downloading Paper 1.20.4..."
  curl -L -o paper.jar "https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/496/downloads/paper-1.20.4-496.jar"
fi

# 5. Accept EULA
echo "eula=true" > eula.txt

# 6. Download world from Spaces
echo "Downloading world backup from Spaces..."
aws s3 cp s3://${bucket}/world-backup.zip /tmp/world-backup.zip \\
  --endpoint-url ${spacesEndpoint} || echo "No existing world backup found, starting fresh"

if [ -f /tmp/world-backup.zip ]; then
  echo "Extracting world backup..."
  unzip -o /tmp/world-backup.zip -d /opt/minecraft/
  rm /tmp/world-backup.zip
fi

# 7. Create server.properties if not exists
if [ ! -f server.properties ]; then
  cat > server.properties <<PROPEOF
server-port=25565
max-players=20
difficulty=normal
gamemode=survival
motd=Mini-Aternos Minecraft Server
enable-query=true
query.port=25565
PROPEOF
fi

# 8. Create systemd service
cat > /etc/systemd/system/minecraft.service <<SVCEOF
[Unit]
Description=Minecraft Paper Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/minecraft
ExecStart=/usr/bin/java -Xmx1536M -Xms512M -jar paper.jar --nogui
ExecStop=/bin/kill -SIGINT \$MAINPID
Restart=no
TimeoutStopSec=60

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable minecraft

# 9. Configure firewall
ufw allow 25565/tcp
ufw allow 25565/udp
ufw allow 22/tcp
ufw --force enable

# 10. Start Minecraft server
echo "Starting Minecraft server..."
systemctl start minecraft

echo "=== Cloud Init Complete ==="
echo "Finished at: $(date)"
`;
}
