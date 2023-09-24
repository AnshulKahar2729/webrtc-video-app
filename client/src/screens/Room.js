import {useSocket} from "../context/SocketProvider";
import {useCallback, useEffect, useState} from "react";
import ReactPlayer from "react-player"
import peer from "../service/peer";

const RoomPage = () => {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const handleUserJoined = useCallback(({email, id}) => {
        console.log(`User joined with ${email}`);
        setRemoteSocketId(id);
    }, []);

    // first of all we will create our own video and display it on web.
    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});

        // now create offer and set it to the remote user.
        const offer = await peer.getOffer();
        socket.emit("user:call", {to: remoteSocketId, offer})
        setMyStream(stream);
    }, [socket, remoteSocketId]);

    const handleIncomingCall = useCallback(async ({from, offer}) => {
        setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
        setMyStream(stream);
        console.log(`Incoming call`, from ,offer );

        const ans = await peer.getAnswer(offer);
        socket.emit("call:accepted", {to:from, ans});
    }, [socket]);

    const sendStreams = useCallback( () => {
        for (const track of myStream.getTracks()) {
            peer.peer.addTrack(track, myStream);
        }},[myStream])



    const handleCallAccepted = useCallback(async({from, ans})=>{
        await peer.setLocalDescription(ans);
        console.log(("Call Accepted"));

        sendStreams()
    },[sendStreams]);

    const handleNegoNeeded = useCallback(async () => {
        const offer = await peer.getOffer();
        socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
    }, [remoteSocketId, socket]);

    const handleNegoNeedIncoming = useCallback(async({from, offer})=>{
        const ans = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", {to:from, ans});
    },[socket]);

    const handleNegoNeedFinal = useCallback(async({ans})=>{
        await peer.setLocalDescription(ans)
    })

    // negotiation useEffect
    useEffect(()=>{
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
        }
    },[handleNegoNeeded]);

    // tracks useEffect
    useEffect(() => {
        peer.peer.addEventListener("track", async (event) => {
            const remoteStream = event.streams;
            console.log("GOT TRACKS!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);

    // socket useEffect
    useEffect(() => {
        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegoNeedIncoming);
        socket.on("peer:nego:final", handleNegoNeedFinal);

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego:needed", handleNegoNeedIncoming);
            socket.off("peer:nego:final", handleNegoNeedFinal);
        }
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted])


    return (
        <div>
            <h1>Room Page</h1>
            <h4>{remoteSocketId ? "Connected" : "No one in Room"}</h4>
            {myStream && <button onClick={sendStreams}>SEND STREAM</button>}
            {remoteSocketId && <button onClick={handleCallUser}>CALL</button>}
            {myStream && (
                <>
                    <h1>My Stream</h1>
                    <ReactPlayer
                        playing
                        height="100px"
                        width="200px"
                        url={myStream}
                    />
                </>
            )}
            {remoteStream && (
                <>
                    <h1>Remote Stream</h1>
                    <ReactPlayer
                        playing
                        height="100px"
                        width="200px"
                        url={remoteStream}
                    />
                </>
            )}
        </div>
    )
}

export default RoomPage;