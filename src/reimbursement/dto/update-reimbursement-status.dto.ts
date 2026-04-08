import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateReimbursementStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status: string;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
