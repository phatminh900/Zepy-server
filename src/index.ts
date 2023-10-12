import http from "http";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { handleCall } from "./handler/room";

const app = express();
const server = http.createServer(app);
app.use(cors());
export const io = new Server(server, {
  transports: ["websocket"],

  cors: {
    origin: "*",
  },
});
const PORT = process.env.PORT;

io.on("connection", (socket) => {
  handleCall(socket);
});

server.listen(PORT, () => {
  console.log(`App is listening on PORT ${PORT}`);
});
