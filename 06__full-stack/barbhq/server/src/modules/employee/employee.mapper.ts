import type { IEmployeeDocument } from './employee.model';

export class EmployeeMapper {
  static toResponse(employee: IEmployeeDocument) {
    return {
      id: employee._id.toString(),
      shopId: employee.shopId.toString(),
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      avatar: employee.avatar,
      employmentType: employee.employmentType,
      hireDate: employee.hireDate,
      salaryType: employee.salaryType,
      salary: employee.salary,
      commissionEnabled: employee.commissionEnabled,
      commissionRate: employee.commissionRate,
      status: employee.status,
      isClockedIn: employee.isClockedIn,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  static toResponseList(employees: IEmployeeDocument[]) {
    return employees.map((emp) => this.toResponse(emp));
  }
}
