import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class NearbyQueryDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number) // This ensures the parameter is treated as a number
  latitude: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number) // This ensures the parameter is treated as a number
  longitude: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  distance?: number = 500000;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  count?: number = 10;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_population?: number = 0;
}
