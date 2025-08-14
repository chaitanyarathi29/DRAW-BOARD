import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET } from "@repo/backend-common/config";

export const middleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];

    if(!token){
        return res.status(404).json({
            message: "Unauthorized"
        })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if(decoded){
        req.username = decoded.username;
    } else{
        res.status(403).json({
            message: "Unauthorized"
        })
    }

    next();
}