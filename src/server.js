const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3030 });

const chatEvents = {
	join: 'join',
	message: 'message',
	roomsUpdated: 'roomsUpdated',
};

wss.on('connection', (ws) => {
	ws.room = [];
	ws.username = '';

	console.log('connected', ws.room);

	ws.on('message', (message) => {
		const parsedMessage = JSON.parse(message);
		const { event, username } = parsedMessage;
		console.log(event);

		if (event === chatEvents.join) {
			ws.username = username;

			if (wss.clients.size > 1) {
				wss.clients.forEach((client) => {
					if (!client.username || client.username === ws.username) return;

					const roomName = getRoomName(ws.username, client.username);

					ws.room.push(roomName);
					ws.send(
						JSON.stringify({ rooms: ws.room, event: chatEvents.roomsUpdated })
					);

					if (!client.room.includes(roomName)) {
						client.room.push(roomName);

						client.send(
							JSON.stringify({
								rooms: client.room,
								event: chatEvents.roomsUpdated,
							})
						);
					}
				});
			}

			console.log('join', ws.username, ws.room);
		}

		if (event === chatEvents.message) {
			broadcast(message);
		}
	});

	ws.on('error', (e) => console.log(e));
	ws.on('close', (e) => console.log('websocket closed' + e));
});

function broadcast(message) {
	wss.clients.forEach((client) => {
		console.log(client.room, client.username);

		client.send(message);
	});
}

function getRoomName(user, targetUser) {
	return user > targetUser ? `${user}-${targetUser}` : `${targetUser}-${user}`;
}
