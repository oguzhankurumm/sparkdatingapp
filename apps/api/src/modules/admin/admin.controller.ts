import { Controller } from '@nestjs/common'
import type { AdminService } from './admin.service'

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
