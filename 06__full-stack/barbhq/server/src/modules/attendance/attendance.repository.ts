import { AttendanceModel } from './attendance.model';
import type { IAttendanceDocument } from './attendance.model';
import type { IAttendance } from './attendance.types';

export class AttendanceRepository {
  async clockIn(attendanceData: Partial<IAttendance>): Promise<IAttendanceDocument> {
    return await AttendanceModel.create(attendanceData);
  }

  async findOpenAttendance(
    employeeId: string,
    shopId: string,
  ): Promise<IAttendanceDocument | null> {
    return await AttendanceModel.findOne({
      employeeId,
      shopId,
      clockOut: { $exists: false },
    });
  }

  async findToday(
    employeeId: string,
    shopId: string,
    dateStr: string,
  ): Promise<IAttendanceDocument | null> {
    return await AttendanceModel.findOne({
      employeeId,
      shopId,
      date: dateStr,
    });
  }

  async findHistory(
    shopId: string,
    filters: { employeeId?: string; startDate?: string; endDate?: string },
  ): Promise<IAttendanceDocument[]> {
    const query: any = { shopId };

    if (filters.employeeId) {
      query.employeeId = filters.employeeId;
    }

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.date.$lte = filters.endDate;
      }
    }

    return await AttendanceModel.find(query).sort({ clockIn: -1 });
  }

  async findById(id: string, shopId: string): Promise<IAttendanceDocument | null> {
    return await AttendanceModel.findOne({ _id: id, shopId });
  }
}
