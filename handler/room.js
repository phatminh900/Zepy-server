"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCall = exports.updateUser = void 0;
const supabase_1 = __importDefault(require("../supabase"));
const __1 = require("..");
function updateUser({ userId, field, value, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { error } = yield supabase_1.default
            .from("profile")
            .update({ [field]: value })
            .eq("id", userId);
        if (error) {
            console.error(error.message);
        }
    });
}
exports.updateUser = updateUser;
const handleCall = (socket) => {
    function setUserOnline({ userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(userId);
            const { data: user } = yield supabase_1.default
                .from("active_user")
                .select("id")
                .eq("user_id", userId)
                .single();
            if (user)
                return;
            yield supabase_1.default
                .from("active_user")
                .insert([{ user_id: userId, socket_id: socket.id }]);
            yield updateUser({ userId, field: "status", value: "Online" });
        });
    }
    function setUserOffline({ userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield supabase_1.default.from("active_user").delete().eq("user_id", userId);
            yield updateUser({
                userId,
                field: "status",
                value: new Date().toISOString(),
            });
        });
    }
    function callOther({ userIdToCall, callId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            // get user socket id
            const { data: userSocketId } = yield supabase_1.default
                .from("active_user")
                .select("socket_id")
                .eq("user_id", userIdToCall)
                .single();
            console.log(userSocketId);
            console.log(socket);
            socket.to(userSocketId === null || userSocketId === void 0 ? void 0 : userSocketId.socket_id).emit("other_call", {
                callId,
            });
        });
    }
    function joinCall({ callId }) {
        const { rooms: joinedRooms } = socket;
        if (Array.from(joinedRooms || []).includes(callId)) {
            return console.log(`Already joined another call`, callId);
        }
        const clients = Array.from(__1.io.sockets.adapter.rooms.get(callId) || []);
        clients.forEach((client) => {
            __1.io.to(client).emit("add_participant", {
                participantId: socket.id,
                isCreateOffer: false,
            });
            socket.emit("add_participant", {
                participantId: client,
                isCreateOffer: true,
            });
        });
        socket.join(callId);
    }
    function getIce({ iceCandidate, participantId, }) {
        __1.io.to(participantId).emit("ice_candidate", {
            participantId: socket.id,
            iceCandidate,
        });
    }
    function getSdp({ sdp, participantId, }) {
        __1.io.to(participantId).emit("session_description", {
            participantId: socket.id,
            sdp,
        });
    }
    function leaveCall() {
        const { rooms } = socket;
        Array.from(rooms || []).forEach((room) => {
            const clients = Array.from(__1.io.sockets.adapter.rooms.get(room) || []);
            clients.forEach((clientId) => {
                __1.io.to(clientId).emit("remove_participant", {
                    participantId: socket.id,
                });
                socket.emit("remove_participant", { participantId: clientId });
                socket.leave(room);
            });
        });
    }
    function rejectCall({ userCallId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: userSocketId } = yield supabase_1.default
                .from("call")
                .select("user_call_socketId")
                .eq("user_id", userCallId)
                .single();
            __1.io.to(userSocketId === null || userSocketId === void 0 ? void 0 : userSocketId.user_call_socketId).emit("reject_call");
        });
    }
    function toggleMedia({ participantId, audio, video, }) {
        __1.io.to(participantId).emit("toggle_media", { audio, video });
    }
    socket.on("toggle_media", toggleMedia);
    socket.on("logged", setUserOnline);
    socket.on("leave", setUserOffline);
    socket.on("reject_call", rejectCall);
    //
    socket.on("call", callOther);
    socket.on("join_call", joinCall);
    socket.on("relay_ice", getIce);
    socket.on("relay_sdp", getSdp);
    socket.on("leave_call", leaveCall);
    socket.on("disconnecting", leaveCall);
};
exports.handleCall = handleCall;
