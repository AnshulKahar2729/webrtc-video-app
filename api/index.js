const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: true,
});

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});


const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();


io.on("connection", (socket) => {
    console.log(`Socket connected : `, socket.id);
    socket.on("room:join", (data) => {
        const {email, room} = data;
        emailToSocketIdMap.set(email, socket.id);
        socketidToEmailMap.set(socket.id, email);
        io.to(room).emit("user:joined", {email, id:socket.id});
        socket.join(room);
        io.to(socket.id).emit("room:join", data);
    });

    socket.on("user:call", ({to, offer}) => {
        io.to(to).emit("incoming:call", {from:socket.id, offer});
    });

    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("peer:nego:needed", ({to, offer}) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id,offer });
    });

    socket.on("peer:nego:done", ({to,ans})=>{
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id,ans });
    })
});

server.listen(4000, () => {
    console.log(`Server is running on port ${PORT}`);
});