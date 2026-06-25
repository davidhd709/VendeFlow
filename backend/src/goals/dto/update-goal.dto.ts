import { PartialType, PickType } from '@nestjs/swagger';
import { CreateGoalDto } from './create-goal.dto';

// Solo se actualizan los objetivos; el periodo y el alcance no se mueven.
export class UpdateGoalDto extends PartialType(
  PickType(CreateGoalDto, ['targetAmount', 'targetSales'] as const),
) {}
