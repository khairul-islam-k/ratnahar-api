import { BadRequestException, Body, Controller, ParseArrayPipe, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreatePaymentGatewayDto } from "./dto/create-payment_gateway.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AuthUser } from "../auth/types/auth-user.type";
import { PaymentGatewayService } from "./payment_gateway.service";
import { PermissionUserTypeGuard } from "../permission/guards/permission-user-type.guard";
import { RequireUserType } from "../permission/decorators/required-user-decorator";
import { SystemUserType } from "src/database/schema/system";

@Controller('admin-gateway')
@ApiTags('Payment Gateways(Admin)')
export class AdminGatewayController {
    constructor(
        private readonly paymentGatewayService: PaymentGatewayService,
    ) {}

    @Post('bulk')
      @ApiOperation({ summary: 'Create or update multiple tenant payment gateway configs' })
      @UseGuards(JwtAuthGuard, PermissionUserTypeGuard)
      @RequireUserType(SystemUserType.ADMIN)
      @ApiBearerAuth('access-token')
      @ApiBody({ type: [CreatePaymentGatewayDto] })
      createMultipleConfig(
        @CurrentUser() user: AuthUser,
        @Body(new ParseArrayPipe({ items: CreatePaymentGatewayDto }))
        createPaymentGatewayDtos: CreatePaymentGatewayDto[],
      ) {
        if (!user.id) throw new BadRequestException('tenantId is required');
        return this.paymentGatewayService.createMultipleConfig(createPaymentGatewayDtos, user.id);
      }
}