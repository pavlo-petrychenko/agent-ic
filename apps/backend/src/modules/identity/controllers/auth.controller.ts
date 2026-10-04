import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthRoute } from '@/modules/identity/constants/auth-http.constants';
import { AuthRequestGuard } from '@/modules/identity/guards/auth-request.guard';
import {
  bindConfirmationBrowser,
  readConfirmationCookie,
  releaseConfirmationBrowser,
} from '@/modules/identity/helpers/confirmation-cookie.helpers';
import {
  endBrowserSession,
  readRefreshCookie,
  startBrowserSession,
} from '@/modules/identity/helpers/refresh-cookie.helpers';
import type {
  AuthSessionResponse,
  ConfirmEmailRequest,
  LoginInput,
  SignUpInput,
  SignUpResponse,
} from '@/modules/identity/typedefs/account.typedefs';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { HttpCtx } from '@/platform/context/decorators/http-ctx.decorator';
import { UseCaseCtxGuard } from '@/platform/context/guards/use-case-ctx.guard';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Controller(AuthRoute.Base)
@UseGuards(AuthRequestGuard, UseCaseCtxGuard)
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly confirmEmailUseCase: ConfirmEmailUseCase,
  ) {}

  @Post(AuthRoute.SignUp)
  @HttpCode(HttpStatus.OK)
  async signUp(
    @HttpCtx() ctx: UseCaseCtx,
    @Body() body: SignUpInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignUpResponse> {
    return bindConfirmationBrowser(response, await this.signUpUseCase.execute(ctx, body));
  }

  @Post(AuthRoute.Login)
  @HttpCode(HttpStatus.OK)
  async login(
    @HttpCtx() ctx: UseCaseCtx,
    @Body() body: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    return startBrowserSession(response, await this.loginUseCase.execute(ctx, body));
  }

  @Post(AuthRoute.Refresh)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @HttpCtx() ctx: UseCaseCtx,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.refreshSessionUseCase.execute(ctx, {
      refreshToken: readRefreshCookie(request),
    });
    return startBrowserSession(response, session);
  }

  @Post(AuthRoute.Logout)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @HttpCtx() ctx: UseCaseCtx,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(ctx, { refreshToken: readRefreshCookie(request) });
    endBrowserSession(response);
  }

  @Post(AuthRoute.ConfirmEmail)
  @HttpCode(HttpStatus.OK)
  async confirmEmail(
    @HttpCtx() ctx: UseCaseCtx,
    @Body() body: ConfirmEmailRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponse> {
    const session = await this.confirmEmailUseCase.execute(ctx, {
      token: body.token,
      browserBinding: readConfirmationCookie(request),
    });
    releaseConfirmationBrowser(response);
    return startBrowserSession(response, session);
  }
}
