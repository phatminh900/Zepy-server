"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const room_1 = require("./handler/room");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)());
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
const PORT = 3001;
exports.io.on("connection", (socket) => {
    (0, room_1.handleCall)(socket);
});
server.listen(PORT, () => {
    console.log(`App is listening on PORT ${PORT}`);
});
