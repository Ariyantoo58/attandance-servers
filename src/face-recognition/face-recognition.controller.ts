import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceRecognitionService } from './face-recognition.service';

@Controller('face-recognition')
export class FaceRecognitionController {
  constructor(private readonly faceService: FaceRecognitionService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  async register(@Body('employeeId') employeeId: string, @UploadedFile() file: any) {
    if (!employeeId) {
      return { status: 'failed', message: 'ID karyawan tidak boleh kosong.' };
    }
    const result = await this.faceService.register(employeeId, file.buffer);
    return {
      status: result.success ? 'success' : 'failed',
      message: result.message,
    };
  }

  @Post('recognize')
  @UseInterceptors(FileInterceptor('file'))
  async recognize(@UploadedFile() file: any) {
    const result = await this.faceService.recognize(file.buffer);
    return {
      recognized: result.recognized,
      name: result.name,
      similarity: `${result.confidence}%`,
      message: result.message,
    };
  }

  @Get('status/:id')
  async getStatus(@Param('id') id: string) {
    return this.faceService.checkStatus(id);
  }

  @Delete('reset/:id')
  async reset(@Param('id') id: string) {
    return this.faceService.delete(id);
  }
}
