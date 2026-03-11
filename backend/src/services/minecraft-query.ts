import dgram from 'dgram';

/**
 * Query a Minecraft server using the basic UDP status ping.
 * Returns player count and player names.
 */
export async function queryMinecraftServer(
  host: string,
  port = 25565
): Promise<{ online: boolean; playerCount: number; maxPlayers: number; players: string[] }> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.close();
      resolve({ online: false, playerCount: 0, maxPlayers: 0, players: [] });
    }, 5000);

    const socket = dgram.createSocket('udp4');

    // Minecraft Server List Ping (legacy)
    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(0xFEFD, 0);

    // Use a simpler TCP approach - try connecting via TCP and parsing
    // For simplicity, we'll use a basic TCP handshake approach
    const net = require('net');
    const client = new net.Socket();

    clearTimeout(timeout);
    socket.close();

    const tcpTimeout = setTimeout(() => {
      client.destroy();
      resolve({ online: false, playerCount: 0, maxPlayers: 0, players: [] });
    }, 5000);

    client.connect(port, host, () => {
      // Send MC protocol handshake + status request
      const handshake = createHandshakePacket(host, port);
      const statusRequest = Buffer.from([0x01, 0x00]);
      client.write(Buffer.concat([handshake, statusRequest]));
    });

    let responseData = Buffer.alloc(0);

    client.on('data', (data: Buffer) => {
      responseData = Buffer.concat([responseData, data]);

      try {
        // Try to parse the JSON response
        const str = responseData.toString('utf8');
        const jsonStart = str.indexOf('{');
        const jsonEnd = str.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
          const json = JSON.parse(str.substring(jsonStart, jsonEnd + 1));
          clearTimeout(tcpTimeout);
          client.destroy();

          resolve({
            online: true,
            playerCount: json.players?.online ?? 0,
            maxPlayers: json.players?.max ?? 20,
            players: (json.players?.sample ?? []).map((p: { name: string }) => p.name),
          });
        }
      } catch {
        // Not enough data yet, wait for more
      }
    });

    client.on('error', () => {
      clearTimeout(tcpTimeout);
      client.destroy();
      resolve({ online: false, playerCount: 0, maxPlayers: 0, players: [] });
    });
  });
}

function createHandshakePacket(host: string, port: number): Buffer {
  const protocolVersion = encodeVarInt(47); // 1.8+ compatible
  const hostBuf = Buffer.from(host, 'utf8');
  const hostLen = encodeVarInt(hostBuf.length);
  const portBuf = Buffer.alloc(2);
  portBuf.writeUInt16BE(port, 0);
  const nextState = encodeVarInt(1); // Status

  const data = Buffer.concat([
    encodeVarInt(0x00), // Packet ID
    protocolVersion,
    hostLen,
    hostBuf,
    portBuf,
    nextState,
  ]);

  return Buffer.concat([encodeVarInt(data.length), data]);
}

function encodeVarInt(value: number): Buffer {
  const bytes: number[] = [];
  while (true) {
    if ((value & ~0x7f) === 0) {
      bytes.push(value);
      break;
    }
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  return Buffer.from(bytes);
}
