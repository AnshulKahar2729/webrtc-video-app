import React, {useCallback, useEffect, useState} from "react";
import {useSocket} from "../context/SocketProvider";
import {useNavigate} from "react-router-dom";

const LobbyScreen = () => {

    const [email, setEmail] = useState("");
    const [room, setRoom] = useState("");

    const socket = useSocket();
    const navigate = useNavigate();

    const handleJoinRoom = useCallback((data) => {
        const {email, room} = data;
        console.log(email, room);
        navigate(`/room/${room}`);
    },[navigate]);

    useEffect(()=>{
        socket.on("room:join", handleJoinRoom);

        return () => {
            socket.off("room:join", handleJoinRoom);
        }
    },[socket, handleJoinRoom])

    const handleSubmitForm = useCallback((event)=>{
        event.preventDefault();
        if(email && room){
            socket.emit("room:join", {email, room});
        }
    },[email, room, socket])

    return <>
        <h1>Lobby</h1>
        <form onSubmit={handleSubmitForm}>
            <label htmlFor={"email"}>Email ID</label>
            <input type={"email"} id={"email"} value={email} onChange={(event) => setEmail(event.target.value)}/>
            <br/>
            <label htmlFor={"room"}>Room Number</label>
            <input type={"text"} id={"room"} value={room} onChange={(event) => setRoom(event.target.value)}/>
            <br/>
            <button>Join</button>
        </form>
    </>
};

export default LobbyScreen;