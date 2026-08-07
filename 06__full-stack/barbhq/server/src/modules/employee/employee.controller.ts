import type { Request, Response } from 'express';
import { EmployeeService } from './employee.service';
import { EmployeeMapper } from './employee.mapper';
import { sendResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

const employeeService = new EmployeeService();

export const getEmployees = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Employees can view their own profile only, unless they are OWNER/MANAGER
  const isPrivileged = req.user.role === 'OWNER' || req.user.role === 'MANAGER';
  if (!isPrivileged) {
    // Return list containing only the user's corresponding employee record
    const employee = await employeeService.getEmployeeByEmail(req.user.email, req.user.shopId);
    if (!employee) {
      return sendResponse(res, 200, [], 'Employees retrieved successfully');
    }
    return sendResponse(
      res,
      200,
      EmployeeMapper.toResponseList([employee]),
      'Employees retrieved successfully',
    );
  }

  const employees = await employeeService.getAllEmployees(req.user.shopId);
  sendResponse(
    res,
    200,
    EmployeeMapper.toResponseList(employees),
    'Employees retrieved successfully',
  );
});

export const getEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.shopId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const id = req.params.id as string;
  const employee = await employeeService.getEmployeeById(id, req.user.shopId);

  // Non-privileged staff can only fetch their own profile
  const isPrivileged = req.user.role === 'OWNER' || req.user.role === 'MANAGER';
  if (!isPrivileged && employee.email !== req.user.email) {
    throw new ApiError(403, 'Forbidden - Access denied');
  }

  sendResponse(res, 200, EmployeeMapper.toResponse(employee), 'Employee retrieved successfully');
});

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const employee = await employeeService.createEmployee(req.user.shopId, req.user.id, req.body);
  sendResponse(res, 201, EmployeeMapper.toResponse(employee), 'Employee created successfully');
});

export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const id = req.params.id as string;
  const employee = await employeeService.updateEmployee(id, req.user.shopId, req.user.id, req.body);
  sendResponse(res, 200, EmployeeMapper.toResponse(employee), 'Employee updated successfully');
});

export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const id = req.params.id as string;
  const employee = await employeeService.deactivateEmployee(id, req.user.shopId, req.user.id);
  sendResponse(res, 200, EmployeeMapper.toResponse(employee), 'Employee deactivated successfully');
});
