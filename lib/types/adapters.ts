import type { ConversionContext, ConversionInput, ConversionOutput } from './conversion';

export interface ConversionAdapter<TOptions> {
  id: string;
  convert: (input: ConversionInput, options: TOptions, ctx: ConversionContext) => Promise<ConversionOutput>;
}
