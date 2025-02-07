import { Controller } from '@nestjs/common';
import { DeleteOldExperiencesService } from './delete-old-experiences.service';

@Controller('delete-old-experiences')
export class DeleteOldExperiencesController {
  constructor(private readonly deleteOldExperiencesService: DeleteOldExperiencesService) {}
}
