import { PartialType } from '@nestjs/swagger';
import { CreateProfitManagerDto } from './create-profit-manager.dto';

export class UpdateProfitManagerDto extends PartialType(
  CreateProfitManagerDto,
) {}
