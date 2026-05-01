import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve('dist');
const adminRouteDir = resolve(distDir, 'hari-admin');

mkdirSync(adminRouteDir, { recursive: true });
copyFileSync(resolve(distDir, 'admin.html'), resolve(adminRouteDir, 'index.html'));
