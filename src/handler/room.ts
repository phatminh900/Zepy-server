import { Socket } from "socket.io";
import supabase from "../supabase";
import { io } from "..";

export async function updateUser({
  userId,
  field,
  value,
}: {
  userId: string;
  field: string;
  value: any;
}) {
  const { error } = await supabase
    .from("profile")
    .update({ [field]: value })
    .eq("id", userId);
  if (error) {
    console.error(error.message);
  }
}

export const handleCall = (socket: Socket) => {
  async function setUserOnline({ userId }: { userId: string }) {
    const { data: user } = await supabase
      .from("active_user")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (user) return;
    await supabase
      .from("active_user")
      .insert([{ user_id: userId, socket_id: socket.id }]);
    await updateUser({ userId, field: "status", value: "Online" });
  }
  async function setUserOffline({ userId }: { userId: string }) {
    await supabase.from("active_user").delete().eq("user_id", userId);
    await updateUser({
      userId,
      field: "status",
      value: new Date().toISOString(),
    });
  }
  async function callOther({
    userIdToCall,
    callId,
  }: {
    userIdToCall: string;
    callId: string;
  }) {
    // get user socket id
    const { data: userSocketId } = await supabase
      .from("active_user")
      .select("socket_id")
      .eq("user_id", userIdToCall)
      .single();
    console.log(userSocketId);
    console.log(socket);
    socket.to(userSocketId?.socket_id).emit("other_call", {
      callId,
    });
  }
  function joinCall({ callId }: { callId: string }) {
    const { rooms: joinedRooms } = socket;
    if (Array.from(joinedRooms || []).includes(callId)) {
      return console.log(`Already joined another call`, callId);
    }
    const clients = Array.from(io.sockets.adapter.rooms.get(callId) || []);
    clients.forEach((client) => {
      io.to(client).emit("add_participant", {
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

  function getIce({
    iceCandidate,
    participantId,
  }: {
    iceCandidate: RTCIceCandidate;
    participantId: string;
  }) {
    io.to(participantId).emit("ice_candidate", {
      participantId: socket.id,
      iceCandidate,
    });
  }
  function getSdp({
    sdp,
    participantId,
  }: {
    sdp: RTCSessionDescription;
    participantId: string;
  }) {
    io.to(participantId).emit("session_description", {
      participantId: socket.id,
      sdp,
    });
  }
  function leaveCall() {
    const { rooms } = socket;
    Array.from(rooms || []).forEach((room) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(room) || []);
      clients.forEach((clientId) => {
        io.to(clientId).emit("remove_participant", {
          participantId: socket.id,
        });
        socket.emit("remove_participant", { participantId: clientId });
        socket.leave(room);
      });
    });
  }
  async function rejectCall({ userCallId }: { userCallId: string }) {
    const { data: userSocketId } = await supabase
      .from("call")
      .select("user_call_socketId")
      .eq("user_id", userCallId)
      .single();

    io.to(userSocketId?.user_call_socketId).emit("reject_call");
  }
  function toggleMedia({
    participantId,
    audio,
    video,
  }: {
    participantId: string;
    audio: boolean;
    video: boolean;
  }) {
    io.to(participantId).emit("toggle_media", { audio, video });
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
