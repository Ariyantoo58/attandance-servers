import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { 
        employee: {
          include: {
            department: true,
            position: true
          }
        }
      },
    });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role, 
      employeeId: user.employeeId 
    };
    
    const tokens = await this.getTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return {
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        employee: {
          include: {
            department: true,
            position: true
          }
        }
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, refreshToken, refreshTokenExp, ...result } = user;
    return { user: result };
  }



  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    // Check expiration
    if (user.refreshTokenExp && new Date() > user.refreshTokenExp) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role, 
      employeeId: user.employeeId 
    };
    
    const tokens = await this.getTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    
    return tokens;
  }

  private async getTokens(payload: any) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: 'secretKey',
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: 'refreshSecretKey', // Use separate secret for refresh
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExp: expiryDate,
      },
    });
  }
}

