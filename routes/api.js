/*
* Implementation of a server side event endpoint and API for getting
* and posting chat messages.
* 
* Based on this tutorial:
* https://www.digitalocean.com/community/tutorials/nodejs-server-sent-\
* events-build-realtime-app
* 
* Test from the console using curl:
* curl -H Accept:text/event-stream http://localhost:3000/api/events
* curl -X POST -H "Content-Type: application/json"\
*   -d '{"type":"update","author":"John","text":"Hello","timestamp":0}'\
*   -s http://localhost:3000/api/fact
*/

var express = require('express');
var router = express.Router();

let clients = [];
let messages = [];

// writes an event to each client
const send_event_to_all = message => {
  clients.forEach(client => {
    client.res.write(event_content(message, 'update'));
  });
}

// returns a formated string for the event stream
const event_content = (data, eventtype, id) => {
	if(!data) data = {};
	if(!eventtype) eventtype = 'message';
	let str = `event: ${eventtype}\ndata: ${JSON.stringify(data)}\n`;
	if(id) str += `id: ${id}\n`;
  str += `\n`;
	return str;	
};

// the server-send event endpoint
router.get('/events', function(req, res, next) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'identity'});

  // write an initial event as a 'notice'
  let notice = {text:'Connected to the server!', timestamp: Date.now()};
  res.write(event_content(notice, 'notice'));

  // for each of the messages already in the array, write out an event
  // to the stream.
  messages.forEach(message => {
    res.write(event_content(message, 'update'));
  });

  let client_id = Date.now();
  // a new client with id and responce object
  let client = {id: client_id, res};
  // add client to the clients array
  clients.push(client);

  // remove the client when the EventSource sends 'close'.
  req.on('close', () => {
    console.log(`[${client_id}]: Connection closed`);
    clients = clients.filter(client => client.id !== client_id);
  });
});

// endpoint for getting all messages
router.get('/messages', function(req, res, next) {
  res.json(messages);
});

// endpoint for posting a new message
router.post('/messages', function(req, res, next) {
	let message = req.body;
	message.timestamp = Date.now();
  // add the message to the messages array
	messages.push(message);
  // respond with the message
	res.json(message);
	return send_event_to_all(message);
});

module.exports = router;