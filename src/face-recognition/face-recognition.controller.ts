import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FaceRecognitionService } from './face-recognition.service';

@Controller('face-recognition')
export class FaceRecognitionController {
  constructor(private readonly faceService: FaceRecognitionService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('file'))
  async register(@Body('name') name: string, @UploadedFile() file: any) {
    const result = await this.faceService.register(name, file.buffer);
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
}
