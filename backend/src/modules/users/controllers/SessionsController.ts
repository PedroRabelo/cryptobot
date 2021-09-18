import { Request, Response } from 'express';
import CreateSessionsService from '@modules/users/services/CreateSessionsService';
import CloseSessionsService from '../services/CloseSessionsService';

export default class SessionsController {
  public async create(request: Request, response: Response): Promise<Response> {
    const { email, password } = request.body;

    const createSession = new CreateSessionsService();

    const user = await createSession.execute({ email, password });

    return response.json(user);
  }

  public async close(request: Request, response: Response): Promise<void> {
    const token: string = request.headers['authorization'] as string;

    const closeSession = new CloseSessionsService();
    await closeSession.execute({ token });

    response.sendStatus(200);
  }
}
