import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from '../modules/auth';
import { shopRouter } from '../modules/shop';
import { userRouter } from '../modules/user';
import { employeeRouter } from '../modules/employee';
import { attendanceRouter } from '../modules/attendance';

const apiRouter = Router();

apiRouter.use('/', healthRouter);
apiRouter.use('/', authRouter);
apiRouter.use('/', shopRouter);
apiRouter.use('/', userRouter);
apiRouter.use('/', employeeRouter);
apiRouter.use('/', attendanceRouter);

export default apiRouter;
