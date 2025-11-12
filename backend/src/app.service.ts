import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'CPAMaRKeT.Uz API tayyor holatda ishlamoqda.';
  }
}
