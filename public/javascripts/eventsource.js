/*
* Implementation of a chat client using EventSource.
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

var message_elm;
var server_event;

// function that takes a submit event from a form
var on_submit_send = e => {
    e.preventDefault();
    let message = {
        type:'message',
        author: e.target.name.value,
        text: e.target.message.value
        };
    // post the message to the endpoint
    fetch('/api/messages', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(message)
    })
    .then(response => response.json())
    .then(data => {
        e.target.message.value = '';
    });
};

document.addEventListener('DOMContentLoaded', e => {
    message_elm = document.getElementById('messagestream');
    // connect to the endpoint
    server_event = new EventSource('/api/events');
    // make sure to close the connection when the document unloads
    window.addEventListener('beforeunload', e => {
        // if the connection is not already closed, close it
        if(server_event.readyState != server_event.CLOSED){
            server_event.close();
        }
    });
    // eventlistner for the form
    document.forms.send.addEventListener('submit', on_submit_send);
    // eventlistener for "notice" on the eventsource
    // this is the initial event from the server
    server_event.addEventListener('notice', e => {
        let message = JSON.parse(e.data);
        let ts = new Date(message.timestamp);
        let ts_time = ts.toLocaleTimeString();
        message_elm.innerText += `[${ts_time}]: ${message.text}\n`;
    });
    // eventlistener for "update" on the eventsource
    // when somebody posts a new message
    server_event.addEventListener('update', e => {
        let message = JSON.parse(e.data);
        let ts = new Date(message.timestamp);
        let ts_time = ts.toLocaleTimeString();
        message_elm.innerText += `[${ts_time}] ${message.author}: ${message.text}\n`;
    });
});




