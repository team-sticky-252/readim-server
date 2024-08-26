import { Injectable, HttpStatus } from "@nestjs/common";
import { map } from "rxjs/operators";

@Injectable()
export default class TransformInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      map((data) => ({
        statusCode:
          context.switchToHttp().getResponse().statusCode || HttpStatus.OK,
        data,
      })),
    );
  }
}
