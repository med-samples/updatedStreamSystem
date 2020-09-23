(function () {
    // Video/Audio
    //Create my video side and mute self to not hear feedback
    const videoTrial = document.getElementById('vid-trial');
    const receiverVid = document.getElementById('receiver-vid');
    const myVideo = document.createElement('video');
    const video = document.createElement('video');
    myVideo.muted = true;
    var blobGlobal;


    var lastPeerId = null;
    var peer = null; // Own peer object
    var peerId = null;
    var conn = null;
    var recvId = document.getElementById("receiver-id");
    var status = document.getElementById("status");
    var message = document.getElementById("message");
    var standbyBox = document.getElementById("standby");
    var goBox = document.getElementById("go");
    var fadeBox = document.getElementById("fade");
    var offBox = document.getElementById("off");
    var sendMessageBox = document.getElementById("sendMessageBox");
    var sendButton = document.getElementById("sendButton");
    var sendAudioButton = document.getElementById("sendAudioButton");
    var clearMsgsButton = document.getElementById("clearMsgsButton");

    //from the other file
    var recvIdInput = document.getElementById("sender-id");
    var connectButton = document.getElementById("connect-button");

    /**
     * Create the Peer object for our end of the connection.
     *
     * Sets up callbacks that handle any events related to our
     * peer object.
     */
     function initialize() {
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(null, {
            debug: 2
        });

        peer.on('open', function (id) {
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                console.log('Received null id from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }

            console.log('ID: ' + peer.id);
            recvId.innerHTML = "ID: " + peer.id;
            status.innerHTML = "Awaiting connection...";
        });
        peer.on('connection', function (c) {
            // Allow only a single connection
            if (conn && conn.open) {
                c.on('open', function() {
                    c.send("Already connected to another client");
                    setTimeout(function() { c.close(); }, 500);
                });
                return;
            }

            conn = c;
            console.log("Connected to: " + conn.peer);
            status.innerHTML = "Connected";
            ready();
        });
        peer.on('disconnected', function () {
            status.innerHTML = "Connection lost. Please reconnect";
            console.log('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });
        peer.on('close', function() {
            conn = null;
            status.innerHTML = "Connection destroyed. Please refresh";
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });
    };


    //Get my media (vid and aud) to be able to display to other users
    navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
    }).then(stream => {
    //add the written stream function
    addVideoStream(myVideo, stream)
    //listening when we have call, answering and sending stream
    peer.on('connection', userVideoStream => {
      console.log('calling');
      connectToNewUser(video, stream)
  //    addVideoStream(myVideo, userVideoStream)

      //give & create stream to other user

    })

    /*
    //allow others to view me using socket
    socket.on('user-connected', userId => {
        //use a function to all user to view me
        connectToNewUser(userId, stream)
    })
*/

    // links audio with audio tag
    let audio = document.querySelector('audio');

    // case check for older browsers
    if ("srcObject" in audio) {
        audio.srcObject = stream;
    }
    else {   // Old version
        audio.src = window.URL
        .createObjectURL(stream);
    }

    audio.onloadedmetadata = function (ev) {

        // Play the audio in the 2nd audio
        // element what is being recorded
        //audio.play();
    };


    // Start record
    let record = document.getElementById('recordButton');

    // stop record
    let stop = document.getElementById('stopButton');

    // audio tag to play the record
    let playAudio = document.getElementById('audioPlay');

    // API to record audio, 'MediaRecorder'
    let mediaRecorder = new MediaRecorder(stream);

    // Event portion

    // Start event
    record.addEventListener('click', function (e) {
        record.disabled = true;
        stop.disabled = false;
        sendAudioButton.disabled = true;
        mediaRecorder.start();

        console.log("start");
    });

    // Stop event
    stop.addEventListener('click', function (e){
        record.disabled = false;
        stop.disabled = true;
        sendAudioButton.disabled = false;
        mediaRecorder.stop();
        //console.log("stop");
    });
    // Chunk array to store the audio data
    let dataArray = [];

    // If audio data available then push
    // it to the chunk array
    mediaRecorder.ondataavailable = function (ev) {
        dataArray.push(ev.data);
        }
    // Convert the audio data in to blob
    // after stopping the recording
    mediaRecorder.onstop = function (ev) {
        // blob of type mp3
        let blob = new Blob(dataArray,
                { 'type': 'audio/mp3;' });


        // After fill up the chunk
        // emptys array after converting blob
        dataArray = [];

        // Creating audio url with reference
        // of created blob named 'blob'
        let audioSrc = window.URL.createObjectURL(blob);

        blobGlobal = audioSrc;
        // Pass the audio url to the 2nd video tag
        playAudio.src = audioSrc;
    }
    })
    .catch(function(err){
    console.log(`Error: ${err}`);
    });

     /** from other file
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
     function join() {
         console.log("i was pressed");
        // Close old connection
        if (conn) {
            conn.close();
            console.log("If statment closed");
        }

        // Create connection to destination peer specified in the input field
        conn = peer.connect(recvIdInput.value, {
            reliable: true
        });

        console.log("conn:" + recvIdInput.value);

        conn.on('open', function () {
            status.innerHTML = "I Connected to: " + conn.peer;
            console.log("I Connected to: " + conn.peer);
            //give & create stream to other user
            //const video = document.createElement('video')
            //conn.on('connection', userVideoStream => {
          //    addVideoStream(video, userVideoStream)
          //  })

            // Check URL params for comamnds that should be sent immediately
           // var command = getUrlParam("command");
           // if (command)
           //     conn.send(command);
        });
        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
            //addAudio(data);
            console.log(data);
            addMessage("<span class=\"peerMsg\">Peer 2: </span>" + data);

            // Amy's switch case
            /*
            switch(data) {
                case 'Message' :
                    addMessage("<span class=\"peerMsg\">Peer 1: </span>" + data)
                    break;
                case 'Audio' :
                    addAudio(data);
                    break;
                default:
                    console.log('Default switch case 1 ' + data)
                    break;
            }
            */
        });

        conn.on('close', function () {
            status.innerHTML = "Connection closed";
        });
    };

    /**
     * Triggered once a connection has been achieved.
     * Defines callbacks to handle incoming data and connection events.
     */
    function ready() {
        conn.on('data', function (data) {
            console.log("Data recieved");
            addMessage("<span class=\"peerMsg\">Peer 2: </span>" + data);

            // Amy's switch case
            /*
            switch(data) {
                case 'Message' :
                    addMessage("<span class=\"peerMsg\">Peer 2: </span>" + data)
                    break;
                case 'Audio' :
                    addAudio(data);
                    break;
                default:
                    console.log('Default switch case 2 ' + data)
                    break;
            }
            */
           // addAudio(audioData);
           // addMessage("<span class=\"peerMsg\">Peer2: </span>" + data);
            // this is where they should receive the audio
        });

        conn.on('close', function () {
            status.innerHTML = "Connection reset<br>Awaiting connection...";
            conn = null;
        });
    }


    function addMessage(msg) {
        var now = new Date();
        var h = now.getHours();
        var m = addZero(now.getMinutes());
        var s = addZero(now.getSeconds());

        if (h > 12)
            h -= 12;
        else if (h === 0)
            h = 12;

        function addZero(t) {
            if (t < 10)
                t = "0" + t;
            return t;
        };

        message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
    }

    function addAudio(aud) {
        sentAudio.innerHTML ="<br> <audio controls src=" + aud + "> </audio> " + sentAudio.innerHTML;
        console.log(aud);
    }

    function clearMessages() {
        message.innerHTML = "";
        addMessage("Msgs cleared");
    }

    function signal(sigName) {
        if (conn && conn.open) {
            conn.send(sigName);
            console.log(sigName + " signal sent");
        } else {
            console.log('Connection is closed');
        }
    }

    // Listen for enter in message box
    sendMessageBox.addEventListener('keypress', function (e) {
        var event = e || window.event;
        var char = event.which || event.keyCode;
        if (char == '13')
            sendButton.click();
    });
    // Send message blob recording
    sendButton.addEventListener('click', function () {
        if (conn && conn.open) {
            var msg = sendMessageBox.value;
            sendMessageBox.value = "";
            // for peer
            conn.send(msg);
          //console.log("Sent: " + aud);
            // for self
            addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
          //signal('Message')
        } else {
            console.log('Connection is closed');
        }
    });

    sendAudioButton.addEventListener('click', function () {
        if (conn && conn.open) {
            var aud = blobGlobal;
            //for peer
            conn.send(aud);
           console.log("Sent: " + aud);
            //for self
            addAudio(aud);

        } else {
            console.log('Connection is closed');
        }
        signal('Audio')
    })

  //creating function to allow user to view me
  function connectToNewUser(video, stream) {
      video.srcObject = stream
      video.addEventListener('loadedmetadata', () => {
          video.play()
      })
      receiverVid.append(video)

      c = conn.peer
      console.log('Connection test: ' + c)
      const call = peer.call(c, stream)
      //take the stream and add to custom element
      call.on('connection', userVideoStream => {
        addVideoStream(video, userVideoStream)
        //videoTrial.append(video)
        console.log('video streaming')
      })

      //if user leaves, take video and close it
      call.on('close', () => {
        video.remove()
      })

      //using peers to keep track of who's connected
    //  peer[c] = call
  }

    //creating function to stream my media mediaDevices
    function addVideoStream(myVideo, stream) {
    myVideo.srcObject = stream
    //once the video loads, play the video
    myVideo.addEventListener('loadedmetadata', () => {
        myVideo.play()
    })
    videoTrial.append(myVideo)
    }

    // Clear messages box
    clearMsgsButton.addEventListener('click', clearMessages);

    // Start peer connection
    // Start peer connection on click
    connectButton.addEventListener('click', join);

    initialize();
})();
