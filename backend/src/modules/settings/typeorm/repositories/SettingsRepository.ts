import { EntityRepository, Repository } from 'typeorm';
import Setting from '@modules/settings/typeorm/entities/Setting';

@EntityRepository(Setting)
class SettingsRepository extends Repository<Setting> {
  public async findByUser(user_id: number): Promise<Setting | undefined> {
    const setting = await this.findOne({
      where: { user: { id: user_id } },
      relations: ['user'],
    });

    return setting;
  }
}

export default SettingsRepository;
