import { Router } from 'express';
import { categoryRouter } from './categories/category.routes';
import { vendorRouter } from './vendors/vendor.routes';
import { inventoryItemRouter } from './items/inventory-item.routes';
import { inventoryCountRouter } from './counts/inventory-count.routes';
import { reportsRouter } from './reports/reports.routes';

const inventoryRouter = Router();

inventoryRouter.use('/categories', categoryRouter);
inventoryRouter.use('/vendors', vendorRouter);
inventoryRouter.use('/counts', inventoryCountRouter);
inventoryRouter.use('/', reportsRouter);
inventoryRouter.use('/', inventoryItemRouter);

export { inventoryRouter };
