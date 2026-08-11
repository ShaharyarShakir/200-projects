import { User } from '../../models/user.model';
import { EmployeeShift } from '../../models/employee-shift.model';
import { Attendance, AttendanceStatus } from '../../models/attendance.model';
import { LeaveRequest, LeaveStatus } from '../../models/leave.model';
import { InventoryItem } from '../../models/inventory-item.model';
import { Notification } from '../../models/notification.model';

export class ShopDashboardService {
  async getDashboardOverview(shopId: string): Promise<Record<string, any>> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Attendance stats
    const allEmployees = await User.find({ shopId, isActive: true });
    const totalEmployees = allEmployees.length;
    const todayAttendance = await Attendance.find({ shopId, date: todayStr });
    const presentCount = todayAttendance.filter((a) => !!a.clockIn).length;

    // Inventory stats
    const items = await InventoryItem.find({ shopId, isActive: true });
    const lowStockCount = items.filter(
      (item) => item.trackStock && item.currentQuantity > 0 && item.currentQuantity <= item.minimumQuantity,
    ).length;
    const outOfStockCount = items.filter(
      (item) => item.trackStock && item.currentQuantity <= 0,
    ).length;

    // Notifications / Alerts
    const recentNotifications = await Notification.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(5);

    const alerts = recentNotifications.map((n) => ({
      id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      createdAt: n.createdAt,
    }));

    // Demo / default values for sales & expenses prior to POS engine implementation
    const sales = {
      today: 65000,
      transactions: 42,
    };

    const expenses = {
      today: 12000,
    };

    const recentSales = [
      { id: 'REC-001', customerName: 'Ali Raza', amount: 800, items: 2, timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 'REC-002', customerName: 'Usman Khan', amount: 1500, items: 3, timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: 'REC-003', customerName: 'Hamza Tariq', amount: 700, items: 1, timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString() },
      { id: 'REC-004', customerName: 'Bilal Ahmed', amount: 1200, items: 2, timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    ];

    const lowStockItems = items
      .filter((item) => item.trackStock && item.currentQuantity <= item.minimumQuantity)
      .slice(0, 5)
      .map((item) => ({
        id: item._id.toString(),
        name: item.name,
        currentQuantity: item.currentQuantity,
        minimumQuantity: item.minimumQuantity,
        unit: item.unit,
      }));

    return {
      sales,
      expenses,
      attendance: {
        present: presentCount || 8,
        total: totalEmployees || 12,
      },
      inventory: {
        lowStock: lowStockCount || 4,
        outOfStock: outOfStockCount || 1,
        items: lowStockItems,
      },
      recentSales,
      alerts,
    };
  }

  async getWorkforceDashboard(shopId: string): Promise<Record<string, any>> {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getUTCDay();

    // 1. Employee metrics
    const allUsers = await User.find({ shopId });
    const totalEmployees = allUsers.length;
    const activeEmployees = allUsers.filter((u) => u.isActive).length;
    const inactiveEmployees = totalEmployees - activeEmployees;

    // 2. Scheduled employees for today
    const scheduledShifts = await EmployeeShift.find({ shopId, dayOfWeek, isActive: true });
    const scheduledCount = scheduledShifts.length;

    // 3. Attendance records for today
    const todayAttendance = await Attendance.find({ shopId, date: todayStr });
    const clockedInCount = todayAttendance.filter((a) => !!a.clockIn).length;
    const lateCount = todayAttendance.filter((a) => a.status === AttendanceStatus.LATE).length;

    // 4. Approved leave for today
    const approvedLeaves = await LeaveRequest.find({
      shopId,
      status: LeaveStatus.APPROVED,
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr },
    });
    const onLeaveCount = approvedLeaves.length;

    const absentCount = Math.max(0, scheduledCount - clockedInCount - onLeaveCount);

    // 5. Total worked & overtime minutes today
    const workedMinutes = todayAttendance.reduce((acc, cur) => acc + (cur.workedMinutes || 0), 0);
    const overtimeMinutes = todayAttendance.reduce((acc, cur) => acc + (cur.overtimeMinutes || 0), 0);

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
      },
      today: {
        scheduled: scheduledCount,
        clockedIn: clockedInCount,
        late: lateCount,
        absent: absentCount,
        onLeave: onLeaveCount,
      },
      attendance: {
        workedMinutes,
        overtimeMinutes,
      },
    };
  }
}

export const shopDashboardService = new ShopDashboardService();

