import { I18nResolver } from 'nestjs-i18n';
import { ExecutionContext } from '@nestjs/common';
import { Context } from 'telegraf';

export class I18nTelegrafResolver implements I18nResolver {
  async resolve(context: ExecutionContext): Promise<string | undefined> {
    const type = (context.getType() as any) as string;
    if (type !== 'telegraf') return undefined;

    const telegrafCtx = context.getArgByIndex(0) as Context;
    return telegrafCtx.from?.language_code?.split('-')[0] || 'uz';
  }
}
