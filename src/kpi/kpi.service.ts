import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async calculateMonthlyKpi(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 1. Attendance Score (Max 20 points, weight 20%)
    const attendanceCount = await this.prisma.attendance.count({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
        status: 'PRESENT',
      },
    });
    // Assume 20 working days is 100% attendance score
    const attendanceScore = Math.min((attendanceCount / 20) * 100, 100);

    // 2. Task Score (Max 40 points, weight 40%)
    const tasks = await this.prisma.task.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    });

    let totalWeight = 0;
    let completedWeightedScore = 0;

    tasks.forEach((task) => {
      totalWeight += task.weight;
      if (task.status === 'COMPLETE') {
        // Base score is the weight
        let score = task.weight;
        // Adjust by quality rating if available (1-5 scale, 3 is neutral)
        if (task.qualityRating) {
          const multiplier = task.qualityRating / 3;
          score *= multiplier;
        }
        completedWeightedScore += score;
      }
    });

    const taskScore = totalWeight > 0 ? Math.min((completedWeightedScore / totalWeight) * 100, 100) : 100;

    // 3. Behavioral Score
    const existingReview = await this.prisma.kpiReview.findFirst({
      where: { employeeId, month, year },
      include: { metrics: true },
    });

    let metrics = [];
    if (existingReview && existingReview.metrics.length > 0) {
      metrics = existingReview.metrics;
    } else {
      // Fetch Global Criteria if no review exists or no metrics saved
      const globalCriteria = await this.prisma.kpiCriteria.findMany({
        where: { isActive: true },
      });
      metrics = globalCriteria.map((c) => ({
        name: c.name,
        score: 0,
      }));
    }

    let behavioralScore = 0;
    if (metrics.length > 0) {
      const sum = metrics.reduce((acc, m) => acc + (m.score || 0), 0);
      behavioralScore = sum / metrics.length;
    } else {
      // Fallback to legacy if everything else fails
      behavioralScore = existingReview?.behavioralScore || 0;
    }

    // Final Calculation (Overall 0-100)
    const overallScore =
      attendanceScore * 0.2 + taskScore * 0.4 + behavioralScore * 0.4;

    return {
      attendanceScore,
      taskScore,
      behavioralScore,
      overallScore,
      attendanceCount,
      totalWeight,
      completedWeightedScore,
      metrics,
    };
  }

  async upsertReview(data: {
    employeeId: string;
    reviewerId: string;
    month: number;
    year: number;
    metrics?: { name: string; score: number }[];
    comment?: string;
    status?: string;
  }) {
    // 1. Sync metrics first if provided
    let bScore = 0;
    if (data.metrics && data.metrics.length > 0) {
      const review = await this.prisma.kpiReview.upsert({
        where: {
          employeeId_month_year: {
            employeeId: data.employeeId,
            month: data.month,
            year: data.year,
          },
        },
        update: { reviewerId: data.reviewerId },
        create: {
          employeeId: data.employeeId,
          reviewerId: data.reviewerId,
          month: data.month,
          year: data.year,
        },
      });

      // Clear old metrics and add new ones
      await this.prisma.kpiMetric.deleteMany({
        where: { kpiReviewId: review.id },
      });

      await this.prisma.kpiMetric.createMany({
        data: data.metrics.map((m) => ({
          kpiReviewId: review.id,
          name: m.name,
          score: m.score,
        })),
      });

      const sum = data.metrics.reduce((acc, m) => acc + m.score, 0);
      bScore = sum / data.metrics.length;
    }

    const scores = await this.calculateMonthlyKpi(
      data.employeeId,
      data.month,
      data.year,
    );
    const finalBScore =
      data.metrics && data.metrics.length > 0 ? bScore : scores.behavioralScore;

    return this.prisma.kpiReview.update({
      where: {
        employeeId_month_year: {
          employeeId: data.employeeId,
          month: data.month,
          year: data.year,
        },
      },
      data: {
        reviewerId: data.reviewerId,
        behavioralScore: finalBScore,
        taskScore: scores.taskScore,
        attendanceScore: scores.attendanceScore,
        overallScore:
          scores.attendanceScore * 0.2 +
          scores.taskScore * 0.4 +
          finalBScore * 0.4,
        comment: data.comment,
        status: data.status,
      },
    });
  }

  async getEmployeePerformanceHistory(employeeId: string) {
    return this.prisma.kpiReview.findMany({
      where: { employeeId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getAllKpiSummaries(month: number, year: number) {
    const employees = await this.prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        designation: true,
        avatarUrl: true,
      },
    });

    const reviews = await Promise.all(
      employees.map(async (emp) => {
        const stats = await this.calculateMonthlyKpi(emp.id, month, year);
        const review = await this.prisma.kpiReview.findUnique({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } },
        });

        return {
          employee: emp,
          stats,
          reviewStatus: review?.status || 'NOT_STARTED',
        };
      }),
    );

    return reviews;
  }

  // --- Global Criteria Management ---

  async getGlobalCriteria() {
    let criteria = await this.prisma.kpiCriteria.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Seed defaults if empty
    if (criteria.length === 0) {
      const defaults = ['Discipline', 'Teamwork', 'Communication'];
      await this.prisma.kpiCriteria.createMany({
        data: defaults.map((name) => ({ name })),
      });
      criteria = await this.prisma.kpiCriteria.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return criteria;
  }

  async addGlobalCriteria(name: string) {
    return this.prisma.kpiCriteria.create({
      data: { name },
    });
  }

  async deleteGlobalCriteria(id: string) {
    return this.prisma.kpiCriteria.delete({
      where: { id },
    });
  }
}
