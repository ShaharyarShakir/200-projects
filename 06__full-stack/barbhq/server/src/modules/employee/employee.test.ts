import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'bun:test';
import mongoose from 'mongoose';
import { EmployeeService } from './employee.service';
import { EmployeeModel } from './employee.model';
import { UserRole } from '../user/user.types';
import { EmployeeStatus, EmploymentType, SalaryType } from './employee.types';

const testMongoUri = 'mongodb://localhost:27017/barbhq-test';

describe('Employee Service', () => {
  let employeeService: EmployeeService;
  const mockShopId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testMongoUri);
    }
    employeeService = new EmployeeService();
  });

  afterAll(async () => {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await EmployeeModel.deleteMany({});
  });

  it('should successfully create an employee with sequential employeeCode', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
      salary: 3000,
    };

    const emp1 = await employeeService.createEmployee(mockShopId, mockUserId, payload);
    expect(emp1.employeeCode).toBe('EMP-0001');
    expect(emp1.firstName).toBe('John');

    const emp2 = await employeeService.createEmployee(mockShopId, mockUserId, {
      ...payload,
      email: 'another@example.com',
    });
    expect(emp2.employeeCode).toBe('EMP-0002');
  });

  it('should reject creating an employee with duplicate email in the same shop', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
      salary: 3000,
    };

    await employeeService.createEmployee(mockShopId, mockUserId, payload);

    expect(
      employeeService.createEmployee(mockShopId, mockUserId, {
        ...payload,
        firstName: 'Johnny',
      }),
    ).rejects.toThrow('Employee email already exists in this shop');
  });

  it('should allow identical emails in different shops', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
      salary: 3000,
    };

    const anotherShopId = new mongoose.Types.ObjectId().toString();

    const emp1 = await employeeService.createEmployee(mockShopId, mockUserId, payload);
    const emp2 = await employeeService.createEmployee(anotherShopId, mockUserId, payload);

    expect(emp1.shopId.toString()).toBe(mockShopId);
    expect(emp2.shopId.toString()).toBe(anotherShopId);
  });

  it('should successfully update employee details', async () => {
    const emp = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    const updated = await employeeService.updateEmployee(
      emp._id.toString(),
      mockShopId,
      mockUserId,
      {
        firstName: 'Johnathan',
        salary: 4000,
      },
    );

    expect(updated.firstName).toBe('Johnathan');
    expect(updated.salary).toBe(4000);
  });

  it('should successfully deactivate an employee by setting status to INACTIVE', async () => {
    const emp = await employeeService.createEmployee(mockShopId, mockUserId, {
      firstName: 'John',
      lastName: 'Barber',
      email: 'john.barber@example.com',
      role: UserRole.BARBER,
      employmentType: EmploymentType.FULL_TIME,
      salaryType: SalaryType.MONTHLY,
    });

    const deactivated = await employeeService.deactivateEmployee(
      emp._id.toString(),
      mockShopId,
      mockUserId,
    );
    expect(deactivated.status).toBe(EmployeeStatus.INACTIVE);
  });
});
