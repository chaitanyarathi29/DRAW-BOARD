import express, { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";
import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/common/types";
import { middleware } from "./middleware";

const app = express();
const PORT = 3002

app.get('/', () => {
    console.log('hello');
});

app.post('/signup', (req: Request, res: Response) => {

    const result = CreateUserSchema.safeParse(req.body);

    if(!result.success){
        return res.status(403).json({
            message: "Invalid inputs"
        })
    }

    const { username, password, name } = result.data;

    const token = jwt.sign(username, JWT_SECRET);

    res.status(201).json({ 
        message: "User created successfully",
        token: token    
    });
    
})

app.post('/signin',(req: Request, res: Response) => {

    const result = SigninSchema.safeParse(req.body);

    if(!result.success){
        return res.status(403).json({
            message: "Invalid inputs"
        })
    }

    const {username, password} = result.data;

    const token = jwt.sign(username, JWT_SECRET);

    res.status(201).json({ 
        message: "User logged in successfully",
        token: token    
    });
});

app.post('/room', middleware, (req: Request, res: Response) => {

});


app.listen(PORT,() => {

    console.log(`server started at ${PORT}`);

})