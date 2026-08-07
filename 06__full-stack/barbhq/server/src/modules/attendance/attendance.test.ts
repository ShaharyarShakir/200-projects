import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import mongoose from 'mongoose';
import { AttendanceService } from './attendance.service';
import { EmployeeService } from '../employee/employee.service';
import { AttendanceModel } from './attendance.model';
import { EmployeeModel } from '../employee/employee.model';
import { UserRole } from '../user/user.types';
import { EmployeeStatus, EmploymentType, SalaryType } from '../employee/employee.types';

const testMongoUri = 'mongodb://localhost:27017/barbhq-test';

describe('Attendance Service', () => {
  let attendanceService: AttendanceService;
  let employeeService: EmployeeService;
  const mockShopId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testMongoUri);
    }
    attendanceService = new AttendanceService();
    employeeService = new EmployeeService();
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await AttendanceModel.deleteMany({});
    await EmployeeModel.deleteMany({});
  });

  it('should successfully clock-in an active employee', async () => {
    const employee = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    const attendance = await attendanceService.clockIn(
      mockShopId,
      employee._id.toString(),
      'Opening shift',
    );

    expect(attendance.employeeId.toString()).toBe(employee._id.toString());
    expect(attendance.clockIn).toBeInstanceOf(Date);
    expect(attendance.clockOut).toBeUndefined();

    // Check that employee status is updated
    const updatedEmployee = await EmployeeModel.findById(employee._id);
    expect(updatedEmployee?.isClockedIn).toBe(true);
  });

  it('should reject clock-in for an already clocked-in employee', async () => {
    const employee = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    await attendanceService.clockIn(mockShopId, employee._id.toString());

    expect(attendanceService.clockIn(mockShopId, employee._id.toString())).rejects.toThrow(
      'Employee is already clocked in',
    );
  });

  it('should reject clock-in for a non-ACTIVE employee', async () => {
    const employee = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    // Deactivate employee
    await employeeService.deactivateEmployee(employee._id.toString(), mockShopId, mockUserId);

    expect(attendanceService.clockIn(mockShopId, employee._id.toString())).rejects.toThrow(
      'Employee is not ACTIVE',
    );
  });

  it('should successfully clock-out and calculate worked minutes and overtime', async () => {
    const employee = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    const attendance = await attendanceService.clockIn(mockShopId, employee._id.toString());

    // Backdate clock-in time to simulate worked hours (9 hours ago for overtime)
    const nineHoursAgo = new Date();
    nineHoursAgo.setHours(nineHoursAgo.getHours() - 9);
    attendance.clockIn = nineHoursAgo;
    await attendance.save();

    const updatedAttendance = await attendanceService.clockOut(
      mockShopId,
      employee._id.toString(),
      'Leaving shift',
    );

    expect(updatedAttendance.clockOut).toBeInstanceOf(Date);

    // 9 hours = 540 minutes
    expect(updatedAttendance.workedMinutes).toBeGreaterThanOrEqual(539);

    // Overtime = 540 - 480 = 60 minutes
    expect(updatedAttendance.overtimeMinutes).toBeGreaterThanOrEqual(59);

    const updatedEmployee = await EmployeeModel.findById(employee._id);
    expect(updatedEmployee?.isClockedIn).toBe(false);
  });

  it('should reject clock-out if the employee is not clocked in', async () => {
    const employee = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    expect(attendanceService.clockOut(mockShopId, employee._id.toString())).rejects.toThrow(
      'Employee is not clocked in',
    );
  });
});
