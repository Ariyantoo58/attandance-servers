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
  async recognize(
    @Body('employeeId') employeeId: string,
    @Body('latitude') latitude: string,
    @Body('longitude') longitude: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      console.error('[FaceRecognitionController] No file uploaded');
      return { recognized: false, message: 'Foto tidak terdeteksi.' };
    }
    
    try {
      const lat = latitude ? parseFloat(latitude) : undefined;
      const lng = longitude ? parseFloat(longitude) : undefined;
      
      console.log(`[FaceRecognitionController] Processing recognize for employee: ${employeeId} at ${lat}, ${lng}`);
      const result = await this.faceService.recognize(file.buffer, employeeId, lat, lng);
      
      return {
        recognized: result.recognized,
        name: result.name,
        similarity: `${result.confidence}%`,
        message: result.message,
      };
    } catch (error: any) {
      console.error('[FaceRecognitionController] Error during recognize:', error);
      
      // Extract the most descriptive error message
      let message = 'Gagal memproses data wajah (Server Error).';
      if (error.response?.message) {
        message = Array.isArray(error.response.message) ? error.response.message[0] : error.response.message;
      } else if (error.message) {
        message = error.message;
      }
      
      return { recognized: false, message };
    }
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
