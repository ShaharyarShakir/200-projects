import type { Request, Response } from 'express';
import { employeeService, EmployeeService } from './employee.service';
import { EmployeeMapper } from './employee.mapper';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';

export class EmployeeController {
  constructor(private service: EmployeeService = employeeService) {}

  getMyDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employeeId = req.user!.id;
    const dashboard = await this.service.getEmployeeDashboard(shopId, employeeId);
    sendResponse(res, 200, dashboard, 'Employee dashboard data retrieved successfully');
  });

  getEmployees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const employees = await this.service.getEmployeesByShop(shopId);
    const dtos = employees.map((e) => EmployeeMapper.toDto(e));
    sendResponse(res, 200, dtos, 'Employees retrieved successfully');
  });

  getEmployeeById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const id = req.params.id as string;
    const employee = await this.service.getEmployeeById(id, shopId);
    sendResponse(res, 200, EmployeeMapper.toDto(employee), 'Employee details retrieved successfully');
  });

  createEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const employee = await this.service.createEmployee(shopId, actorId, req.body);
    sendResponse(res, 201, EmployeeMapper.toDto(employee), 'Employee created successfully');
  });

  updateEmployee = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const id = req.params.id as string;
    const updated = await this.service.updateEmployee(id, shopId, actorId, req.body);
    sendResponse(res, 200, EmployeeMapper.toDto(updated), 'Employee updated successfully');
  });

  toggleStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const shopId = req.user!.shopId;
    const actorId = req.user!.id;
    const id = req.params.id as string;
    const { isActive } = req.body;
    const updated = await this.service.toggleEmployeeStatus(id, shopId, actorId, isActive);
    sendResponse(res, 200, EmployeeMapper.toDto(updated), 'Employee status updated successfully');
  });
}

export const employeeController = new EmployeeController();
