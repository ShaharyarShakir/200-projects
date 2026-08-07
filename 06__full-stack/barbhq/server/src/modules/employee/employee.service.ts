import { EmployeeRepository } from './employee.repository';
import { EmployeeModel } from './employee.model';
import type { IEmployeeDocument } from './employee.model';
import type { IEmployee } from './employee.types';
import { ApiError } from '../../utils/ApiError';

export class EmployeeService {
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.employeeRepository = new EmployeeRepository();
  }

  async getEmployeeById(id: string, shopId: string): Promise<IEmployeeDocument> {
    const employee = await this.employeeRepository.findById(id, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }
    return employee;
  }

  async getEmployeeByEmail(email: string, shopId: string): Promise<IEmployeeDocument | null> {
    return await this.employeeRepository.findByEmail(email, shopId);
  }

  async getAllEmployees(shopId: string): Promise<IEmployeeDocument[]> {
    return await this.employeeRepository.findAll(shopId);
  }

  async createEmployee(
    shopId: string,
    createdBy: string,
    employeeData: Partial<IEmployee>,
  ): Promise<IEmployeeDocument> {
    if (!employeeData.email) {
      throw new ApiError(400, 'Employee email is required');
    }

    const emailExists = await this.employeeRepository.exists(employeeData.email, shopId);
    if (emailExists) {
      throw new ApiError(400, 'Employee email already exists in this shop');
    }

    // Generate unique employee code based on global count
    const totalCount = await EmployeeModel.countDocuments({});
    const employeeCode = `EMP-${String(totalCount + 1).padStart(4, '0')}`;

    const newEmployee = await this.employeeRepository.create({
      ...employeeData,
      shopId,
      employeeCode,
      isClockedIn: false,
      createdBy,
      updatedBy: createdBy,
    });

    return newEmployee;
  }

  async updateEmployee(
    id: string,
    shopId: string,
    updatedBy: string,
    employeeData: Partial<IEmployee>,
  ): Promise<IEmployeeDocument> {
    const employee = await this.employeeRepository.findById(id, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    if (employeeData.email && employeeData.email.toLowerCase() !== employee.email.toLowerCase()) {
      const emailExists = await this.employeeRepository.exists(employeeData.email, shopId);
      if (emailExists) {
        throw new ApiError(400, 'Employee email already exists in this shop');
      }
    }

    const updated = await this.employeeRepository.update(id, shopId, {
      ...employeeData,
      updatedBy,
    });

    if (!updated) {
      throw new ApiError(404, 'Employee not found');
    }

    return updated;
  }

  async deactivateEmployee(
    id: string,
    shopId: string,
    updatedBy: string,
  ): Promise<IEmployeeDocument> {
    const employee = await this.employeeRepository.findById(id, shopId);
    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const deactivated = await this.employeeRepository.deactivate(id, shopId, updatedBy);
    if (!deactivated) {
      throw new ApiError(404, 'Employee not found');
    }

    return deactivated;
  }
}
