import { NextFunction, Request, Response } from "express";


const requestTimestampMiddleware = (request: Request, response: Response, next: NextFunction) => {
  console.log(`Request recieved at ${(new Date).toLocaleString()}`);
  
  next();
}

export {requestTimestampMiddleware};