import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const middleware = async(req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if(!token){
        return res.status(404).json({
            message: "Unauthorized"
        })
    }
    const jwtSecret = process.env.JWT_SECRET;
    if(!jwtSecret){
        return res.status(403).json({
            message: "Unauthorized"
        });
    }

    const decoded = jwt.verify(token, jwtSecret) as string;

    if(decoded){
        console.log(decoded);
        req.userId = decoded;
    } else{
        return res.status(403).json({
            message: "Unauthorized"
        })
    }

    next();
}