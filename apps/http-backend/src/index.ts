import express, { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import { middleware } from "./middleware.js";
import bcrypt from 'bcrypt';
import { prismaClient } from "@repo/db/prisma";
import dotenv from 'dotenv'


const app = express();
dotenv.config();

app.use(express.json());

const PORT = 3002

app.get('/', () => {
    console.log('hello');
});

app.post('/signup', async (req: Request, res: Response) => {

    const result = CreateUserSchema.safeParse(req.body);

    if(!result.success){
        console.log(result.error);
        return res.status(403).json({
            message: "Invalid inputs"
        })
    }

    const { username, password, name } = result.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prismaClient.user.create({
            data: {
                email: username,
                password: hashedPassword,
                name: name
            }
        })
        const jwtSecret = process.env.JWT_SECRET;
        if(!jwtSecret){
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

        const token = jwt.sign(user.id, jwtSecret);

        res.status(201).json({ 
            user: user,
            message: "User created successfully",
            token: token    
        });
        
    } catch (error) {
        return res.status(411).json({
            message: "User with email already exists"
        })
    }
    
})

app.post('/signin',async (req: Request, res: Response) => {

    const result = SigninSchema.safeParse(req.body);

    if(!result.success){
        return res.status(403).json({
            message: "Invalid inputs"
        })
    }

    const {username, password} = result.data;


    const user = await prismaClient.user.findUnique({
        where:{
            email: username
        }
    });

    if(!user){
        return res.status(403).json({
            message: "Unauthorized"
        })
    }

    const isPasswordVerified = bcrypt.compare(password, user.password);

    if(!isPasswordVerified){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
    const jwtSecret = process.env.JWT_SECRET;
        if(!jwtSecret){
            return res.status(403).json({
                message: "Unauthorized"
            });
        }

    const token = jwt.sign(user.id, jwtSecret);

    return res.status(201).json({ 
        message: "User logged in successfully",
        token: token    
    });
});

app.post('/room', middleware, async(req: Request, res: Response) => {
    
    const result = CreateRoomSchema.safeParse(req.body);
    if(!result.success){
        res.json({
            message: "Incorrect Inputs"
        })
        return;
    }

    const userId = req.userId;

    if(!userId){
        return res.status(403).json({
            message: "Unauthorized"
        })
    }

    try {
        const room = await prismaClient.room.create({
            data: {
                slug: result.data.name,
                adminId: userId
            }
        })

        return res.json({
            room: room,
            message: "room created"
        })
    } catch (error) {
        console.log(error);
        return res.status(411).json({
            message: "room already exists"
        })
    }

});

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 50
        });

        res.json({
            messages
        })
    } catch(error) {
        console.log(error);
        res.json({
            messages: []
        })
    }
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.listen(PORT,() => {
    console.log(`server started at ${PORT}`);
})