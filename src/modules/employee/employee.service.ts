import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import type { Database } from 'src/database/database.types';
import {
  systemUser,
  SystemUserStatus,
  SystemUserType,
  userProfile,
} from 'src/database/schema/system';
import { apiResponse } from 'src/common/interceptors/response.interceptor';
import bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}
  async create(
    dto: CreateEmployeeDto,
    tenantId: string,
    createdById: string,
  ) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const employeeWithProfile = await this.db.transaction(async (tx) => {
      const [employee] = await tx
        .insert(systemUser)
        .values({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          type: SystemUserType.EMPLOYEE,
          status: SystemUserStatus.ACTIVE,
          photo: dto.photo,
          tenantId,
          createdById,
          updatedById: createdById,
        })
        .onConflictDoNothing()
        .returning({
          id: systemUser.id,
          name: systemUser.name,
          email: systemUser.email,
          phone: systemUser.phone,
          type: systemUser.type,
          status: systemUser.status,
          photo: systemUser.photo,
          tenantId: systemUser.tenantId,
          createdAt: systemUser.createdAt,
        });

      if (!employee) {
        throw new ConflictException('Email or phone number already exists');
      }

      const [profile] = await tx
        .insert(userProfile)
        .values({
          userId: employee.id,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          emergencyContact: dto.emergencyContact,
          notes: dto.notes,
        })
        .returning();

      return { ...employee, profile };
    });

    return apiResponse(employeeWithProfile, 'Employee created successfully');
  }

  findAll() {
    return `This action returns all employee`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employee`;
  }

  update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    return `This action updates a #${id} employee`;
  }

  remove(id: number) {
    return `This action removes a #${id} employee`;
  }
}
