import { blacklist } from '@shared/http/middlewares/isAuthenticated';

interface IRequest {
  token: string;
}

class CloseSessionsService {
  public async execute({ token }: IRequest): Promise<void> {
    blacklist.push(token as string);
  }
}

export default CloseSessionsService;
