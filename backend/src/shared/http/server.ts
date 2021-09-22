import 'reflect-metadata';
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import cors from 'cors';
import { errors } from 'celebrate';
import AppError from '@shared/errors/AppError';
import '@shared/typeorm';
import uploadConfig from '@config/upload';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from '@shared/http/routes';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));
app.use('/files', express.static(uploadConfig.directory));
app.use(routes);

app.use(errors());

app.use(
  (error: Error, request: Request, response: Response, next: NextFunction) => {
    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }

    return response.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  },
);

export const server = app.listen(process.env.PORT, () => {
  console.log('Server started on port 3333');
});
