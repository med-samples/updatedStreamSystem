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
    const audio = document.querySelector('audio');
    navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
    })
    .then(stream => {
    //add the written stream function
    addVideoStream(myVideo, stream)
    //listening when we have call, answering and sending stream
    peer.on('connection', userVideoStream => {
        console.log('calling');
        connectToNewUser(video, stream)
        const audioTracks = stream.getAudioTracks();
        console.log('Using audio device: ' + audioTracks[0].label);
        window.stream = stream; // make variable available to browser console
        audio.srcObject = stream;

    })


    // links audio with audio tag
    let audio = document.querySelector('audio');

   
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
        // Close old connection
        if (conn) {
            conn.close();
        }

        // when the connect button is pressed get the video and audio and call connectToNewUser()
        const audio = document.querySelector('audio');
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        .then(stream => {connectToNewUser(video, stream)})
        .catch();
        
        // Create connection to destination peer specified in the input field
        conn = peer.connect(recvIdInput.value, {
            reliable: true
        });

        conn.on('open', function () {
            status.innerHTML = "Connected to: " + conn.peer;
            console.log("Connected to: " + conn.peer);
        });


        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
            console.log('received:',data);
            addMessage("<span class=\"peerMsg\">Peer:</span> " + data);
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
            addMessage("<span class=\"peerMsg\">Peer 2: </span>" + data)
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
            // for self
            addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
          //signal('Message')
        } else {
            console.log('Connection is closed');
        }
    });


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
      peer.on('call', userVideoStream => {
        addVideoStream(video, userVideoStream)
        //videoTrial.append(video)
        console.log('video streaming')
      })

      //if user leaves, take video and close it
      conn.on('close', () => {
        video.remove()
      })

      //using peers to keep track of who's connected
    //  peer[c] = call
  }

    //creating function to stream myself
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
