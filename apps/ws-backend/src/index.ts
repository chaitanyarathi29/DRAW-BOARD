import { WebSocketServer, WebSocket } from "ws";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prismaClient } from "@repo/db/prisma";

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

interface User {
    ws: WebSocket,
    rooms: string[],
    userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
    try {

        const jwtSecret = process.env.JWT_SECRET;
        if(!jwtSecret){
            return null;
        }

        const decoded = jwt.verify(token, jwtSecret) as string;
        
        if(!decoded){
            return null;
        }

        return decoded;

    } catch (error) {
        return null;
    }
}

wss.on('connection', function connection(ws, request) {
    const url = request.url;
    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get('token') ?? "";
    const userId = checkUser(token);

    if(userId == null){
        ws.close();
        return null;
    }
    
    users.push({
        ws,
        userId,
        rooms: []
    })

    ws.on('message', async function message(data) {

        const parsedData = JSON.parse(data as unknown as  string);
        
        if(parsedData.type === "join_room") { //{type: "join_room",roomId: "1"}
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }

        if(parsedData.type === "leave_room") {
            const user = users.find(x => x.ws === ws);
            if (!user) {
                return;
            }
            user.rooms = user?.rooms.filter(x => x === parsedData.room);
        }

        if(parsedData.type === "chat"){ //{type: "chat", message: "hi there",roomId: "123"}
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            try {
                await prismaClient.chat.create({
                    data:{
                        roomId,
                        message,
                        userId
                    }
                });
            } catch (error) {
                throw new Error('roomId invalid');
            }

            users.forEach(user => {
                if(user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId 
                    }))
                }
            })
        }
    });    
});