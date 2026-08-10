import { Attendance, type IAttendance } from '../../models/attendance.model';
import type { UpdateAttendanceDto } from './attendance.types';

export class AttendanceRepository {
  async create(data: Partial<IAttendance>): Promise<IAttendance> {
    const attendance = new Attendance(data);
    return attendance.save();
  }

  async findByEmployeeAndDate(shopId: string, employeeId: string, date: string): Promise<IAttendance | null> {
    return Attendance.findOne({ shopId, employeeId, date });
  }

  async findByShop(shopId: string, date?: string, employeeId?: string): Promise<IAttendance[]> {
    const query: Record<string, any> = { shopId };
    if (date) query.date = date;
    if (employeeId) query.employeeId = employeeId;
    return Attendance.find(query)
      .populate('employeeId', 'firstName lastName email role')
      .sort({ date: -1, createdAt: -1 });
  }

  async findByIdAndShop(id: string, shopId: string): Promise<IAttendance | null> {
    return Attendance.findOne({ _id: id, shopId }).populate('employeeId', 'firstName lastName email role');
  }

  async update(id: string, shopId: string, data: UpdateAttendanceDto): Promise<IAttendance | null> {
    return Attendance.findOneAndUpdate(
      { _id: id, shopId },
      { $set: data },
      { new: true, runValidators: true },
    );
  }
}

export const attendanceRepository = new AttendanceRepository();
