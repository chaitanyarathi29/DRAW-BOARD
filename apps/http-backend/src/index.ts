import express, { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import { middleware } from "./middleware";
import bcrypt from 'bcrypt';
import { prismaClient } from "@repo/db/prisma";


const app = express();

app.use(express.json());

const PORT = 3002

app.get('/', () => {
    console.log('hello');
});

app.post('/signup', async (req: Request, res: Response) => {

    const result = CreateUserSchema.safeParse(req.body);

    if(!result.success){
        return res.status(403).json({
            message: "Invalid inputs"
        })
    }

    const { username, password, name } = result.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = prismaClient.user.create({
            data: {
                email: username,
                password: hashedPassword,
                name: name
            }
        })
        
    } catch (error) {
        return res.status(411).json({
            message: "User with email already exists"
        })
    }
    
    const token = jwt.sign(username, JWT_SECRET);

    res.status(201).json({ 
        message: "User created successfully",
        token: token    
    });
    
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
        return res.status(404).json({
            message: "User not found"
        })
    }

    const isPasswordVerified = bcrypt.compare(password, user.password);

    if(!isPasswordVerified){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const token = jwt.sign(username, JWT_SECRET);

    return res.status(201).json({ 
        message: "User logged in successfully",
        token: token    
    });
});

app.post('/room', middleware, (req: Request, res: Response) => {

});


app.listen(PORT,() => {

    console.log(`server started at ${PORT}`);

})