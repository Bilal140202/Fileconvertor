export type XlsxToCsvOptions = {
  sheet?: number | string;
};

export declare function xlsxToCsv(input: Uint8Array, options?: XlsxToCsvOptions): Promise<string>;
